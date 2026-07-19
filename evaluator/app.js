let pdfjsPromise;
let mammothPromise;
const leadEndpoint = "https://script.google.com/a/macros/deep-sync.eu/s/AKfycbwGqnv6UtLY_7R3h0pKrcuki8Ra9pgIIMfOkVNKrqwkD2JBmDI5EB3azHdmQntPxTc/exec";

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs").then(module => {
      module.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      return module;
    });
  }
  return pdfjsPromise;
}

async function getMammoth() {
  if (!mammothPromise) {
    mammothPromise = new Promise((resolve, reject) => {
      if (window.mammoth) return resolve(window.mammoth);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js";
      script.onload = () => resolve(window.mammoth);
      script.onerror = () => reject(new Error("The DOCX parser could not be loaded."));
      document.head.appendChild(script);
    });
  }
  return mammothPromise;
}

const els = {
  intro: document.querySelector("#intro"),
  form: document.querySelector("#evaluation-form"),
  file: document.querySelector("#proposal-file"),
  dropzone: document.querySelector("#dropzone"),
  fileTitle: document.querySelector("#file-title"),
  fileSubtitle: document.querySelector("#file-subtitle"),
  analyse: document.querySelector("#analyse-button"),
  error: document.querySelector("#form-error"),
  loading: document.querySelector("#loading-view"),
  loadingTitle: document.querySelector("#loading-title"),
  loadingDetail: document.querySelector("#loading-detail"),
  progress: document.querySelector("#progress-bar"),
  results: document.querySelector("#results"),
  title: document.querySelector("#proposal-title"),
  meta: document.querySelector("#proposal-meta"),
  total: document.querySelector("#total-score"),
  confidence: document.querySelector("#score-confidence"),
  criterionScores: document.querySelector("#criterion-scores"),
  warnings: document.querySelector("#analysis-warnings"),
  emailGate: document.querySelector("#email-gate"),
  emailGateForm: document.querySelector("#email-gate-form"),
  reportEmail: document.querySelector("#report-email"),
  emailConsent: document.querySelector("#email-consent"),
  consortiumInterest: document.querySelector("#consortium-interest"),
  emailGateError: document.querySelector("#email-gate-error"),
  unlockReport: document.querySelector("#unlock-report"),
  detailedResults: document.querySelector("#detailed-results"),
  feedbackBar: document.querySelector("#feedback-bar"),
  findings: document.querySelector("#findings-list"),
  criticalCount: document.querySelector("#critical-count"),
  strengthCount: document.querySelector("#strength-count"),
  newAnalysis: document.querySelector("#new-analysis"),
  printReport: document.querySelector("#print-report"),
  feedbackLink: document.querySelector("#feedback-link")
};

let selectedFile = null;
let activeFindings = [];
let currentAnalysis = null;

