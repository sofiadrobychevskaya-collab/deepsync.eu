let pdfjsPromise;
let mammothPromise;
let esrBenchmarksPromise;
let policyLibraryPromise;
let lastProposalText = "";
const leadEndpoint = "https://script.google.com/macros/s/AKfycbxk1JF4WnWba_hvRKOd8vVM2DiKyl41F8_CQ3QskC2T93vtES2PUkQAICJeGfdq2xDo/exec";
// Set this after deploying scripts/deep-ai-check.gs as a Google Apps Script Web App (see that file for setup steps).
const deepCheckEndpoint = "";

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

async function getEsrBenchmarks() {
  if (!esrBenchmarksPromise) {
    esrBenchmarksPromise = fetch("./data/esr-benchmarks.json")
      .then(response => response.ok ? response.json() : null)
      .catch(() => null);
  }
  return esrBenchmarksPromise;
}

async function getPolicyLibrary() {
  if (!policyLibraryPromise) {
    policyLibraryPromise = fetch("/data/eu-policy-library.json")
      .then(response => response.ok ? response.json() : null)
      .catch(() => null);
  }
  return policyLibraryPromise;
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
  resultsEyebrow: document.querySelector("#results-eyebrow"),
  title: document.querySelector("#proposal-title"),
  meta: document.querySelector("#proposal-meta"),
  total: document.querySelector("#total-score"),
  confidence: document.querySelector("#score-confidence"),
  criterionScores: document.querySelector("#criterion-scores"),
  warnings: document.querySelector("#analysis-warnings"),
  callIntelligence: document.querySelector("#call-intelligence"),
  callIntelligenceTitle: document.querySelector("#call-intelligence-title"),
  callIntelligenceMeta: document.querySelector("#call-intelligence-meta"),
  callSourceLink: document.querySelector("#call-source-link"),
  callFacts: document.querySelector("#call-facts"),
  requirementCoverage: document.querySelector("#requirement-coverage"),
  callDetails: document.querySelector("#call-details"),
  diagnosisTitle: document.querySelector("#diagnosis-title"),
  diagnosisCopy: document.querySelector("#diagnosis-copy"),
  diagnosisMetrics: document.querySelector("#diagnosis-metrics"),
  emailGate: document.querySelector("#email-gate"),
  emailGateForm: document.querySelector("#email-gate-form"),
  reportEmail: document.querySelector("#report-email"),
  emailConsent: document.querySelector("#email-consent"),
  consortiumInterest: document.querySelector("#consortium-interest"),
  emailGateError: document.querySelector("#email-gate-error"),
  criterionGateScores: document.querySelector("#criterion-gate-scores"),
  unlockReport: document.querySelector("#unlock-report"),
  detailedResults: document.querySelector("#detailed-results"),
  deepCheck: document.querySelector("#deep-check"),
  runDeepCheck: document.querySelector("#run-deep-check"),
  deepCheckStatus: document.querySelector("#deep-check-status"),
  deepCheckResult: document.querySelector("#deep-check-result"),
  humanSupport: document.querySelector("#human-support"),
  recommendedSupportReason: document.querySelector("#recommended-support-reason"),
  recommendedServiceCard: document.querySelector("#recommended-service-card"),
  recommendedServiceName: document.querySelector("#recommended-service-name"),
  recommendedServiceCopy: document.querySelector("#recommended-service-copy"),
  supportRequest: document.querySelector("#support-request"),
  selectedService: document.querySelector("#selected-service"),
  supportEmail: document.querySelector("#support-email"),
  submitSupport: document.querySelector("#submit-support"),
  supportMessage: document.querySelector("#support-message"),
  feedbackBar: document.querySelector("#feedback-bar"),
  findings: document.querySelector("#findings-list"),
  criticalCount: document.querySelector("#critical-count"),
  strengthCount: document.querySelector("#strength-count"),
  newAnalysis: document.querySelector("#new-analysis"),
  printReport: document.querySelector("#print-report"),
  feedbackLink: document.querySelector("#feedback-link"),
  consortiumProfile: document.querySelector("#consortium-profile"),
  consortiumIntro: document.querySelector("#consortium-intro"),
  consortiumCount: document.querySelector("#consortium-count"),
  openConsortium: document.querySelector("#open-consortium"),
  consortiumDetails: document.querySelector("#consortium-details"),
  cordisQuery: document.querySelector("#cordis-query"),
  cordisSearch: document.querySelector("#cordis-search"),
  cordisStatus: document.querySelector("#cordis-status"),
  cordisResults: document.querySelector("#cordis-results")
};

let selectedFile = null;
let activeFindings = [];
let currentAnalysis = null;
let activeService = "";

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

function criterionSectionHeading(criterion) {
  return {
    Relevance: /\b1\.?\s*Relevance\b/i,
    Excellence: /\b1\.?\s*Excellence\b/i,
    Impact: /\b2\.?\s*Impact\b/i,
    Implementation: /\b3\.?\s*(Quality and efficiency of the implementation|Implementation)\b/i,
    "Risk & implementation": /\b3\.?\s*(Implementation|Risk)\b/i
  }[criterion] || null;
}

function extractCriterionText(text, criterion) {
  const headingRegex = criterionSectionHeading(criterion);
  const match = headingRegex ? text.match(headingRegex) : null;
  if (!match) return "";
  const rest = text.slice(match.index);
  const nextHeadingOffset = rest.slice(30).search(/\n\s*[1-4]\.?\s*(Excellence|Impact|Implementation|Relevance|Quality and efficiency)\b/i);
  return nextHeadingOffset > -1 ? rest.slice(0, nextHeadingOffset + 30) : rest.slice(0, 9000);
}

function criterionEvidenceSignal(text, criterion) {
  const section = extractCriterionText(text, criterion);
  if (!section) return { headingFound: false, words: 0, quantified: 0, commitment: 0 };
  const words = section.trim().split(/\s+/).filter(Boolean).length;
  const quantified = (section.match(/\b\d+(?:[.,]\d+)?\s?%|€\s?\d[\d,.]*|\bKPI\b/gi) || []).length;
  const commitment = (section.match(/\b(will|shall|responsible|owner|milestone|deliverable|baseline|target)\b/gi) || []).length;
  return { headingFound: true, words, quantified, commitment };
}

function evidenceGapFinding(criterion, text) {
  const guidance = {
    Relevance: "Add an explicit call-requirement matrix linking each expected outcome to activities, deliverables, target groups and measurable evidence.",
    Excellence: "Make the ambition, state of the art, methodology, assumptions and validation evidence explicit and easy for an evaluator to trace.",
    Impact: "Show the complete output-to-outcome pathway with baselines, quantified targets, beneficiaries, attribution and verification sources.",
    Implementation: "Make work-package dependencies, task ownership, resources, milestones, risks and acceptance criteria explicit.",
    "Risk & implementation": "Provide technical, commercial and execution risks with evidence, owners, triggers, mitigations, resources and decision gates."
  };
  const signal = criterionEvidenceSignal(text, criterion);
  let explanation;
  let score;
  if (!signal.headingFound) {
    explanation = `No "${criterion}" section heading was found anywhere in the extracted text. This criterion may be missing, merged into another section, or not extracted from the uploaded file.`;
    score = 2.8;
  } else if (!signal.quantified && !signal.commitment) {
    explanation = `A "${criterion}" section is present (~${signal.words} words), but it contains no quantified figures (%, €, KPI) and no ownership language (will/shall/responsible/milestone) — it reads as description rather than a committed plan.`;
    score = 3.0;
  } else {
    explanation = `A "${criterion}" section is present (~${signal.words} words) with ${signal.quantified} quantified reference${signal.quantified === 1 ? "" : "s"} and ${signal.commitment} ownership/commitment phrase${signal.commitment === 1 ? "" : "s"}, but it didn't match any of the analyser's known evaluator patterns. That means no specific issue was detected — not that the section is strong.`;
    score = 3.4;
  }
  return {
    score,
    finding: {
      criterion,
      kind: "priority",
      severity: 0,
      title: signal.headingFound ? `No specific pattern matched in ${criterion}` : `${criterion} section could not be located`,
      location: "Document coverage check",
      explanation,
      recommendation: guidance[criterion] || "Make the criterion evidence explicit and upload a complete text-searchable proposal."
    }
  };
}

