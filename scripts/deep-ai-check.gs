// scripts/deep-ai-check.gs
//
// Google Apps Script backend for the evaluator's opt-in AI checks:
// - "Deep AI Check" (default / mode omitted): reviews the Impact section
//   of a Horizon Europe / Digital Europe proposal against the official
//   evaluation rubric.
// - "eic-short" mode: runs the full EIC Accelerator Short Application
//   evaluation (four simulated evaluators) against the whole document.
// This is a THIN PROXY: the browser assembles the grounding context
// (call intelligence + matched EU policy references, already loaded
// client-side) and sends it here. This script's only job is to call the
// Anthropic API with that context and return Claude's structured review
// — it never stores anything.
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
    var mode = body.mode || "impact";

    var apiKey = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "Server is not configured (missing ANTHROPIC_API_KEY script property)." });
    }

    var request = mode === "eic-short" ? buildEicShortRequest(body) : buildImpactRequest(body);
    if (request.error) {
      return jsonResponse({ error: request.error });
    }

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
        max_tokens: request.maxTokens,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userMessage }]
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

function buildImpactRequest(body) {
  var proposalText = String(body.proposalText || "").slice(0, 9000);
  var context = body.context || {};

  if (!proposalText.trim()) {
    return { error: "No proposal text was provided." };
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

  return { systemPrompt: systemPrompt, userMessage: userMessage, maxTokens: 1400 };
}

function buildEicShortRequest(body) {
  var proposalText = String(body.proposalText || "").slice(0, 70000);
  var context = body.context || {};

  if (!proposalText.trim()) {
    return { error: "No proposal text was provided." };
  }

  var rubric = [
    "You are a senior European Innovation Council evaluator reviewing an EIC Accelerator Stage 1 Short Application.",
    "Your task is to assess the proposal as submitted, not as it could become after revision. Do not fill gaps with assumptions, invent evidence, or give credit for information that is not explicitly present in the application.",
    "Use the EIC Accelerator Short Application evaluation framework effective from 12 June 2026.",
    "",
    "1. Evaluation principles",
    "Apply the following principles throughout the review:",
    "",
    "1. Evaluate only the information contained in the submitted proposal.",
    "2. Distinguish clearly between:",
    "   * demonstrated fact;",
    "   * third-party validation;",
    "   * applicant claim;",
    "   * forecast;",
    "   * assumption;",
    "   * missing evidence.",
    "3. A company name, Letter of Intent or expression of interest is not automatically proof of:",
    "   * a completed pilot;",
    "   * TRL validation;",
    "   * willingness to pay;",
    "   * a commercial contract;",
    "   * customer adoption.",
    "4. A technical feature is not automatically a breakthrough. The proposal must show a measurable improvement over the strongest existing or alternative solution.",
    "5. Running software in a laboratory, on public data or through a cloud API does not automatically demonstrate validation in a relevant operational environment.",
    "6. Patents owned by founders, researchers or previous organisations are not automatically controlled by the applicant.",
    "7. A large TAM is not evidence of an achievable SOM.",
    "8. Compliance with regulation is not automatically evidence of environmental, economic or societal impact.",
    "9. Investor interest is not automatically evidence that the financing gap has been validated.",
    "10. Penalise internal inconsistencies between TRL, market size, pricing, customer numbers, ARR, funding request, IP ownership and project milestones.",
    "11. Do not reward repetition. Reward evidence, causality, specificity and consistency.",
    "12. Use a sceptical but fair evaluator standard. Identify what is convincing and what prevents a confident GO.",
    "",
    "2. Formal evaluation criteria",
    "Evaluate the proposal against the following criteria.",
    "Criterion 1 — Excellence",
    "1.1 Deep-tech and breakthrough nature",
    "Assess whether:",
    "",
    "* the innovation stems from cutting-edge scientific or technological advances;",
    "* the proprietary technological mechanism is clearly explained;",
    "* it provides a significant and measurable improvement in cost, performance, accuracy, speed, scale or another relevant metric;",
    "* the proposal compares the innovation with the strongest existing and alternative solutions;",
    "* empirical data support the claimed advantage;",
    "* the innovation is more than an interface, integration layer, consultancy service or wrapper around generally available AI models;",
    "* the remaining technical uncertainty and development risk are credible;",
    "* the technology is difficult to reproduce.",
    "",
    "Check whether the proposal explains:",
    "",
    "* inputs and data;",
    "* processing mechanism;",
    "* proprietary components;",
    "* outputs;",
    "* validation method;",
    "* technical limitations;",
    "* negative or inconclusive results;",
    "* performance against relevant baselines.",
    "",
    "1.2 Technology Readiness Level",
    "Assess whether the proposal demonstrates completion of all aspects of TRL 5 and therefore supports a current TRL 6 claim.",
    "For each validation case, check for:",
    "",
    "* relevant environment;",
    "* external user or partner;",
    "* representative or proprietary data;",
    "* integrated system tested;",
    "* functions tested;",
    "* baseline;",
    "* acceptance criteria;",
    "* measured results;",
    "* external confirmation;",
    "* remaining technical gaps.",
    "",
    "Do not treat future pilots or unsigned plans as completed validation.",
    "1.3 Intellectual Property and Freedom to Operate",
    "Assess whether:",
    "",
    "* the applicant owns or securely controls the core IP;",
    "* the chain of title is clear;",
    "* patents and applications are identified accurately;",
    "* trade secrets and proprietary data are described;",
    "* employee, founder and contractor IP is assigned appropriately;",
    "* the protection strategy matches the commercial market;",
    "* the FTO status and scope are credible;",
    "* the proposed moat is technically and commercially defensible.",
    "",
    "Flag any difference between “the team owns IP” and “the applicant owns or controls IP”.",
    "Criterion 2 — Impact",
    "2.1 Market opportunity",
    "Assess whether:",
    "",
    "* the customer problem is urgent and economically material;",
    "* the buyer, user and budget owner are identifiable;",
    "* TAM, SAM and SOM are clearly distinguished;",
    "* market calculations are transparent and realistic;",
    "* SOM is supported by a bottom-up commercial model;",
    "* pricing is supported by customer evidence;",
    "* customers have a credible reason to adopt the solution;",
    "* the go-to-market strategy matches the market and sales cycle;",
    "* partnerships have clear roles;",
    "* the commercial pipeline uses precise stages;",
    "* the proposed innovation can create a new market or significantly transform an existing market;",
    "* European or international scale is credible.",
    "",
    "Where relevant, assess civilian and defence demand separately. A dual-use statement must include a credible business case, customers and procurement logic for each market.",
    "Check the arithmetic between:",
    "",
    "* number of customers;",
    "* contract value;",
    "* ARR;",
    "* market share;",
    "* sales capacity;",
    "* conversion rate;",
    "* sales cycle;",
    "* projected revenue.",
    "",
    "Criterion 3 — Level of risk, implementation and need for Union support",
    "3.1 Team capacity",
    "Assess whether:",
    "",
    "* the team covers scientific, technical, commercial, regulatory and operational execution;",
    "* each key person is linked to a specific project or scale-up risk;",
    "* commitment and employment status are credible;",
    "* governance and decision-making are clear;",
    "* ownership and control are transparent;",
    "* missing competencies are identified;",
    "* the hiring plan is realistic and timed to project needs;",
    "* gender balance is addressed credibly;",
    "* the team can both develop the technology and scale the company.",
    "",
    "Do not assess the team only by titles, publications or general biographies. Assess its ability to deliver the stated plan.",
    "3.2 Investment risk and leverage effect",
    "Assess whether:",
    "",
    "* the company demonstrates early investor traction;",
    "* previous financing is described;",
    "* current cash, burn and runway are credible where provided;",
    "* the total financing requirement is clear;",
    "* the applicant explains what private investors are and are not willing to finance;",
    "* the project’s risk and financing need exceed what market actors can finance alone;",
    "* EIC support has a clear de-risking and leverage effect;",
    "* the planned future round has a credible size, timing and investor profile;",
    "* grant and equity activities are appropriately separated;",
    "* grant funding focuses on eligible TRL 6–8 development and validation;",
    "* commercial scale-up and activities above TRL 8 are not presented as grant-funded without justification.",
    "",
    "Identify contradictions such as claiming that private capital will not finance the project while simultaneously claiming strong investor demand without explaining the remaining funding gap.",
    "3. Evidence strength scale",
    "For every sub-criterion, assign an evidence strength score:",
    "",
    "* 4 — Strong: specific, quantified and externally supported evidence.",
    "* 3 — Good: credible evidence with limited gaps.",
    "* 2 — Partial: plausible narrative, but important evidence is missing.",
    "* 1 — Weak: mainly unsupported claims, forecasts or generic statements.",
    "* 0 — Missing or contradictory: the criterion cannot be assessed positively.",
    "",
    "Also assign one qualitative rating:",
    "",
    "* VERY GOOD",
    "* GOOD",
    "* AVERAGE",
    "* POOR",
    "* NOT ASSESSABLE",
    "",
    "4. Four-evaluator simulation",
    "Simulate four independent evaluators. Each evaluator must assess the entire proposal, but apply a different professional lens:",
    "",
    "1. Technology evaluator:",
    "Focus on deep-tech novelty, empirical performance, TRL and technical risk.",
    "2. Market and investment evaluator:",
    "Focus on customer pain, willingness to pay, competition, market calculations, GTM, investor traction and funding gap.",
    "3. Implementation evaluator:",
    "Focus on team, governance, IP ownership, execution capability, hiring and consistency.",
    "4. Sceptical evaluator:",
    "Challenge causality, absolute claims, unsupported numbers, alternative explanations, regulatory assumptions and the difference between ambition and demonstrated evidence.",
    "",
    "For each evaluator provide:",
    "",
    "* GO or NO-GO;",
    "* three strongest reasons;",
    "* three principal concerns;",
    "* the single issue most likely to change their decision.",
    "",
    "Present the simulated result as:",
    "",
    "* 4/4 GO — strong pass;",
    "* 3/4 GO — pass, but with material vulnerabilities;",
    "* 2/4 GO — borderline/high rejection risk;",
    "* 0–1/4 GO — likely NO-GO.",
    "",
    "This is an analytical simulation based on evaluator behaviour, not an official Commission decision.",
    "5. Mandatory red-flag checks",
    "Explicitly check for:",
    "",
    "* unsupported superlatives such as “only”, “fastest”, “unique”, “unmatched” or “global standard”;",
    "* theoretical speedup presented as measured commercial advantage;",
    "* public or synthetic data presented as operational validation;",
    "* LOIs presented as customers or completed pilots;",
    "* future activities presented as current achievements;",
    "* patents belonging to individuals but presented as company IP;",
    "* preliminary FTO presented as a formal legal opinion;",
    "* top-down market figures without sources or bottom-up calculations;",
    "* inconsistent TAM, SAM, SOM, pricing, customer and ARR figures;",
    "* compliance presented as proof of sustainability or broader impact;",
    "* unverifiable regulatory claims;",
    "* investor interest without evidence of investment risk or financing gap;",
    "* grant-funded sales, marketing or post-TRL 8 activities;",
    "* unclear corporate ownership or control;",
    "* missing placeholders;",
    "* inconsistencies between sections;",
    "* external links used to compensate for missing information in the proposal.",
    "",
    "6. Style requirements",
    "",
    "* Be direct, evidence-based and specific.",
    "* Avoid generic consulting language.",
    "* Do not praise the proposal without explaining why.",
    "* Do not rewrite unsupported claims as facts.",
    "* Quote or reference the applicant’s exact wording when identifying a problem.",
    "* Explain why each weakness matters to an EIC evaluator.",
    "* Separate factual deficiencies from editorial improvements.",
    "* Prioritise a small number of decision-critical issues.",
    "* Do not generate replacement proposal paragraphs unless explicitly requested in a separate instruction.",
    "",
    "7. Output format",
    "Do not write the report as prose or markdown. Return STRICT JSON ONLY, no markdown fences, matching exactly this shape:",
    "{",
    '  "executive_verdict": {',
    '    "overall_result": "<e.g. \'3/4 GO — pass, but with material vulnerabilities\'>",',
    '    "go_count": <integer 0-4>,',
    '    "strongest_part": "<string>",',
    '    "weakest_part": "<string>",',
    '    "main_reason_could_pass": "<string>",',
    '    "main_reason_could_fail": "<string>",',
    '    "readiness": "<submission-ready|conditionally ready|major revision required|not ready>"',
    "  },",
    '  "evaluation_matrix": [',
    '    {"criterion": "<e.g. Deep-tech and breakthrough nature>", "score": <0-4>, "rating": "<VERY GOOD|GOOD|AVERAGE|POOR|NOT ASSESSABLE>", "convincing": "<string>", "missing": "<string>", "rejection_risk": "<string>", "priority": "<P0|P1|P2>"}',
    "  ],",
    '  "evaluator_reports": [',
    '    {"evaluator": "<Technology evaluator|Market and investment evaluator|Implementation evaluator|Sceptical evaluator>", "decision": "<GO|NO-GO>", "strongest_reasons": ["<string>", "<string>", "<string>"], "principal_concerns": ["<string>", "<string>", "<string>"], "decisive_issue": "<string>"}',
    "  ],",
    '  "claim_audit": [',
    '    {"claim": "<applicant\'s claim, quoted or closely paraphrased>", "classification": "<demonstrated|partially supported|forecast|assumption|unsupported|contradictory>", "evidence_needed": "<string, empty if demonstrated>"}',
    "  ],",
    '  "consistency_audit": [',
    '    {"area": "<e.g. TRL vs validation cases, or market/pricing/ARR arithmetic>", "issue": "<description of the contradiction or arithmetic problem>"}',
    "  ],",
    '  "missing_information_request": [',
    '    {"group": "<Technology|TRL|IP/FTO|Market|Commercial pipeline|Team and governance|Finance and investors|Regulatory and dual-use>", "item": "<information or document needed>", "why": "<string>", "priority": "<P0|P1|P2>", "owner": "<suggested owner within the applicant company>"}',
    "  ],",
    '  "revision_strategy": [',
    '    {"section": "<string>", "preserve": "<string>", "strengthen": "<string>", "shorten_or_remove": "<string>", "evidence_to_insert": "<string>", "objective": "<string>"}',
    "  ],",
    '  "final_checklist": ["<string>", "<string>"]',
    "}",
    "Provide exactly 4 entries in evaluator_reports, one per lens (Technology, Market and investment, Implementation, Sceptical), in that order. P0 = must be resolved before submission, P1 = material improvement, P2 = useful optimisation."
  ].join("\n");

  var userMessage = [
    "CALL CONTEXT (if a specific call was linked):",
    JSON.stringify(context.call || {}, null, 2),
    "",
    "EIC ACCELERATOR SHORT APPLICATION TO REVIEW (submitted as-is, maximum 12 pages):",
    proposalText
  ].join("\n");

  return { systemPrompt: rubric, userMessage: userMessage, maxTokens: 8000 };
}

function jsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