const patterns = [
  {
    id: "objective-as-output",
    criterion: "Excellence",
    kind: "priority",
    severity: 0.28,
    title: "An objective may describe a mechanism, not an outcome",
    test: text => /objective.{0,500}(implement|establish|develop|create).{0,140}(framework|methodology|platform|toolkit)/is.test(text),
    location: text => locate(text, /(implement|establish|develop|create).{0,140}(framework|methodology|platform|toolkit)/is),
    explanation: "Evaluators often distinguish between a project objective and the instrument used to achieve it. A framework or methodology is usually an output unless its user-level change is explicit.",
    recommendation: "Reframe the objective around a measurable change for a named target group. Keep the framework as the means of achieving and verifying that outcome."
  },
  {
    id: "late-baseline",
    criterion: "Excellence",
    kind: "priority",
    severity: 0.30,
    title: "Some KPI baselines appear to be defined during the project",
    test: text => /(baseline|target value).{0,100}(defined|confirmed|established|set).{0,80}(M[1-9]|later|project)/is.test(text) || /vs\.? baseline.{0,80}(D\d\.\d|M[1-9])/is.test(text),
    location: text => locate(text, /(baseline|target value).{0,180}(M[1-9]|D\d\.\d|later)/is),
    explanation: "If success thresholds are fixed after implementation starts, evaluators may question whether stage gates are objective and whether the work can progress on schedule.",
    recommendation: "Provide current baselines, target values, data sources and owners at submission. Clearly isolate any values that genuinely require an inception-period calibration."
  },
  {
    id: "trl-progression",
    criterion: "Excellence",
    kind: "priority",
    severity: 0.34,
    title: "TRL ambition is visible, but component-level progression may be unclear",
    test: text => /TRL\s*[2-5].{0,40}(to|→|-).{0,25}TRL\s*[6-9]/is.test(text) && !/(component|technology component).{0,300}(initial|entry).{0,100}TRL/is.test(text),
    location: text => locate(text, /TRL\s*[2-5].{0,40}(to|→|-).{0,25}TRL\s*[6-9]/is),
    explanation: "Repeating an overall TRL trajectory does not prove that every critical technology component reaches the call's expected maturity.",
    recommendation: "Add a component-level matrix with initial TRL evidence, development step, validation environment, gate criteria and final TRL for every critical component."
  },
  {
    id: "regulatory-documents",
    criterion: "Impact",
    kind: "priority",
    severity: 0.32,
    title: "Regulatory impact relies heavily on documents and templates",
    test: text => /regulatory impact/is.test(text) && /(white paper|template|guidance|documentation)/is.test(text),
    location: text => locate(text, /regulatory impact.{0,400}/is),
    explanation: "Publication is an output. It does not by itself demonstrate that regulators, SMEs or procurement teams will adopt the material or change a decision.",
    recommendation: "Add an adoption pathway: named users, integration into a real compliance or procurement process, usage targets, independent validation and measured time or cost reduction."
  },
  {
    id: "weak-industry-commitment",
    criterion: "Impact",
    kind: "priority",
    severity: 0.36,
    title: "Commercial uptake depends on a future expression of intent",
    test: text => /(letter of intent|LoI).{0,60}(M[1-3][0-9]|deliverable)/is.test(text),
    location: text => locate(text, /(letter of intent|LoI).{0,100}(M[1-3][0-9]|deliverable)/is),
    explanation: "A letter of intent planned near the end of the project is weaker than an industrial commitment secured at submission and tied to a decision gate.",
    recommendation: "Secure pre-submission commitments where possible. Define pilot budget, decision owner, minimum number of pilots, entry conditions and procurement decision timing."
  },
  {
    id: "genai-baseline",
    criterion: "Excellence",
    kind: "improvement",
    severity: 0.22,
    title: "The proposal should prove why GenAI outperforms strong alternatives",
    test: text => /generative AI|GenAI/i.test(text) && !/(classical ML|conventional ML|optimisation baseline|optimization baseline)/i.test(text),
    location: text => locate(text, /generative AI|GenAI/i),
    explanation: "For operational use cases, evaluators may expect a clear comparison with classical ML, optimisation or rules-based approaches rather than a conceptual novelty claim.",
    recommendation: "For each use case, state the strongest baseline, comparative experiment, superiority threshold, integration architecture and conditions where GenAI is not appropriate."
  },
  {
    id: "open-science",
    criterion: "Excellence",
    kind: "strength",
    severity: -0.12,
    title: "Open science and reusable outputs are concretely addressed",
    test: text => /(FAIR|open science).{0,500}(DOI|open licence|open license|repository|AI-on-Demand)/is.test(text),
    location: text => locate(text, /(FAIR|open science).{0,220}(DOI|open licence|open license|repository|AI-on-Demand)/is),
    explanation: "The proposal connects open-science commitments to concrete publication routes and reusable outputs.",
    recommendation: "Preserve the named repositories, licensing choices, timing and ownership in the final version."
  },
  {
    id: "risk-management",
    criterion: "Implementation",
    kind: "strength",
    severity: -0.14,
    title: "Risk management includes operationally relevant threats",
    test: text => /(critical risk|risk management).{0,1000}(mitigation|contingency)/is.test(text),
    location: text => locate(text, /(critical risk|risk management)/i),
    explanation: "Specific operational risks and mitigation measures strengthen delivery credibility.",
    recommendation: "Keep each mitigation linked to an owner, trigger, timing and fallback route."
  },
  {
    id: "measurable-objectives",
    criterion: "Excellence",
    kind: "strength",
    severity: -0.10,
    title: "Objectives include measurable verification signals",
    test: text => /(objective|O1).{0,1200}(means of verification|KPI)/is.test(text),
    location: text => locate(text, /(means of verification|KPI)/i),
    explanation: "Quantified and verifiable objectives make the proposal easier to assess and monitor.",
    recommendation: "Check that every KPI also has a current baseline, target, data source, owner and measurement date."
  },
  {
    id: "industrial-role",
    criterion: "Implementation",
    kind: "strength",
    severity: -0.10,
    title: "Industrial partners have visible roles in the delivery chain",
    test: text => /(industry partner|industrial partner|operator).{0,900}(dataset|use.case|baseline|pilot|procurement)/is.test(text),
    location: text => locate(text, /(industry partner|industrial partner|operator)/i),
    explanation: "Named contributions to datasets, use cases, validation or deployment support consortium credibility.",
    recommendation: "Ensure these roles are consistent across tasks, deliverables, person-months and letters of commitment."
  },
  {
    id: "digital-pilot-additionality",
    criterion: "Relevance",
    kind: "priority",
    severity: 0.28,
    title: "Additionality beyond the source pilots needs stronger evidence",
    test: text => /SUPPLY-AI/i.test(text) && /(documentation|evidence pack|replication asset)/i.test(text),
    location: text => locate(text, /(added value|SUPPLY-AI)/i),
    explanation: "Building documentation and replication assets from existing pilots can look incremental unless the proposal proves which missing EU-level capability and decisions it uniquely enables.",
    recommendation: "Add a pilot-versus-CSA capability map with unique users, decision points, outputs, owners and verified adoption outcomes."
  },
  {
    id: "digital-demand-signal",
    criterion: "Relevance",
    kind: "improvement",
    severity: 0.20,
    title: "Non-binding demand signals need an end-to-end usage example",
    test: text => /non-binding demand signal/i.test(text),
    location: text => locate(text, /non-binding demand signal/i),
    explanation: "Defining the term and its boundaries does not fully show how it changes a public-administration or supplier decision.",
    recommendation: "Include a completed demand-package example and trace it from identified need through matchmaking to a documented follow-up decision."
  },
  {
    id: "digital-supply-causality",
    criterion: "Relevance",
    kind: "priority",
    severity: 0.26,
    title: "Demand aggregation is not yet a complete EU supply-chain mechanism",
    test: text => /digital technology supply chain/i.test(text) && /(demand side|pooling demand|demand signals)/i.test(text),
    location: text => locate(text, /digital technology supply chain/i),
    explanation: "A stronger evaluator case links demand activities to measurable advantages for European suppliers relative to non-European alternatives.",
    recommendation: "Add supplier-side targets, European-origin safeguards, procurement opportunity metrics and evidence that EU startups can act on the aggregated demand."
  },
  {
    id: "digital-readiness-proof",
    criterion: "Implementation",
    kind: "improvement",
    severity: 0.18,
    title: "Operational readiness claims need visible artefacts",
    test: text => /asset factory/i.test(text) && /(consolidated|ready from Month 1|set-up ready)/i.test(text),
    location: text => locate(text, /asset factory/i),
    explanation: "A claim that templates, taxonomy and governance are ready is more credible when the proposal shows those artefacts rather than only describing them.",
    recommendation: "Show a sample template, taxonomy excerpt, version-control rule, QA flow and one completed example."
  },
  {
    id: "digital-uptake-target",
    criterion: "Impact",
    kind: "priority",
    severity: 0.28,
    title: "Activity metrics may not prove verified replication or scaling",
    test: text => /evidence.{0,30}assets.{0,30}uptake/is.test(text) && /(logs|evidence trails|helpdesk|events)/i.test(text),
    location: text => locate(text, /evidence.{0,30}assets.{0,30}uptake/is),
    explanation: "Events, requests and interactions are useful, but the main outcome is actual use of assets that results in a pilot being replicated or scaled.",
    recommendation: "Commit to a verified replication/scaling target with baseline, evidence rules, responsible partner and measurement date."
  },
  {
    id: "model-transferability",
    criterion: "Excellence",
    kind: "priority",
    severity: 0.28,
    title: "Model transferability across contexts needs a validation protocol",
    test: text => /(XAI|explainable AI)/i.test(text) && /(diverse crops|multiple crops|multi-country|diverse conditions)/i.test(text) && !/(transferability|generalisation|generalization).{0,500}(protocol|test|metric|validation)/is.test(text),
    location: text => locate(text, /(XAI|explainable AI)/i),
    explanation: "A multi-context AI claim needs evidence showing how accuracy, calibration and failure modes will be controlled across sites, crops or user groups.",
    recommendation: "Add leave-one-site/crop-out validation, domain-shift thresholds, recalibration rules, failure analysis and go/no-go gates for every deployment context."
  },
  {
    id: "wp-dependencies",
    criterion: "Implementation",
    kind: "improvement",
    severity: 0.22,
    title: "Work-package dependencies may not be explicit enough",
    test: text => /(work package|WP1)/i.test(text) && !/(dependency|dependencies|interdependen|input-output map)/i.test(text),
    location: text => locate(text, /(work plan|work package|WP1)/i),
    explanation: "A detailed set of work packages can still leave evaluators uncertain about which outputs gate downstream tasks and which partners contribute to each hand-off.",
    recommendation: "Add an input-output dependency map with source task, receiving task, hand-off month, acceptance criterion and participating partners."
  },
  {
    id: "fstp-selection-detail",
    criterion: "Implementation",
    kind: "improvement",
    severity: 0.20,
    title: "FSTP selection needs a fully auditable scoring process",
    test: text => /Financial Support to Third Parties|FSTP/i.test(text) && !/(tie.break|appeal procedure|conflict.of.interest).{0,800}(score|selection|review)/is.test(text),
    location: text => locate(text, /Financial Support to Third Parties|FSTP/i),
    explanation: "General eligibility and selection criteria do not always establish how proposals are scored, moderated, ranked, tied and challenged.",
    recommendation: "Specify criterion weights, thresholds, reviewer count, moderation, conflict checks, tie-breaks, appeal route and the evidence retained for audit."
  },
  {
    id: "eic-delayed-ip",
    criterion: "Excellence",
    kind: "priority",
    severity: 0.28,
    title: "Delaying formal IP protection increases imitation risk",
    test: text => /(patent|filing).{0,120}(deferred|delayed|TRL\s*8|later)/is.test(text),
    location: text => locate(text, /(patent|filing).{0,120}(deferred|delayed|TRL\s*8|later)/is),
    explanation: "For an EIC deep-tech claim, trade secrets and future filings may not sufficiently demonstrate defensibility during early commercialisation.",
    recommendation: "Define immediate priority filings, jurisdiction coverage, dataset/database rights, open-source controls, FTO refresh timing and ownership of every core asset."
  },
  {
    id: "eic-eu-leadership",
    criterion: "Impact",
    kind: "improvement",
    severity: 0.22,
    title: "European leadership and societal impact need dedicated evidence",
    test: text => /EIC Accelerator|HORIZON-EIC/i.test(text) && !/(European technological leadership|strategic dependenc|societal impact).{0,700}(KPI|target|jobs|quantif)/is.test(text),
    location: text => locate(text, /(expected impact|broader impact|European)/i),
    explanation: "Commercial and environmental value does not automatically demonstrate European technological leadership or wider societal impact.",
    recommendation: "Quantify EU jobs, European value-chain control, reduced external dependency, regulatory leadership and measurable social outcomes."
  },
  {
    id: "eic-esop-strength",
    criterion: "Implementation",
    kind: "strength",
    severity: -0.12,
    title: "A quantified employee ownership and retention mechanism is present",
    test: text => /(ESOP|Employee Stock Ownership Plan).{0,500}(vesting|shareholding|%)/is.test(text),
    location: text => locate(text, /(ESOP|Employee Stock Ownership Plan)/i),
    explanation: "A documented pool, vesting logic and retention plan support team incentive credibility in the written application.",
    recommendation: "Prepare interview evidence showing allocation rules, key technical staff coverage and how the plan competes with market alternatives."
  },
  {
    id: "csa-corporate-lock-in",
    criterion: "Excellence",
    kind: "priority",
    severity: 0.26,
    title: "A single corporate pathway may constrain ecosystem diversity",
    test: text => /(co-innovation program|corporate partner).{0,700}(selected|startups|accelerat)/is.test(text),
    location: text => locate(text, /(co-innovation program|corporate partner)/i),
    explanation: "A strong industrial anchor can still create technology lock-in if startup progression depends mainly on one company's technology stack or programme.",
    recommendation: "Add multiple industrial pathways, vendor-neutral selection safeguards, alternative scale-up routes and diversity KPIs across technologies and markets."
  },
  {
    id: "csa-activity-kpis",
    criterion: "Excellence",
    kind: "improvement",
    severity: 0.18,
    title: "Workshop and seminar KPIs measure attendance more than progress",
    test: text => /(business lectures|technical seminars|workshops).{0,500}(attendance|number|at least)/is.test(text),
    location: text => locate(text, /(business lectures|technical seminars|workshops)/i),
    explanation: "Counts and attendance verify delivery, but do not show whether participants acquire, apply or retain the intended capability.",
    recommendation: "Add baseline-to-exit skill change, application evidence, milestone completion, participant progression and post-programme outcome metrics."
  },
  {
    id: "csa-impact-categories",
    criterion: "Impact",
    kind: "priority",
    severity: 0.24,
    title: "Broad impact categories need direct call-outcome mapping",
    test: text => /Scientific\s*Impact/i.test(text) && /Societal\s*Impact/i.test(text) && /(Economic|Technological)\s*Impact/i.test(text),
    location: text => locate(text, /Scientific\s*Impact/i),
    explanation: "Grouping claims as scientific, economic and societal can obscure which call outcome is achieved, at what scale and through which causal pathway.",
    recommendation: "Map every expected outcome to a project output, target group, behavioural change, quantified beneficiary reach, evidence source and long-term impact."
  },
  {
    id: "csa-transdisciplinarity",
    criterion: "Implementation",
    kind: "improvement",
    severity: 0.16,
    title: "Consortium breadth may not demonstrate transdisciplinary integration",
    test: text => /(university|academic).{0,1200}(industry|commercial partner)/is.test(text) && !/transdisciplin/i.test(text),
    location: text => locate(text, /(consortium|List of participants|university)/i),
    explanation: "Academic-industry participation is valuable, but evaluators may still expect integration of additional disciplines and actors relevant to the programme's societal and ecosystem outcomes.",
    recommendation: "Identify missing disciplines and end-user perspectives, then show how they influence tasks, selection, mentoring, evaluation and impact measurement."
  }
];