const consortiumRoleRules = [
  { id: "research", label: "Research & evidence", beneficiary: "Beneficiary", pattern: /(universit|research (centre|center|institute)|academic|scientific partner|RTO\b)/i, need: "methodology, independent evidence and validation" },
  { id: "industry", label: "Technology / industry", beneficiary: "Beneficiary", pattern: /(SME\b|industry partner|industrial partner|technology provider|private company|commercial partner|enterprise)/i, need: "technology delivery, commercial ownership and exploitation" },
  { id: "end-user", label: "End user / pilot owner", beneficiary: "Beneficiary", pattern: /(end.user|pilot owner|living lab|school|hospital|operator|public administration|municipalit|regional authority)/i, need: "access to users, pilot environment and adoption evidence" },
  { id: "public", label: "Public authority / policy", beneficiary: "Associated Partner", pattern: /(ministry|public authority|municipalit|city council|regional government|policy maker|regulator)/i, need: "policy uptake, public mandate or access to a public deployment context" },
  { id: "ecosystem", label: "Ecosystem / dissemination", beneficiary: "Associated Partner", pattern: /(association|cluster|network|federation|NGO\b|dissemination partner|ecosystem partner)/i, need: "replication, stakeholder reach and dissemination" }
];

const domainTerms = [
  ["artificial intelligence", /artificial intelligence|\bAI\b/i], ["generative AI", /generative AI|GenAI/i],
  ["education technology", /EdTech|education technology|digital education/i], ["digital skills", /digital skills|upskilling|reskilling/i],
  ["public administration", /public administration|public sector/i], ["agriculture", /agri|farming|crop|agriculture/i],
  ["health", /health|clinical|hospital|patient/i], ["energy", /energy|renewable|grid|hydrogen/i],
  ["circular economy", /circular economy|recycling|waste/i], ["cybersecurity", /cybersecurity|cyber security/i],
  ["semiconductors", /semiconductor|microelectronics|chip/i], ["robotics", /robotic|automation/i],
  ["climate", /climate|decarbon|greenhouse gas/i], ["manufacturing", /manufactur|factory|industrial production/i]
];

const policyDomainMap = {
  "artificial intelligence": ["AI & Data"],
  "generative AI": ["AI & Data"],
  "education technology": ["EdTech", "Digital Skills"],
  "digital skills": ["Digital Skills"],
  "agriculture": ["AgriTech", "Green Tech"],
  "health": ["Health & Life Sciences"],
  "energy": ["Energy", "Green Tech"],
  "circular economy": ["Green Tech"],
  "cybersecurity": ["Online Safety", "Critical Tech"],
  "semiconductors": ["Critical Tech"],
  "robotics": ["DeepTech"],
  "climate": ["Green Tech"],
  "manufacturing": ["Critical Tech"]
};

function relevantPolicies(library, text) {
  if (!library?.policies?.length) return [];
  const tags = new Set();
  domainTerms.forEach(([term, pattern]) => {
    if (policyDomainMap[term] && pattern.test(text)) policyDomainMap[term].forEach(tag => tags.add(tag));
  });
  if (!tags.size) return [];
  return library.policies.filter(policy => policy.sector_tags.some(tag => tags.has(tag))).slice(0, 6);
}

const callStopWords = new Set("about above across after also among based been being between both call could each expected from further have into more must other outcomes proposal proposals project projects should such than that their these they this those through under using where which will with within would along become becomes become available provide provides providing provided support supports supporting supported process processes quality utilizing utilise utilide utilize inclusive tailored needs need ensure ensuring ensures relevant relevance wide wider range various several including include includes related appropriate effective effectively efficient efficiently comprehensive robust innovative innovation innovations activities activity results result outcome output outputs level levels towards toward solutions solution stakeholders stakeholder".split(" "));

function extractTopicIdentifier(value) {
  const decoded = decodeURIComponent(String(value || ""));
  return decoded.match(/(?:HORIZON|DIGITAL|EIC|CEF|EU4H|LIFE|ERASMUS)[A-Z0-9-]+/i)?.[0]?.replace(/-+$/, "").toUpperCase() || "";
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function htmlToText(html) {
  if (!html) return "";
  const withBreaks = String(html).replace(/<\/(p|li|h\d|div|tr)>/gi, "$&\n").replace(/<br\s*\/?>/gi, "\n");
  return new DOMParser().parseFromString(withBreaks, "text/html").body.textContent.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function extractTopicSections(html) {
  const sections = {};
  const markers = [...String(html || "").matchAll(/<(span|p)[^>]*topicdescriptionkind[^>]*>([\s\S]*?)<\/\1>/gi)];
  markers.forEach((marker, index) => {
    const name = htmlToText(marker[2]).replace(/:$/, "").trim();
    const start = marker.index + marker[0].length;
    const end = markers[index + 1]?.index ?? html.length;
    sections[name] = htmlToText(html.slice(start, end));
  });
  return sections;
}

function extractOfficialLinks(html) {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const seen = new Set();
  return [...doc.querySelectorAll("a[href]")].map(link => ({
    label: link.textContent.replace(/\s+/g, " ").trim(),
    url: link.href
  })).filter(link => /^https:\/\/(ec\.europa\.eu|commission\.europa\.eu|research-and-innovation\.ec\.europa\.eu|digital-strategy\.ec\.europa\.eu)/i.test(link.url) && link.label.length > 4 && !seen.has(link.url) && seen.add(link.url)).slice(0, 10);
}

function requirementKeywords(value) {
  return [...new Set(String(value).toLowerCase().match(/[a-z][a-z-]{3,}/g) || [])].filter(word => !callStopWords.has(word)).slice(0, 12);
}

function buildCallRequirements(sections, descriptionHtml = "") {
  const sources = [
    ["Expected outcome", sections["Expected Outcome"] || sections["Expected Outcomes"]],
    ["Objective", sections.Objective || sections.Objectives],
    ["Scope / activity", sections.Scope]
  ];
  let requirements = sources.flatMap(([source, value]) => String(value || "").split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map(item => ({
    source,
    text: item.replace(/^[-•\d.)\s]+/, "").trim()
  }))).filter(item => item.text.length >= 55 && item.text.length <= 520);
  if (!requirements.length && descriptionHtml) {
    requirements = htmlToText(descriptionHtml).split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map(text => ({ source: "Official topic summary", text: text.replace(/^[-•\d.)\s]+/, "").trim() })).filter(item => item.text.length >= 55 && item.text.length <= 520);
  }
  return requirements.slice(0, 10);
}

