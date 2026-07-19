#!/usr/bin/env node
// scripts/generate-news.mjs
//
// Calls the Claude API (with the web_search tool) to research this week's
// EU funding / deep-tech news, and writes the result to data/news.json in
// the shape the front-end widget (widget/deepsync-news-widget.js) expects.
//
// Requires the ANTHROPIC_API_KEY environment variable (set as a GitHub
// Actions secret — see README.md).

import fs from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY env var");
  process.exit(1);
}

const SYSTEM_PROMPT = `You are the editor of "Deep-Sync News Wire", a news digest for a European
deep-tech funding & public-affairs consultancy (DeepSync, deep-sync.eu).

Search the web for the most recent (last 7 days) news in these areas:
- EU funding calls and programme updates (Horizon Europe, EIC, Digital Europe, EIT)
- The EU AI Act and other relevant EU tech policy / regulation
- European deep-tech funding rounds and market activity (e.g. weekly funding trackers)

Return STRICT JSON ONLY — no markdown code fences, no commentary before or after — matching
exactly this shape:

{
  "generated_at": "<ISO-8601 timestamp of now>",
  "items": [
    {
      "category": "<one of: AI ACT | EIC | DIGITAL EUROPE | EIT | DEEP TECH | HORIZON EUROPE>",
      "date_label": "<e.g. 'WEEK OF 13 JUL 2026' or '18 JUL 2026'>",
      "headline": "<short punchy headline, no full stop>",
      "body": "<2-4 sentence factual summary, plain English>",
      "what_it_means": "<1-3 sentence practical takeaway for a founder or policy reader>",
      "source_name": "<e.g. 'tech.eu', 'European Commission'>",
      "source_url": "<the real URL you found this at>"
    }
  ]
}

Rules:
- Include 5 to 8 items, ONLY real news you actually found via search. Never invent facts, figures,
  or URLs.
- Prefer official EU sources (ec.europa.eu, eic.ec.europa.eu, etc.) for calls and policy, and
  reputable trackers (tech.eu, Sifted, Dealroom) for market/funding data.
- Keep the tone plain and factual — no hype, no marketing language.
- If you cannot find enough genuinely recent items, return fewer items rather than padding with
  stale or invented ones.`;

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: "Build today's Deep-Sync News Wire digest." },
    ],
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  }),
});

if (!response.ok) {
  console.error("Anthropic API error:", response.status, await response.text());
  process.exit(1);
}

const data = await response.json();

const textBlocks = (data.content || [])
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("\n");

let parsed;
try {
  const clean = textBlocks.replace(/```json|```/g, "").trim();
  parsed = JSON.parse(clean);
} catch (err) {
  console.error("Failed to parse model output as JSON:\n", textBlocks);
  process.exit(1);
}

if (!Array.isArray(parsed.items)) {
  console.error("Unexpected shape from model, aborting write:", parsed);
  process.exit(1);
}

const outPath = path.join(process.cwd(), "data", "news.json");
await fs.mkdir(path.dirname(outPath), { recursive: true });
await fs.writeFile(outPath, JSON.stringify(parsed, null, 2));
console.log(`Wrote ${parsed.items.length} items to ${outPath}`);