function locate(text, regex) {
  const match = text.match(regex);
  if (!match || match.index == null) return "Proposal text";
  const before = text.slice(0, match.index);
  const page = (before.match(/\[PAGE \d+\]/g) || []).at(-1);
  const section = [...before.matchAll(/\b(1\.?\s*Excellence|2\.?\s*Impact|3\.?\s*Quality and efficiency|3\.?\s*Implementation)\b/gi)].at(-1);
  return [section?.[1], page?.replace(/[\[\]]/g, "")].filter(Boolean).join(" · ") || "Proposal text";
}

function setFile(file) {
  els.error.hidden = true;
  if (!file) return;
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) return showError("Please choose a PDF or DOCX file.");
  if (file.size > 50 * 1024 * 1024) return showError("The document is larger than 50 MB.");
  selectedFile = file;
  els.fileTitle.textContent = file.name;
  els.fileSubtitle.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · ready for local analysis`;
  els.dropzone.classList.add("has-file");
  els.analyse.disabled = false;
}

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = false;
}

async function extractPdf(file) {
  const pdfjsLib = await getPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(`[PAGE ${i}]\n${content.items.map(item => item.str).join(" ")}`);
    updateLoading(10 + Math.round((i / pdf.numPages) * 48), `Reading page ${i} of ${pdf.numPages}`);
  }
  return { text: pages.join("\n"), pages: pdf.numPages };
}

async function extractDocx(file) {
  updateLoading(18, "Reading Word document structure");
  const mammoth = await getMammoth();
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return { text: result.value, pages: null };
}

function programmeName(programme) {
  return programme === "digital"
    ? "Digital Europe"
    : programme === "eic"
      ? "EIC Accelerator Open"
      : programme === "horizon-csa"
        ? "Horizon Europe CSA"
        : "Horizon Europe RIA / IA";
}

function detectProgramme(text) {
  const source = `${selectedFile?.name || ""}\n${text.slice(0, 20000)}`;
  if (/EIC\s*Accelerator|EIC-ACC|stage\s*2\s*-?\s*full\s*application/i.test(source)) return "eic";
  if (/Digital Europe|\bDIGITAL-20\d{2}-/i.test(source)) return "digital";
  if (/Horizon Europe|\bHORIZON-/i.test(source)) return "horizon";
  return null;
}

function evidenceGapFinding(criterion) {
  const guidance = {
    Relevance: "Add an explicit call-requirement matrix linking each expected outcome to activities, deliverables, target groups and measurable evidence.",
    Excellence: "Make the ambition, state of the art, methodology, assumptions and validation evidence explicit and easy for an evaluator to trace.",
    Impact: "Show the complete output-to-outcome pathway with baselines, quantified targets, beneficiaries, attribution and verification sources.",
    Implementation: "Make work-package dependencies, task ownership, resources, milestones, risks and acceptance criteria explicit.",
    "Risk & implementation": "Provide technical, commercial and execution risks with evidence, owners, triggers, mitigations, resources and decision gates."
  };
  return {
    criterion,
    kind: "priority",
    severity: 0,
    title: `Insufficient evidence detected for ${criterion}`,
    location: "Document coverage check",
    explanation: `The parser did not find enough criterion-specific evidence to justify a high ${criterion} score. This may mean the section is missing, too implicit, image-based, or was not extracted from the uploaded file.`,
    recommendation: guidance[criterion] || "Make the criterion evidence explicit and upload a complete text-searchable proposal."
  };
}

function analyseText(text, programme, pages) {
  const findings = patterns.filter(pattern => pattern.test(text)).map(pattern => ({
    ...pattern,
    criterion: programme === "digital" && pattern.criterion === "Excellence"
      ? "Relevance"
      : programme === "eic" && pattern.criterion === "Implementation"
        ? "Risk & implementation"
        : pattern.criterion,
    location: pattern.location(text)
  }));
  const criteria = programme === "digital"
    ? ["Relevance", "Implementation", "Impact"]
    : programme === "eic"
      ? ["Excellence", "Impact", "Risk & implementation"]
      : ["Excellence", "Impact", "Implementation"];
  const scores = {};
  const warnings = [];
  const extractedCharacters = text.replace(/\s/g, "").length;
  const lowCoverage = pages === 1 || extractedCharacters < 5000;
  const detectedProgramme = detectProgramme(text);

  if (lowCoverage) {
    warnings.push(`Only ${pages === 1 ? "one page was" : "a small amount of text was"} extracted. Scores are capped because this is unlikely to represent a complete Part B proposal.`);
  }
  if (detectedProgramme && detectedProgramme !== programme && !(detectedProgramme === "horizon" && programme === "horizon-csa")) {
    warnings.push(`The document appears to be ${programmeName(detectedProgramme)}, but ${programmeName(programme)} was selected. Choose the matching programme and run the analysis again.`);
  }

  criteria.forEach(criterion => {
    const criterionFindings = findings.filter(f => f.criterion === criterion);
    if (!criterionFindings.length) {
      findings.push(evidenceGapFinding(criterion));
      scores[criterion] = 3.0;
      return;
    }
    const penalties = criterionFindings.filter(f => f.kind !== "strength").reduce((sum, f) => sum + f.severity, 0);
    const strengths = criterionFindings.filter(f => f.kind === "strength").reduce((sum, f) => sum + Math.abs(f.severity), 0);
    const calculated = Math.max(3, Math.min(4.8, Math.round((4.35 - penalties + strengths) * 10) / 10));
    scores[criterion] = lowCoverage ? Math.min(3.0, calculated) : calculated;
  });

  const titleMatch = text.match(/(?:Proposal acronym|Acronym|Project)\s*[:—-]\s*([A-Z][A-Z0-9-]{2,20})/i);
  return {
    title: titleMatch?.[1] || selectedFile?.name.replace(/\.(pdf|docx)$/i, "") || "Proposal analysis",
    scores,
    findings,
    warnings,
    confidence: lowCoverage ? "Incomplete document coverage" : findings.length >= 6 ? "Medium pattern confidence" : "Early diagnostic · more evidence needed"
  };
}

function updateLoading(progress, detail, title = "Reading proposal structure…") {
  els.progress.style.width = `${progress}%`;
  els.loadingTitle.textContent = title;
  els.loadingDetail.textContent = detail;
}

async function runFileAnalysis(event) {
  event.preventDefault();
  if (!selectedFile) return;
  els.intro.hidden = true;
  els.loading.hidden = false;
  updateLoading(8, "Preparing the document locally");
  try {
    const isDocx = selectedFile.name.toLowerCase().endsWith(".docx");
    const { text, pages } = isDocx ? await extractDocx(selectedFile) : await extractPdf(selectedFile);
    updateLoading(72, "Checking objectives, KPIs, TRL and impact logic", "Applying evaluator patterns…");
    await pause(500);
    const programme = document.querySelector("#programme").value;
    const analysis = analyseText(text, programme, pages);
    const callId = document.querySelector("#call-id").value.trim();
    const programmeLabel = programmeName(programme);
    analysis.meta = `${programmeLabel}${callId ? ` · ${callId}` : ""} · ${pages ? `${pages} pages` : "DOCX"}`;
    analysis.lead = {
      programme: programmeLabel,
      callId,
      coverage: pages ? `${pages} pages` : "DOCX"
    };
    updateLoading(100, "Evaluation ready", "Preparing your evaluation summary…");
    await pause(450);
    renderResults(analysis);
  } catch (error) {
    els.loading.hidden = true;
    els.intro.hidden = false;
    showError(`The document could not be read in this browser. ${error.message || "Try another exported file."}`);
  }
}

function renderResults(analysis) {
  currentAnalysis = analysis;
  activeFindings = analysis.findings;
  els.loading.hidden = true;
  els.results.hidden = false;
  els.title.textContent = analysis.title;
  els.meta.textContent = analysis.meta;
  const scoreValues = Object.values(analysis.scores);
  els.total.textContent = scoreValues.reduce((sum, score) => sum + score, 0).toFixed(1);
  els.confidence.textContent = analysis.confidence;
  els.warnings.hidden = !analysis.warnings?.length;
  els.warnings.innerHTML = analysis.warnings?.length
    ? `<strong>Check before relying on these scores</strong><ul>${analysis.warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>`
    : "";
  els.criterionScores.innerHTML = Object.entries(analysis.scores).map(([name, score]) => `
    <div class="criterion">
      <div class="criterion-head"><span>${escapeHtml(name)}</span><strong>${score.toFixed(1)}<small>/5</small></strong></div>
      <div class="score-line" aria-label="${escapeHtml(name)} ${score} out of 5"><span style="width:${score / 5 * 100}%"></span></div>
    </div>`).join("");
  els.criticalCount.textContent = activeFindings.filter(f => f.kind === "priority").length;
  els.strengthCount.textContent = activeFindings.filter(f => f.kind === "strength").length;
  const feedbackBody = encodeURIComponent(`Programme: ${analysis.meta}\nEstimated score: ${els.total.textContent}/15\n\nWhat was useful?\n\nWhat was unclear or missing?\n`);
  els.feedbackLink.href = `mailto:sofia@deep-sync.eu?subject=DeepSync%20Evaluator%20Beta%20Feedback&body=${feedbackBody}`;
  renderFindings("all");
  if (sessionStorage.getItem("deepsyncEvaluatorAccess") === "granted") {
    unlockDetailedResults();
  } else {
    els.emailGate.hidden = false;
    els.detailedResults.hidden = true;
    els.feedbackBar.hidden = true;
    els.printReport.disabled = true;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function unlockDetailedResults() {
  els.emailGate.hidden = true;
  els.detailedResults.hidden = false;
  els.feedbackBar.hidden = false;
  els.printReport.disabled = false;
}

async function submitEmailGate(event) {
  event.preventDefault();
  els.emailGateError.hidden = true;
  const email = els.reportEmail.value.trim();
  if (!email || !els.emailConsent.checked) return;
  const originalLabel = els.unlockReport.innerHTML;
  els.unlockReport.textContent = "Unlocking…";
  els.unlockReport.disabled = true;
  const params = new URLSearchParams({
    name: "Proposal Evaluator Beta",
    email,
    org: currentAnalysis?.meta || "Proposal Evaluator",
    source: "Proposal Evaluator Beta",
    programme: currentAnalysis?.lead?.programme || "",
    callId: currentAnalysis?.lead?.callId || "",
    coverage: currentAnalysis?.lead?.coverage || "",
    score: Object.values(currentAnalysis?.scores || {}).reduce((sum, value) => sum + value, 0).toFixed(1),
    confidence: currentAnalysis?.confidence || "",
    consent: "true",
    consortium: els.consortiumInterest.checked ? "Yes" : "No"
  });
  try {
    await fetch(`${leadEndpoint}?${params}`, { method: "GET", mode: "no-cors" });
    sessionStorage.setItem("deepsyncEvaluatorAccess", "granted");
    unlockDetailedResults();
  } catch (error) {
    els.emailGateError.textContent = "We could not unlock the report. Please check your connection and try again.";
    els.emailGateError.hidden = false;
  } finally {
    els.unlockReport.innerHTML = originalLabel;
    els.unlockReport.disabled = false;
  }
}

function renderFindings(filter) {
  const list = activeFindings.filter(item => filter === "all" || item.kind === filter);
  els.findings.innerHTML = list.length ? list.map(item => `
    <article class="finding" data-kind="${item.kind}">
      <div class="finding-top">
        <span class="finding-tag">${item.kind === "priority" ? "Priority" : item.kind === "strength" ? "Strength" : "Improve"} · ${escapeHtml(item.criterion)}</span>
        <span class="finding-location">${escapeHtml(typeof item.location === "function" ? item.location("") : item.location)}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.explanation)}</p>
      <p class="recommendation"><strong>Direction:</strong> ${escapeHtml(item.recommendation)}</p>
    </article>`).join("") : `<article class="finding"><h3>No findings in this view</h3><p>Try another filter to review the complete diagnostic.</p></article>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function pause(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

els.file.addEventListener("change", event => setFile(event.target.files[0]));
els.form.addEventListener("submit", runFileAnalysis);
els.emailGateForm.addEventListener("submit", submitEmailGate);
els.dropzone.addEventListener("dragover", event => { event.preventDefault(); els.dropzone.classList.add("dragging"); });
els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragging"));
els.dropzone.addEventListener("drop", event => {
  event.preventDefault();
  els.dropzone.classList.remove("dragging");
  setFile(event.dataTransfer.files[0]);
});
els.printReport.addEventListener("click", () => window.print());
els.newAnalysis.addEventListener("click", () => {
  els.results.hidden = true;
  els.intro.hidden = false;
  selectedFile = null;
  els.file.value = "";
  els.fileTitle.textContent = "Drop your Part B proposal here";
  els.fileSubtitle.textContent = "or click to choose a PDF or DOCX · max 50 MB";
  els.dropzone.classList.remove("has-file");
  els.analyse.disabled = true;
  els.emailGate.hidden = false;
  els.detailedResults.hidden = true;
  els.feedbackBar.hidden = true;
  els.printReport.disabled = true;
});
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(item => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); });
  tab.classList.add("active");
  tab.setAttribute("aria-selected", "true");
  renderFindings(tab.dataset.filter);
}));