function assessCallRequirements(proposalText, requirements) {
  const source = proposalText.toLowerCase();
  return requirements.map(requirement => {
    const keywords = requirementKeywords(requirement.text);
    const matched = keywords.filter(keyword => source.includes(keyword));
    const ratio = keywords.length ? matched.length / Math.min(6, keywords.length) : 0;
    const firstMatch = matched.map(keyword => ({ keyword, index: source.indexOf(keyword) })).filter(item => item.index >= 0).sort((a, b) => a.index - b.index)[0];
    const evidenceWindow = firstMatch ? source.slice(Math.max(0, firstMatch.index - 280), Math.min(source.length, firstMatch.index + 520)) : "";
    const commitmentSignal = /\b(will|shall|commit|deliver|implement|launch|allocate|responsible|owner|target|milestone|work package|\bWP\d|task\s*\d|by\s+M\d)\b/i.test(evidenceWindow);
    const requiredNumbers = [...new Set((requirement.text.match(/\b\d+(?:[.,]\d+)?%?|€\s*\d[\d,.]*|\d[\d,.]*\s*EUR\b/gi) || []).map(value => value.replace(/\s+/g, "").toLowerCase()))];
    const numberEvidence = !requiredNumbers.length || requiredNumbers.some(value => source.replace(/\s+/g, "").includes(value));
    const status = matched.length >= 3 && ratio >= .5 && commitmentSignal && numberEvidence ? "covered" : matched.length >= 1 ? "partial" : "missing";
    let evidence = "No explicit matching evidence was detected in the uploaded concept.";
    if (firstMatch) {
      const start = Math.max(0, firstMatch.index - 95);
      const end = Math.min(proposalText.length, firstMatch.index + firstMatch.keyword.length + 170);
      evidence = proposalText.slice(start, end).replace(/\s+/g, " ").trim();
      if (start > 0) evidence = `…${evidence}`;
      if (end < proposalText.length) evidence = `${evidence}…`;
    }
    const unmatched = keywords.filter(keyword => !matched.includes(keyword));
    return { ...requirement, keywords, matched, unmatched, status, covered: status === "covered", commitmentSignal, requiredNumbers, numberEvidence, evidence };
  });
}

function explainRequirementSimply(text) {
  const value = String(text || "");
  const rules = [
    [/three open calls|at least one call per year/i, "Run at least three annual open calls and fund at least 20 EdTech startups or SMEs across eligible countries."],
    [/60%.*financial support|financial support.*60%/i, "Reserve at least 60% of the project budget for FSTP, with up to €150,000 for each selected third party."],
    [/12-month.*incubation|incubation and acceleration programme/i, "Deliver a 12-month acceleration programme combining mentoring, training, networking and market-access support."],
    [/short pilots.*real education|real education.*impact assessment/i, "Test selected solutions in real education settings and collect measurable impact evidence."],
    [/human-centric design|learning design methodologies/i, "Use human-centred and learning-design methods throughout the pilots."],
    [/European-wide communication|awareness raising/i, "Run EU-wide communication and awareness activities."],
    [/investor|access.to.market|market support/i, "Show how selected companies will reach customers, investors and the European market."],
    [/replicat|scalab|uptake/i, "Explain how successful results will be replicated, scaled and adopted beyond the initial pilots."],
    [/KPI|indicator|measure/i, "Define measurable targets, baselines, owners and evidence sources."],
    [/open science|FAIR|data management/i, "Explain how data and results will be managed, shared and made reusable."],
    [/dissemination|communication|exploitation/i, "Show who will use the results and how communication and exploitation will lead to uptake."]
  ];
  return rules.find(([pattern]) => pattern.test(value))?.[1] || compactText(value.replace(/\s+/g, " "), 180);
}

function callFitFeedback(item) {
  const text = item.text;
  const actions = [
    [/three open calls|at least one call per year/i, "Add an FSTP delivery table with three call dates, at least 20 selected SMEs in total, eligible-country coverage, the lead partner and the selection timetable."],
    [/60%.*financial support|financial support.*60%/i, "Show in the budget that at least 60% goes to FSTP. State the amount per company (maximum €150,000), payment stages, responsible partner and audit trail."],
    [/12-month.*incubation|incubation and acceleration programme/i, "Add a 12-month participant journey: selection, onboarding, mentoring, training, pilot preparation, market access and graduation - with an owner and KPI for every stage."],
    [/short pilots.*real education|real education.*impact assessment/i, "Name the pilot hosts and countries, number of pilots and users, baseline and endline indicators, data-collection method and the partner responsible for validation."],
    [/human-centric design|learning design methodologies/i, "Define who co-designs the pilots (teachers, learners and trainers), when workshops happen, which usability and pedagogical criteria are tested and who signs off the results."],
    [/European-wide communication|awareness raising/i, "Set EU-wide reach targets: countries, audience groups, channels, events, qualified leads and the partner accountable for converting awareness into uptake."],
    [/big event|investors.*ministr|market partners/i, "Commit to at least one annual flagship event and specify target numbers for investors, ministries, education providers, meetings and documented follow-up decisions."],
    [/ethic|inclusion|accessibility|privacy|security/i, "Add mandatory selection and pilot checks for ethics, inclusion, accessibility, privacy and security, with pass/fail criteria and a responsible reviewer."],
    [/market|commercial|investor/i, "Define the market-access route for selected SMEs: customer introductions, investor meetings, procurement readiness, conversion targets and evidence of commercial follow-up."],
    [/impact|indicator|assessment/i, "Add a measurement table with baseline, target, data source, collection date, responsible partner and verification method for every claimed outcome."]
  ];
  const action = actions.find(([pattern]) => pattern.test(text))?.[1] || "Add one explicit paragraph stating the activity, quantified target, responsible partner, timing, beneficiary group and evidence used to verify completion.";
  return item.status === "covered" ? `Evidence is present. Verify that the final text keeps all of these elements: ${action.replace(/^Add |^Show |^Define |^Set |^Commit /, "")}` : action;
}

function renderFitRow(item, index) {
  return `<article class="fit-action ${item.status}">
    <span class="fit-action-number">${index + 1}</span>
    <div><small>${item.status === "covered" ? "KEEP" : "PRIORITY ACTION"}</small><strong>${escapeHtml(explainRequirementSimply(item.text))}</strong><p>${escapeHtml(callFitFeedback(item))}</p></div>
  </article>`;
}

