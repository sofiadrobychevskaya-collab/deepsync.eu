// scripts/deep-ai-check.gs
//
// Google Apps Script backend for the evaluator's opt-in "Deep AI Check".
// This is a THIN PROXY: the browser assembles the grounding context
// (call intelligence + matched EU policy references + ESR examples, all
// already loaded client-side) and sends it here. This script's only job
// is to call the Anthropic API with that context and return Claude's
// structured review — it never stores anything.
//
// SETUP (do this yourself — do not share the API key with anyone):
// 1. Go to script.google.com -> New project. Paste this file's contents in.
// 2. Project Settings (gear icon) -> Script Properties -> Add property:
//      ANTHROPIC_API_KEY = <your key>
// 3. Deploy -> New deployment -> Type: Web app.
//      Execute as: Me
//      Who has access: Anyone
// 4. Copy the deployment URL (ends in /exec) and paste it as
//    DEEP_CHECK_ENDPOINT in evaluator/app.js.
// 5. Every time you edit this script, create a NEW deployment (or use
//    "Manage deployments" -> edit -> New version) for changes to go live.

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || "{}");
    var proposalText = String(body.proposalText || "").slice(0, 9000);
    var context = body.context || {};

    if (!proposalText.trim()) {
      return jsonResponse({ error: "No proposal text was provided." });
    }

    var apiKey = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "Server is not configured (missing ANTHROPIC_API_KEY script property)." });
    }

    var systemPrompt = [
      "You are a senior EU Horizon Europe / Digital Europe / EIC evaluator reviewing the Impact section of a funding proposal.",
      "Base your review ONLY on the call context, policy references and evaluator-report examples given to you below — never invent facts, figures, policy names or article numbers that are not in the supplied context.",
      "If the supplied context is too thin to check something, say so explicitly instead of guessing.",
      "Return STRICT JSON ONLY, no markdown fences, matching exactly this shape:",
      "{",
      '  "alignment_summary": "<2-3 sentences on how well the Impact narrative aligns with the call\'s expected outcomes and the supplied EU policy references>",',
      '  "matched_policies": ["<policy titles from the supplied list that the proposal genuinely connects to, with one clause on how>"],',
      '  "gaps": [{"issue": "<specific gap>", "why_it_matters": "<why an evaluator would flag it>", "fix": "<concrete, specific action>"}],',
      '  "missing_quantified_targets": <true|false>,',
      '  "overall_note": "<one honest sentence — this is a diagnostic aid, not a guaranteed score>"',
      "}"
    ].join("\n");

    var userMessage = [
      "CALL CONTEXT:",
      JSON.stringify(context.call || {}, null, 2),
      "",
      "RELEVANT EU POLICY REFERENCES (only cite these, never others):",
      JSON.stringify(context.policies || [], null, 2),
      context.esrExamples && context.esrExamples.length
        ? "\nEVALUATOR-REPORT PATTERNS FROM PAST CASES:\n" + JSON.stringify(context.esrExamples, null, 2)
        : "",
      "",
      "PROPOSAL IMPACT SECTION TO REVIEW:",
      proposalText
    ].join("\n");

    var response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      muteHttpExceptions: true,
      payload: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1400,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    var status = response.getResponseCode();
    var data = JSON.parse(response.getContentText());

    if (status !== 200) {
      var message = (data && data.error && data.error.message) || ("Anthropic API " + status);
      return jsonResponse({ error: message });
    }

    var text = (data.content || []).filter(function (block) { return block.type === "text"; })
      .map(function (block) { return block.text; }).join("\n");
    var clean = text.replace(/```json|```/g, "").trim();
    var parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (err) {
      return jsonResponse({ error: "Could not parse the AI response.", raw: clean.slice(0, 500) });
    }

    return jsonResponse(parsed);
  } catch (error) {
    return jsonResponse({ error: "Unexpected server error: " + error.message });
  }
}

function jsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
