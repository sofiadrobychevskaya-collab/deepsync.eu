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
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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
  "calls": [
    {
      "programme": "<HORIZON EUROPE | DIGITAL EUROPE | EIC>",
      "categories": ["<programme plus EIT and/or CASCADE FUNDING where applicable>"],
      "type": "<short action or funding type>",
      "sector": "<short sector label>",
      "sector_tags": ["<1 to 3 concise user-facing sector tags>"],
      "title": "<official or concise call title>",
      "budget": "<verified topic/call budget and, where relevant, amount per project>",
      "deadline": "<ISO-8601 deadline with Brussels timezone>",
      "deadline_label": "<e.g. 1 Oct 2026>",
      "cutoffs": ["<all remaining deadline labels when the call has recurring cut-offs>"],
      "summary": "<one plain-English sentence explaining what is funded and for whom>",
      "source_url": "<official European Commission or Funding & Tenders URL>"
    }
  ],
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
- In "calls", include 4 to 10 currently open calls with future deadlines. Use official EU sources only.
- Add "EIT" for EIT opportunities and "CASCADE FUNDING" for FSTP, open-call and cascade-funding opportunities, regardless of their parent programme.
- Never infer a budget or deadline. If either cannot be verified, omit that call. For calls with recurring cut-offs, put the nearest future cut-off in "deadline" and list every remaining verified date in "cutoffs".
- Prioritise recently opened calls and the nearest useful deadlines across Horizon Europe, Digital Europe and EIC.
- Include 5 to 8 items, ONLY real news you actually found via search. Never invent facts, figures,
  or URLs.
- Prefer official EU sources (ec.europa.eu, eic.ec.europa.eu, etc.) for calls and policy, and
  reputable trackers (tech.eu, Sifted, Dealroom) for market/funding data.
- Keep the tone plain and factual — no hype, no marketing language.
- If you cannot find enough genuinely recent items, return fewer items rather than padding with
  stale or invented ones.
- Do not include any citation markup, footnote markers, or reference tags (e.g. <cite>, [1], or
  similar) anywhere in the output — write plain prose only, with the real URL going solely in
  "source_url".`;

let telegramContext = "";
if (TELEGRAM_BOT_TOKEN) {
  try {
    const allowedUpdates = encodeURIComponent(JSON.stringify(["channel_post", "edited_channel_post", "message"]));
    const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=100&allowed_updates=${allowedUpdates}`);
    if (telegramResponse.ok) {
      const telegramData = await telegramResponse.json();
      telegramContext = (telegramData.result || [])
        .map((update) => {
          const post = update.channel_post || update.edited_channel_post || update.message;
          return post?.text || post?.caption || "";
        })
        .filter(Boolean)
        .slice(-30)
        .join("\n\n--- TELEGRAM POST ---\n\n");
    }
  } catch (error) {
    console.warn("Telegram source unavailable; continuing with official web research.");
  }
}

const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: telegramContext
          ? `Build today's Deep-Sync News Wire digest. Use the following posts from the private DeepSync funding channel as leads, but verify every call, deadline and budget against an official EU source before including it. Never use Telegram as the final source URL.\n\n${telegramContext}`
          : "Build today's Deep-Sync News Wire digest."
      },
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
  // Strip markdown code fences and any inline web-search citation tags
  // (e.g. <cite index="7-2,7-3">...</cite>) the model may add despite being
  // told not to — keep the cited text, drop the tags.
  const clean = textBlocks
    .replace(/```json|```/g, "")
    .replace(/<\/?cite[^>]*>/g, "")
    .trim();
  parsed = JSON.parse(clean);
} catch (err) {
  console.error("Failed to parse model output as JSON:\n", textBlocks);
  process.exit(1);
}

if (!Array.isArray(parsed.items)) {
  console.error("Unexpected shape from model, aborting write:", parsed);
  process.exit(1);
}

if (!Array.isArray(parsed.calls)) parsed.calls = [];

// Cap on total stored items so the file (and the widget's DOM) don't grow
// unbounded forever; oldest items fall off once this is exceeded.
const MAX_ITEMS = 200;

const outPath = path.join(process.cwd(), "data", "news.json");
await fs.mkdir(path.dirname(outPath), { recursive: true });

let existingItems = [];
try {
  const existing = JSON.parse(await fs.readFile(outPath, "utf-8"));
  if (Array.isArray(existing.items)) existingItems = existing.items;
} catch {
  // no existing file yet (first run) — start from an empty history
}

function itemKey(item) {
  return (item.source_url || `${item.category}|${item.headline}`).toLowerCase();
}

const seen = new Set();
const mergedItems = [];
for (const item of [...parsed.items, ...existingItems]) {
  const key = itemKey(item);
  if (seen.has(key)) continue;
  seen.add(key);
  mergedItems.push(item);
}

const output = {
  generated_at: new Date().toISOString(),
  items: mergedItems.slice(0, MAX_ITEMS),
};

await fs.writeFile(outPath, JSON.stringify(output, null, 2));

const callsPath = path.join(process.cwd(), "data", "calls.json");
let existingCalls = [];
try {
  const existing = JSON.parse(await fs.readFile(callsPath, "utf-8"));
  if (Array.isArray(existing.calls)) existingCalls = existing.calls;
} catch {
  // first run
}

const now = Date.now();
const callKey = (call) => (call.source_url || `${call.programme}|${call.title}`).toLowerCase();
const seenCalls = new Set();
const mergedCalls = [...parsed.calls, ...existingCalls]
  .filter((call) => call.deadline && new Date(call.deadline).getTime() >= now)
  .filter((call) => {
    const key = callKey(call);
    if (seenCalls.has(key)) return false;
    seenCalls.add(key);
    return true;
  })
  .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
  .slice(0, 30);

await fs.writeFile(callsPath, JSON.stringify({ generated_at: new Date().toISOString(), calls: mergedCalls }, null, 2));
console.log(
  `Wrote ${output.items.length} news items and ${mergedCalls.length} open calls`
);