async function fetchCallIntelligence(input) {
  const identifier = extractTopicIdentifier(input);
  if (!identifier) throw new Error("No valid EU topic identifier was found in the link.");
  const endpoint = `https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=${encodeURIComponent(`"${identifier}"`)}&pageSize=50`;
  const response = await fetch(endpoint, { method: "POST" });
  if (!response.ok) throw new Error(`Funding Portal returned ${response.status}`);
  const data = await response.json();
  const result = asArray(data.results).find(item => item.language === "en" && item.metadata?.identifier?.includes(identifier) && item.metadata?.descriptionByte) || asArray(data.results).find(item => item.language === "en" && item.metadata?.identifier?.includes(identifier));
  if (!result) throw new Error("The official topic record was not found.");
  const metadata = result.metadata || {};
  const descriptionHtml = firstValue(metadata.descriptionByte) || firstValue(metadata.description) || "";
  const destinationHtml = firstValue(metadata.destinationDetails) || "";
  const conditionsHtml = firstValue(metadata.topicConditions) || "";
  const sections = extractTopicSections(descriptionHtml);
  const actions = JSON.parse(firstValue(metadata.actions) || "[]");
  const action = actions[0]?.types?.[0] || {};
  const relatedText = `${descriptionHtml} ${destinationHtml}`;
  const relatedTopics = [...new Set((htmlToText(relatedText).match(/HORIZON-[A-Z0-9-]{8,}/g) || []).filter(code => code !== identifier))].slice(0, 8);
  return {
    verified: true,
    identifier,
    title: firstValue(metadata.title) || result.summary || identifier,
    url: firstValue(metadata.url) || result.url,
    callIdentifier: firstValue(metadata.callIdentifier) || "",
    actionType: action.typeOfAction || firstValue(metadata.typesOfAction) || "Not stated",
    mga: action.typeOfMGA?.[0]?.abbreviation || "Not stated",
    deadline: firstValue(metadata.deadlineDate) || actions[0]?.deadlineDates?.[0] || "",
    deadlineModel: firstValue(metadata.deadlineModel) || actions[0]?.submissionProcedure?.description || "Not stated",
    expectedOutcome: sections["Expected Outcome"] || sections["Expected Outcomes"] || "",
    objective: sections.Objective || sections.Objectives || "",
    scope: sections.Scope || "",
    destination: htmlToText(destinationHtml) || firstValue(metadata.destinationDescription) || "",
    conditions: htmlToText(conditionsHtml),
    policies: extractOfficialLinks(`${descriptionHtml} ${destinationHtml} ${conditionsHtml}`),
    relatedTopics,
    officialSummary: htmlToText(descriptionHtml),
    requirements: buildCallRequirements(sections, descriptionHtml)
  };
}

function callGapRecommendation(requirement) {
  if (requirement.status === "missing") {
    return requirement.unmatched.length
      ? `Your proposal has no passage addressing this requirement — it doesn't mention ${requirement.unmatched.slice(0, 5).join(", ")}. Add a paragraph that names the activity, the responsible partner and how you'll evidence it.`
      : "Your proposal has no passage addressing this requirement. Add a paragraph that names the activity, the responsible partner and how you'll evidence it.";
  }
  const gaps = [];
  if (requirement.unmatched.length) gaps.push(`it doesn't mention ${requirement.unmatched.slice(0, 5).join(", ")}`);
  if (!requirement.commitmentSignal) gaps.push("it describes the topic without committing to who does it or when");
  if (!requirement.numberEvidence && requirement.requiredNumbers.length) gaps.push(`it doesn't restate the figure${requirement.requiredNumbers.length > 1 ? "s" : ""} the call specifies (${requirement.requiredNumbers.join(", ")})`);
  return gaps.length
    ? `Your text touches this requirement, but ${gaps.join("; and ")}.`
    : "Your text touches this requirement but the match is thin — strengthen it with a concrete owner, timing and evidence.";
}

function applyCallAssessment(analysis, proposalText, callData) {
  if (!callData) return;
  callData.coverage = assessCallRequirements(proposalText, callData.requirements);
  const coveragePoints = callData.coverage.reduce((sum, item) => sum + (item.status === "covered" ? 1 : item.status === "partial" ? .45 : 0), 0);
  callData.coverageRate = callData.coverage.length ? coveragePoints / callData.coverage.length : 0;
  const firstCriterion = Object.keys(analysis.scores)[0];
  if (callData.coverage.length) {
    const callScore = Math.max(2.5, Math.min(4.8, 2.6 + callData.coverageRate * 2.2));
    analysis.scores[firstCriterion] = Math.round((analysis.scores[firstCriterion] * .55 + callScore * .45) * 10) / 10;
  }
  const missing = callData.coverage.filter(item => item.status !== "covered");
  missing.slice(0, 3).forEach((requirement, index) => {
    analysis.findings.unshift({
      id: `call-gap-${index}`,
      criterion: firstCriterion,
      kind: "priority",
      severity: .2,
      title: compactText(`${requirement.status === "partial" ? "Partially addressed" : "Not addressed"}: ${requirement.text}`, 100),
      location: `Funding Portal · ${callData.identifier}`,
      explanation: requirement.text,
      recommendation: callGapRecommendation(requirement)
    });
  });
}

function programmeFromCall(callData, fallback) {
  if (!callData) return fallback;
  if (callData.identifier.startsWith("DIGITAL-")) return "digital";
  if (callData.identifier.startsWith("EIC-")) return "eic";
  if (callData.identifier.startsWith("HORIZON-") && /\bCSA\b|Support Action/i.test(callData.actionType)) return "horizon-csa";
  if (callData.identifier.startsWith("HORIZON-")) return "horizon";
  return fallback;
}

function deriveConsortiumProfile(text, programme, callId) {
  if (programme === "eic") {
    return {
      query: suggestCordisQuery(text, callId),
      roles: [{ label: "EIC applicant structure", present: true, legalRole: "Single applicant", need: "EIC Accelerator normally funds a single startup or SME; CORDIS candidates should be treated as validators, customers or ecosystem supporters rather than consortium beneficiaries.", basis: "Programme rule — verify against the current call documents" }]
    };
  }
  const roles = consortiumRoleRules.map(rule => {
    const present = rule.pattern.test(text);
    let legalRole = rule.beneficiary;
    if (rule.id === "public" && /(budget|person.month|task leader|work package leader)/i.test(text)) legalRole = "Beneficiary";
    return {
      ...rule,
      present,
      legalRole,
      basis: present
        ? "Detected in the uploaded proposal text"
        : `${programmeName(programme)} role-coverage heuristic; to be checked against the exact call conditions and similar CORDIS projects`
    };
  });
  return { query: suggestCordisQuery(text, callId), roles };
}

function suggestCordisQuery(text, callId = "") {
  const found = domainTerms.filter(([, pattern]) => pattern.test(text)).map(([term]) => term).slice(0, 3);
  const topicTokens = callId.split("-").filter(token => token.length > 3 && !/^(HORIZON|DIGITAL|20\d{2})$/i.test(token)).map(token => token.toLowerCase()).slice(-2);
  return [...new Set([...found, ...topicTokens])].join(" ") || "European innovation digital transformation";
}

function renderConsortiumProfile(profile) {
  const gaps = profile.roles.filter(role => !role.present);
  els.consortiumProfile.innerHTML = gaps.map(role => `
    <article class="profile-signal ${role.present ? "present" : "gap"}">
      <span>${role.present ? "Detected coverage" : "Potential gap"}</span>
      <strong>${escapeHtml(role.label)}</strong>
      <small>${escapeHtml(role.need)}</small>
      <em class="role-status">${escapeHtml(role.legalRole)}</em>
      <small><strong>Basis:</strong> ${escapeHtml(role.basis)}</small>
    </article>`).join("") || `<article class="profile-signal present"><span>Coverage detected</span><strong>No obvious role gaps</strong><small>Validate eligibility, commitments and task-level capacity before submission.</small></article>`;
  els.consortiumCount.textContent = gaps.length ? `${gaps.length} potential gap${gaps.length === 1 ? "" : "s"}` : "No obvious gaps";
  els.consortiumIntro.textContent = gaps.length
    ? "We found potential role gaps that may weaken delivery credibility. Review them before searching for organisations."
    : "The main role categories appear covered. You can still compare the group with similar funded consortia.";
  els.openConsortium.textContent = gaps.length ? "Find suitable partners →" : "Compare with similar consortia →";
  els.consortiumDetails.hidden = true;
  els.cordisQuery.value = profile.query;
  els.cordisResults.innerHTML = "";
  els.cordisStatus.hidden = true;
}

