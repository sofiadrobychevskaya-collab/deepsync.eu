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
      "You are a senior EU Horizon Europe evaluator scoring the Impact section of a funding proposal, using the OFFICIAL Standard Evaluation Form criterion and the official Standard HE Evaluator Briefing supplied below — not a generic notion of \"impact\".",
      "Base your review ONLY on the call context, official Impact criterion, policy references and evaluator-report examples given to you below — never invent facts, figures, policy names, article numbers or scoring rules that are not in the supplied context.",
      "The official Impact criterion has exactly two aspects (officialImpactCriterion.aspects). If officialImpactCriterion.simplificationNote is present, apply it (do not penalise for things it says are no longer assessed).",
      "Use officialImpactCriterion.evaluatorQuestions as your real checklist — these are the actual questions Commission evaluators are briefed to ask, not a paraphrase.",
      "Use officialImpactCriterion.impactPathwayModel to check whether the text shows the full causal chain (inputs -> results -> dissemination/exploitation -> contribution to outcome -> contribution to impact), not just a bare impact claim. A gap here is a legitimate, specific finding.",
      "CRITICAL — do not hallucinate requirements: if officialImpactCriterion.dnshAndAiRobustnessSimplification is present, do NOT flag missing DNSH (Do No Significant Harm) or AI technical-robustness discussion as a gap unless the supplied call context explicitly says the topic requires it. Treat their absence as normal, not a shortcoming.",
      "Give an indicative score using the official 0-5 scale and its exact wording (officialImpactCriterion.scoringScale) — always frame it as indicative/non-binding, one evaluator's read, never a guarantee. When explaining a gap's severity, use the real official definitions in officialImpactCriterion.scoreDescriptors (minor_shortcoming / shortcoming / significant_weakness) rather than inventing your own severity language.",
      "Write every comment following officialImpactCriterion.consensusReportQualityStandard: relate only to the Impact criterion, be precise and verifiable, never speculative or based on assumptions, and never include improvement recommendations inside 'issue' text (recommendations belong only in the 'fix' field) — this mirrors how real EU consensus reports are required to read.",
      "If the supplied context is too thin to check something, say so explicitly instead of guessing.",
      "Return STRICT JSON ONLY, no markdown fences, matching exactly this shape:",
      "{",
      '  "indicative_score": <number 0-5, half-marks allowed>,',
      '  "score_reasoning": "<one sentence tying the score to the official scale wording for that score>",',
      '  "alignment_summary": "<2-3 sentences on how well the Impact narrative addresses the two official aspects and aligns with the supplied EU policy references>",',
      '  "matched_policies": ["<policy titles from the supplied list that the proposal genuinely connects to, with one clause on how>"],',
      '  "gaps": [{"aspect": "<which of the two official aspects this relates to>", "issue": "<specific gap>", "why_it_matters": "<why an evaluator would flag it>", "fix": "<concrete, specific action>"}],',
      '  "missing_quantified_targets": <true|false>,',
      '  "overall_note": "<one honest sentence — this is a diagnostic aid using the real rubric, not a guaranteed score>"',
      "}"
    ].join("\n");

    var userMessage = [
      "CALL CONTEXT:",
      JSON.stringify(context.call || {}, null, 2),
      "",
      "OFFICIAL IMPACT CRITERION (Horizon Europe Standard Evaluation Form, verbatim — score against this, not a generic notion of impact):",
      JSON.stringify(context.officialImpactCriterion || {}, null, 2),
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