function compactText(value, limit = 900) {
  const text = String(value || "").trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function renderCallIntelligence(callData) {
  if (!callData) {
    els.callIntelligence.hidden = true;
    return;
  }
  els.callIntelligence.hidden = false;
  els.callIntelligenceTitle.textContent = callData.title;
  els.callIntelligenceMeta.textContent = `${callData.identifier} · verified through the official Funding & Tenders API`;
  els.callSourceLink.href = callData.url;
  const deadline = callData.deadline ? new Date(callData.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not stated";
  els.callFacts.innerHTML = [
    ["Action", callData.actionType.replace(/^HORIZON(-\w+)?\s*/i, "")],
    ["Grant model", callData.mga],
    ["Deadline", deadline],
    ["Submission", callData.deadlineModel]
  ].map(([label, value]) => `<div class="call-fact"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  const coverage = callData.coverage || [];
  const order = { missing: 0, partial: 1, covered: 2 };
  const orderedCoverage = [...coverage].sort((a, b) => order[a.status] - order[b.status]);
  const coveragePercent = Math.round(callData.coverageRate * 100);
  const coverageMessage = coveragePercent >= 75
    ? "Strong call alignment. Protect the evidence and make ownership explicit."
    : coveragePercent >= 50
      ? "The direction fits the call, but important delivery evidence is still missing."
      : "The concept is relevant, but it does not yet prove how the call requirements will be delivered.";
  els.requirementCoverage.innerHTML = coverage.length ? `
    <div class="coverage-heading">
      <div><p class="eyebrow">CALL-TO-CONCEPT FIT</p><h3>${escapeHtml(coverageMessage)}</h3></div>
      <div class="coverage-summary"><strong>${coveragePercent}%</strong><span>call-fit evidence</span></div>
    </div>
    <p class="priority-intro">Focus on these three changes first:</p>
    <div class="fit-actions">${orderedCoverage.slice(0, 3).map(renderFitRow).join("")}</div>` : `<div class="coverage-unavailable"><strong>Call-to-concept comparison unavailable</strong><p>Open the official topic to verify the requirements.</p></div>`;
  els.callDetails.innerHTML = "";
  els.callDetails.hidden = true;
}

function renderDiagnosis(analysis) {
  const scores = Object.values(analysis.scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const gaps = analysis.consortium.roles.filter(role => !role.present).length;
  const priority = analysis.findings.filter(finding => finding.kind === "priority").length;
  const isConcept = analysis.documentType === "concept";
  let headline = isConcept ? "Your concept has a credible starting point" : "Your proposal has a credible starting point";
  if (average < 3.5) headline = isConcept ? "Your concept needs stronger evidence" : "Your proposal needs stronger evidence";
  else if (gaps) headline = isConcept ? "Your concept is promising, but not consortium-ready" : "Your proposal has unresolved consortium gaps";
  els.diagnosisTitle.textContent = headline;
  els.diagnosisCopy.textContent = priority
    ? `${priority} priority issue${priority === 1 ? "" : "s"} should be addressed before the next drafting stage.`
    : "No major pattern-based weakness was detected, but expert verification is still recommended.";
  const labels = isConcept ? ["Call fit", "Concept strength", "Consortium readiness"] : ["Evaluation strength", "Evidence coverage", "Consortium readiness"];
  const callFit = analysis.callData?.coverage?.length ? Math.round(analysis.callData.coverageRate * 100) : Math.round(average / 5 * 100);
  const values = [callFit, Math.max(35, Math.round((1 - priority / Math.max(6, analysis.findings.length)) * 100)), Math.max(30, 100 - gaps * 14)];
  els.diagnosisMetrics.innerHTML = labels.map((label, index) => `<div class="diagnosis-metric"><span>${escapeHtml(label)}</span><strong>${values[index]}%</strong></div>`).join("");
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function organisationCategory(org) {
  const category = asArray(org?.relations?.categories?.category)[0];
  return category?.code || "ORG";
}

function roleForCandidate(org, gaps) {
  const code = organisationCategory(org);
  const name = String(org?.legalName || "").toLowerCase();
  const inferredType = /universit|research|institute|academy/.test(name) ? "research"
    : /ministr|municip|city|council|government|authority|agency/.test(name) ? "public"
      : /network|association|federation|cluster|foundation|ngo\b/.test(name) ? "ecosystem"
        : /company|gmbh|srl|ltd|limited|software|technolog|solutions/.test(name) ? "industry"
          : "";
  const preferred = gaps.find(gap =>
    gap.id === inferredType ||
    (gap.id === "research" && /HES|REC/.test(code)) ||
    (gap.id === "industry" && /PRC|SME/.test(code)) ||
    (gap.id === "public" && /PUB/.test(code)) ||
    (gap.id === "ecosystem" && code === "OTH")
  );
  if (preferred) return { ...preferred, matchedGap: true };
  const complementary = consortiumRoleRules.find(role => role.id === inferredType) ||
    consortiumRoleRules.find(role => (role.id === "research" && /HES|REC/.test(code)) || (role.id === "industry" && /PRC|SME/.test(code)) || (role.id === "public" && /PUB/.test(code)) || (role.id === "ecosystem" && code === "OTH"));
  return complementary
    ? { ...complementary, legalRole: complementary.beneficiary, matchedGap: false, label: `Complementary ${complementary.label}` }
    : { label: "Complementary topic expertise", legalRole: "Role to be verified", need: "topic-relevant expertise", matchedGap: false, id: "other" };
}

function candidateContribution(candidate) {
  const roleId = candidate.role.id;
  const name = candidate.org.legalName || "This organisation";
  const themes = [...candidate.matchedTerms].slice(0, 5);
  const themeText = themes.length ? themes.join(", ") : "the searched topic";
  const contribution = {
    research: "design or validate the methodology, provide independent evidence and strengthen scientific credibility",
    industry: "own technology-delivery tasks, support deployment and build a credible exploitation route",
    public: "provide a public mandate, access to deployment settings and a route to policy or procurement uptake",
    ecosystem: "mobilise relevant stakeholders, recruit participants and support replication and dissemination",
    other: "add topic-specific expertise that should be verified at task level"
  }[roleId] || "add topic-specific expertise that should be verified at task level";
  const projects = candidate.projects.slice(0, 2).map(project => project.acronym || project.title).filter(Boolean);
  const projectText = projects.length ? projects.join(" and ") : "the returned CORDIS projects";
  const gapText = candidate.role.matchedGap
    ? `It maps to the detected “${candidate.role.label}” gap: the uploaded document does not yet show sufficient evidence of ${candidate.role.need}.`
    : `This is a complementary capability, not a direct match to one of the currently detected consortium gaps.`;
  const legalEvidence = [];
  if (candidate.coordinatorCount) legalEvidence.push(`${candidate.coordinatorCount} coordinator role${candidate.coordinatorCount === 1 ? "" : "s"}`);
  if (candidate.beneficiaryCount) legalEvidence.push(`${candidate.beneficiaryCount} beneficiary/participant role${candidate.beneficiaryCount === 1 ? "" : "s"}`);
  if (candidate.associatedCount) legalEvidence.push(`${candidate.associatedCount} Associated Partner role${candidate.associatedCount === 1 ? "" : "s"}`);
  return {
    evidence: `${name} appears in ${candidate.projects.length} returned funded project${candidate.projects.length === 1 ? "" : "s"}, including ${projectText}. The matching project text contains: ${themeText}.`,
    contribution: `Based on its organisation type (${organisationCategory(candidate.org)}) and this project history, it could ${contribution}.`,
    gap: gapText,
    legal: `${legalEvidence.length ? `CORDIS records show ${legalEvidence.join(", ")}. ` : ""}${candidate.role.legalRole} is therefore a provisional recommendation, not a verified eligibility decision for this call.`
  };
}

function rankCordisOrganisations(hits, query, profile) {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter(term => term.length > 3);
  const gaps = profile.roles.filter(role => !role.present);
  const grouped = new Map();
  hits.forEach((hit, projectIndex) => {
    const project = hit.project || hit;
    const haystack = `${project.title || ""} ${project.teaser || ""} ${project.objective || ""} ${project.keywords || ""}`.toLowerCase();
    const matches = terms.filter(term => haystack.includes(term)).length;
    asArray(project?.relations?.associations?.organization).forEach(org => {
      if (!org?.legalName) return;
      const key = org.id || org.legalName;
      const item = grouped.get(key) || { org, projects: [], coordinatorCount: 0, associatedCount: 0, beneficiaryCount: 0, matchScore: 0, matchedTerms: new Set() };
      item.projects.push({ id: project.id, title: project.title || project.acronym || "CORDIS project", acronym: project.acronym || "", year: String(project.startDate || "").slice(0, 4) });
      const historicalRole = org["@attributes"]?.type || "participant";
      item.coordinatorCount += historicalRole === "coordinator" ? 1 : 0;
      item.associatedCount += historicalRole === "associatedPartner" ? 1 : 0;
      item.beneficiaryCount += /coordinator|participant/.test(historicalRole) ? 1 : 0;
      item.matchScore += matches * 4 + Math.max(0, 6 - projectIndex);
      terms.filter(term => haystack.includes(term)).forEach(term => item.matchedTerms.add(term));
      grouped.set(key, item);
    });
  });
  return [...grouped.values()].map(item => {
    const role = roleForCandidate(item.org, gaps);
    const roleFit = role.matchedGap ? 14 : 2;
    const score = Math.min(99, 42 + Math.min(24, item.matchScore) + Math.min(14, item.projects.length * 4) + Math.min(10, item.coordinatorCount * 5) + roleFit);
    return { ...item, role, score };
  }).sort((a, b) => b.score - a.score || b.projects.length - a.projects.length).slice(0, 8);
}

function safeExternalUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return /^https?:$/.test(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function projectConsortiumSummary(hit) {
  const project = hit.project || hit;
  const organisations = asArray(project?.relations?.associations?.organization);
  const countries = [...new Set(organisations.map(org => org?.address?.country).filter(Boolean))];
  const types = organisations.reduce((counts, org) => {
    const code = organisationCategory(org);
    counts[code] = (counts[code] || 0) + 1;
    return counts;
  }, {});
  const associated = organisations.filter(org => org?.["@attributes"]?.type === "associatedPartner").length;
  return { project, organisations, countries, types, associated };
}

function renderSimilarConsortia(hits) {
  const summaries = hits.slice(0, 5).map(projectConsortiumSummary).filter(item => item.organisations.length);
  if (!summaries.length) return "";
  return `<section class="similar-consortia">
    <h3>Comparable funded consortium structures</h3>
    <p class="cordis-note">CORDIS facts from the five highest-ranked project results. Similarity is text-search relevance, not proof that the calls have identical eligibility rules.</p>
    <div class="comparison-table-wrap"><table class="comparison-table">
      <thead><tr><th>Funded project</th><th>Organisations</th><th>Countries</th><th>Organisation mix</th><th>Associated Partners</th></tr></thead>
      <tbody>${summaries.map(item => `<tr>
        <td><a href="https://cordis.europa.eu/project/id/${encodeURIComponent(item.project.id || "")}" target="_blank" rel="noopener">${escapeHtml(item.project.acronym || item.project.title || "CORDIS project")}</a></td>
        <td>${item.organisations.length}</td><td>${item.countries.length}</td>
        <td>${escapeHtml(Object.entries(item.types).map(([type, count]) => `${type} ${count}`).join(" · "))}</td>
        <td>${item.associated}</td>
      </tr>`).join("")}</tbody>
    </table></div>
  </section>`;
}

function renderCordisResults(candidates, query, hits) {
  els.cordisStatus.hidden = false;
  els.cordisStatus.innerHTML = `<strong>${candidates.length} candidate organisations</strong> ranked from ${hits.length} similar funded projects returned by CORDIS for “${escapeHtml(query)}”. Ranking combines text relevance, repeated participation, coordinator experience and fit with the detected role gaps.`;
  const candidateMarkup = candidates.length ? candidates.map(candidate => {
    const org = candidate.org;
    const address = org.address || {};
    const site = safeExternalUrl(address.url);
    const projectLinks = candidate.projects.slice(0, 3).map(project => `<li><a href="https://cordis.europa.eu/project/id/${encodeURIComponent(project.id || "")}" target="_blank" rel="noopener">${escapeHtml(project.acronym || project.title)}</a>${project.year ? ` (${escapeHtml(project.year)})` : ""}</li>`).join("");
    const rationale = candidateContribution(candidate);
    return `<article class="partner-card">
      <div class="partner-rank">${candidate.score}</div>
      <div>
        <h3>${escapeHtml(org.legalName)}</h3>
        <div class="partner-meta">${escapeHtml(address.country || "Country not listed")} · ${escapeHtml(organisationCategory(org))} · ${candidate.projects.length} relevant project${candidate.projects.length === 1 ? "" : "s"} · ${candidate.coordinatorCount} as coordinator · ${candidate.associatedCount} as Associated Partner</div>
        <span class="partner-role">Provisional role: ${escapeHtml(candidate.role.legalRole)} · ${escapeHtml(candidate.role.label)}</span>
        <p class="partner-reason"><strong>CORDIS evidence:</strong> ${escapeHtml(rationale.evidence)}</p>
        <p class="partner-reason"><strong>What this partner could bring:</strong> ${escapeHtml(rationale.contribution)}</p>
        <p class="partner-reason"><strong>${candidate.role.matchedGap ? "Why it closes the gap" : "Gap-fit limitation"}:</strong> ${escapeHtml(rationale.gap)}</p>
        <p class="partner-reason"><strong>Why this legal role:</strong> ${escapeHtml(rationale.legal)}</p>
        <p class="partner-evidence"><strong>Evidence used:</strong></p><ul class="evidence-list">${projectLinks}</ul>
      </div>
      <div class="partner-links">
        ${site ? `<a href="${escapeHtml(site)}" target="_blank" rel="noopener">Organisation website ↗</a>` : ""}
        <a href="https://cordis.europa.eu/search/en?q=${encodeURIComponent(org.legalName)}" target="_blank" rel="noopener">Verify in CORDIS ↗</a>
      </div>
    </article>`;
  }).join("") : `<article class="finding"><h3>No organisations found</h3><p>Try a shorter technology or challenge phrase.</p></article>`;
  els.cordisResults.innerHTML = `${renderSimilarConsortia(hits)}${candidateMarkup}`;
}

async function searchCordis() {
  if (!currentAnalysis?.consortium) return;
  const query = els.cordisQuery.value.trim();
  if (!query) return;
  const original = els.cordisSearch.innerHTML;
  els.cordisSearch.textContent = "Searching CORDIS…";
  els.cordisSearch.disabled = true;
  els.cordisStatus.hidden = false;
  els.cordisStatus.textContent = "Comparing the proposal with similar funded projects and participation histories…";
  els.cordisResults.innerHTML = "";
  try {
    const cordisQuery = `${query} AND contenttype='project' AND frameworkProgramme='HORIZON' AND language='en'`;
    const url = new URL("https://cordis.europa.eu/search/en");
    url.search = new URLSearchParams({ q: cordisQuery, p: "1", num: "50", srt: "Relevance:decreasing", format: "json" });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`CORDIS returned ${response.status}`);
    const data = await response.json();
    const hits = asArray(data?.hits?.hit);
    const candidates = rankCordisOrganisations(hits, query, currentAnalysis.consortium);
    renderCordisResults(candidates, query, hits);
  } catch (error) {
    els.cordisStatus.textContent = "CORDIS could not be reached. Your proposal remains local. Please try again or use a shorter search phrase.";
  } finally {
    els.cordisSearch.innerHTML = original;
    els.cordisSearch.disabled = false;
  }
}

function analyseText(text, programme, pages, esrBenchmarks = null) {
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
      const gap = evidenceGapFinding(criterion, text);
      findings.push(gap.finding);
      scores[criterion] = lowCoverage ? Math.min(3.0, gap.score) : gap.score;
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
    esrBenchmarks,
    confidence: lowCoverage
      ? "Incomplete document coverage"
      : esrBenchmarks?.case_count
        ? `ESR-informed diagnostic · ${esrBenchmarks.case_count} Commission cases`
        : findings.length >= 6 ? "Medium pattern confidence" : "Early diagnostic · more evidence needed"
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
  const documentType = document.querySelector('input[name="document-type"]:checked').value;
  const callInput = document.querySelector("#call-id").value.trim();
  if (documentType === "concept" && !extractTopicIdentifier(callInput)) {
    showError("Add the EU Funding Portal topic link or a complete topic identifier to run a call-specific concept assessment.");
    return;
  }
  els.intro.hidden = true;
  els.loading.hidden = false;
  updateLoading(8, "Preparing the document locally");
  try {
    const isDocx = selectedFile.name.toLowerCase().endsWith(".docx");
    const { text, pages } = isDocx ? await extractDocx(selectedFile) : await extractPdf(selectedFile);
    lastProposalText = text;
    updateLoading(72, "Checking objectives, KPIs, TRL and impact logic", "Applying evaluator patterns…");
    await pause(500);
    let programme = document.querySelector("#programme").value;
    let callData = null;
    if (extractTopicIdentifier(callInput)) {
      updateLoading(78, "Reading Scope, Expected Outcomes and topic conditions", "Verifying the official call…");
      try { callData = await fetchCallIntelligence(callInput); }
      catch (error) { callData = null; }
    }
    programme = programmeFromCall(callData, programme);
    document.querySelector("#programme").value = programme;
    const esrBenchmarks = await getEsrBenchmarks();
    const analysis = analyseText(text, programme, pages, esrBenchmarks);
    const callId = extractTopicIdentifier(callInput) || callInput;
    const programmeLabel = programmeName(programme);
    analysis.meta = `${programmeLabel}${callId ? ` · ${callId}` : ""} · ${pages ? `${pages} pages` : "DOCX"}`;
    analysis.lead = {
      programme: programmeLabel,
      callId,
      coverage: pages ? `${pages} pages` : "DOCX"
    };
    analysis.consortium = deriveConsortiumProfile(text, programme, callId);
    analysis.documentType = documentType;
    analysis.callData = callData;
    if (callId && !callData) analysis.warnings.push("The Funding Portal topic could not be verified. Call-specific requirements were not used in scoring; check the link or try again.");
    applyCallAssessment(analysis, text, callData);
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
  els.resultsEyebrow.textContent = analysis.documentType === "concept" ? "CONCEPT DIAGNOSIS" : "MOCK EVALUATION SUMMARY";
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
  els.criterionGateScores.innerHTML = Object.entries(analysis.scores).map(([name, score]) => `<span class="criterion-gate-score">${escapeHtml(name)} <strong>${score.toFixed(1)}/5</strong></span>`).join("");
  els.criticalCount.textContent = activeFindings.filter(f => f.kind === "priority").length;
  els.strengthCount.textContent = activeFindings.filter(f => f.kind === "strength").length;
  const feedbackBody = encodeURIComponent(`Programme: ${analysis.meta}\nEstimated score: ${els.total.textContent}/15\n\nWhat was useful?\n\nWhat was unclear or missing?\n`);
  els.feedbackLink.href = `mailto:sofia@deep-sync.eu?subject=DeepSync%20Evaluator%20Beta%20Feedback&body=${feedbackBody}`;
  renderFindings("all");
  renderCallIntelligence(analysis.callData);
  renderDiagnosis(analysis);
  renderConsortiumProfile(analysis.consortium);
  const priorityCount = activeFindings.filter(finding => finding.kind === "priority").length;
  const recommendedService = analysis.documentType === "concept" ? "Concept Review" : priorityCount >= 5 ? "Proposal Writing" : "Proposal Review";
  const supportOptions = {
    "Concept Review": ["Validate the concept before investing in consortium outreach or full proposal writing.", "Expert validation of call fit, concept logic, impact pathway and consortium readiness."],
    "Proposal Review": ["The proposal is developed enough for an evaluator-style challenge and prioritised corrections.", "Professional review of the complete Part B against the call and evaluator evidence patterns."],
    "Proposal Writing": ["The number of priority gaps suggests that targeted rewriting will be more useful than comments alone.", "Scoped expert support to restructure and strengthen the weakest application sections."]
  };
  els.recommendedServiceCard.dataset.service = recommendedService;
  els.recommendedServiceName.textContent = recommendedService;
  els.recommendedSupportReason.textContent = supportOptions[recommendedService][0];
  els.recommendedServiceCopy.textContent = supportOptions[recommendedService][1];
  if (sessionStorage.getItem("deepsyncEvaluatorAccess") === "granted") {
    unlockDetailedResults();
  } else {
    els.emailGate.hidden = false;
    els.detailedResults.hidden = true;
    els.humanSupport.hidden = true;
    els.feedbackBar.hidden = true;
    els.printReport.disabled = true;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function unlockDetailedResults() {
  els.emailGate.hidden = true;
  els.detailedResults.hidden = false;
  els.deepCheck.hidden = !extractCriterionText(lastProposalText, "Impact");
  els.humanSupport.hidden = false;
  els.feedbackBar.hidden = false;
  els.printReport.disabled = false;
  if (els.reportEmail.value && !els.supportEmail.value) els.supportEmail.value = els.reportEmail.value;
}

async function submitSupportRequest(event) {
  event.preventDefault();
  const email = els.supportEmail.value.trim();
  if (!activeService || !email) return;
  const original = els.submitSupport.innerHTML;
  els.submitSupport.textContent = "Sending…";
  els.submitSupport.disabled = true;
  els.supportMessage.hidden = true;
  const params = new URLSearchParams({
    email,
    source: `EU Funding Expert Support: ${activeService}`,
    programme: currentAnalysis?.lead?.programme || "",
    callId: currentAnalysis?.lead?.callId || "",
    coverage: currentAnalysis?.lead?.coverage || "",
    score: Object.values(currentAnalysis?.scores || {}).reduce((sum, value) => sum + value, 0).toFixed(1),
    confidence: currentAnalysis?.confidence || "",
    consent: "true",
    consortium: activeService === "Consortium Search" ? "Yes" : "No"
  });
  try {
    await fetch(`${leadEndpoint}?${params}`, { method: "GET", mode: "no-cors" });
    els.supportMessage.textContent = `Request received. DeepSync will contact you about ${activeService}.`;
    els.supportMessage.hidden = false;
  } catch (error) {
    els.supportMessage.textContent = "The request could not be sent. Please try again.";
    els.supportMessage.hidden = false;
  } finally {
    els.submitSupport.innerHTML = original;
    els.submitSupport.disabled = false;
  }
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

async function runDeepCheck() {
  els.deepCheckStatus.hidden = false;
  els.deepCheckResult.hidden = true;
  if (!deepCheckEndpoint) {
    els.deepCheckStatus.textContent = "This feature isn't connected yet — ask DeepSync to finish setup (see scripts/deep-ai-check.gs).";
    return;
  }
  const impactText = extractCriterionText(lastProposalText, "Impact");
  if (!impactText) {
    els.deepCheckStatus.textContent = "No Impact section heading was found in this document.";
    return;
  }
  const originalLabel = els.runDeepCheck.textContent;
  els.runDeepCheck.disabled = true;
  els.runDeepCheck.textContent = "Analysing…";
  els.deepCheckStatus.textContent = "Sending your Impact section and matched EU policy references for review…";
  try {
    const library = await getPolicyLibrary();
    const policies = relevantPolicies(library, impactText);
    const payload = {
      proposalText: impactText,
      context: {
        call: currentAnalysis?.callData ? {
          identifier: currentAnalysis.callData.identifier,
          title: currentAnalysis.callData.title,
          expectedOutcome: currentAnalysis.callData.expectedOutcome,
          scope: currentAnalysis.callData.scope,
          destination: currentAnalysis.callData.destination
        } : { note: "No official call was linked to this analysis — review is based on the Impact text and EU policy references only." },
        policies: policies.map(policy => ({ title: policy.title, summary: policy.summary, source_url: policy.source_url }))
      }
    };
    const response = await fetch(deepCheckEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    renderDeepCheckResult(data);
  } catch (error) {
    els.deepCheckStatus.textContent = `Could not complete the check: ${error.message || "please try again."}`;
  } finally {
    els.runDeepCheck.disabled = false;
    els.runDeepCheck.textContent = originalLabel;
  }
}

function renderDeepCheckResult(data) {
  els.deepCheckStatus.hidden = true;
  els.deepCheckResult.hidden = false;
  const matched = Array.isArray(data.matched_policies) ? data.matched_policies : [];
  const gaps = Array.isArray(data.gaps) ? data.gaps : [];
  els.deepCheckResult.innerHTML = `
    <h4>Alignment summary</h4>
    <p>${escapeHtml(data.alignment_summary || "No summary returned.")}</p>
    ${matched.length ? `<ul class="dc-policy-list">${matched.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    ${gaps.length ? `<h4>Gaps to address</h4><ul>${gaps.map(gap => `<li><strong>${escapeHtml(gap.issue || "")}</strong> — ${escapeHtml(gap.why_it_matters || "")} <em>Fix:</em> ${escapeHtml(gap.fix || "")}</li>`).join("")}</ul>` : ""}
    ${data.missing_quantified_targets ? `<p class="dc-note">No quantified targets were detected in this section.</p>` : ""}
    <p class="dc-note">${escapeHtml(data.overall_note || "This is a diagnostic aid, not a guaranteed score.")}</p>
  `;
}

els.file.addEventListener("change", event => setFile(event.target.files[0]));
els.form.addEventListener("submit", runFileAnalysis);
els.emailGateForm.addEventListener("submit", submitEmailGate);
els.supportRequest.addEventListener("submit", submitSupportRequest);
document.querySelectorAll(".service-card").forEach(card => card.addEventListener("click", () => {
  activeService = card.dataset.service;
  document.querySelectorAll(".service-card").forEach(item => item.classList.toggle("selected", item === card));
  els.selectedService.textContent = activeService;
  els.supportRequest.hidden = false;
  els.supportMessage.hidden = true;
  if (els.reportEmail.value && !els.supportEmail.value) els.supportEmail.value = els.reportEmail.value;
  els.supportEmail.focus();
}));
els.dropzone.addEventListener("dragover", event => { event.preventDefault(); els.dropzone.classList.add("dragging"); });
els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragging"));
els.dropzone.addEventListener("drop", event => {
  event.preventDefault();
  els.dropzone.classList.remove("dragging");
  setFile(event.dataTransfer.files[0]);
});
els.printReport.addEventListener("click", () => window.print());
els.runDeepCheck.addEventListener("click", runDeepCheck);
els.openConsortium.addEventListener("click", () => {
  els.consortiumDetails.hidden = false;
  els.openConsortium.hidden = true;
  searchCordis();
});
els.cordisSearch.addEventListener("click", searchCordis);
els.cordisQuery.addEventListener("keydown", event => {
  if (event.key === "Enter") { event.preventDefault(); searchCordis(); }
});
els.newAnalysis.addEventListener("click", () => {
  els.results.hidden = true;
  els.intro.hidden = false;
  selectedFile = null;
  els.file.value = "";
  const conceptSelected = document.querySelector('input[name="document-type"]:checked').value === "concept";
  els.fileTitle.textContent = conceptSelected ? "Drop your concept draft here" : "Drop your Part B proposal here";
  els.fileSubtitle.textContent = conceptSelected ? "PDF or DOCX · a one-pager is enough" : "PDF or DOCX · max 50 MB";
  els.dropzone.classList.remove("has-file");
  els.analyse.disabled = true;
  els.emailGate.hidden = false;
  els.detailedResults.hidden = true;
  els.deepCheck.hidden = true;
  els.deepCheckStatus.hidden = true;
  els.deepCheckResult.hidden = true;
  els.humanSupport.hidden = true;
  els.supportRequest.hidden = true;
  activeService = "";
  document.querySelectorAll(".service-card").forEach(item => item.classList.remove("selected"));
  els.feedbackBar.hidden = true;
  els.printReport.disabled = true;
  els.openConsortium.hidden = false;
  els.consortiumDetails.hidden = true;
  els.callIntelligence.hidden = true;
});
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(item => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); });
  tab.classList.add("active");
  tab.setAttribute("aria-selected", "true");
  renderFindings(tab.dataset.filter);
}));
document.querySelectorAll('input[name="document-type"]').forEach(input => input.addEventListener("change", () => {
  const isConcept = input.value === "concept" && input.checked;
  if (!isConcept && !input.checked) return;
  if (!selectedFile) {
    els.fileTitle.textContent = isConcept ? "Drop your concept draft here" : "Drop your Part B proposal here";
    els.fileSubtitle.textContent = isConcept ? "PDF or DOCX · a one-pager is enough" : "PDF or DOCX · max 50 MB";
  }
}));
