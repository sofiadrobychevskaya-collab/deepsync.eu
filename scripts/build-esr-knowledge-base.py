#!/usr/bin/env python3
"""Build a private, deduplicated ESR knowledge base from Commission PDF reports."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean

from pypdf import PdfReader

CRITERION_RE = re.compile(r"Criterion\s+(\d+)\s*[-–]\s*(.+?)(?=\n\s*Score\s*:)", re.I | re.S)
SCORE_RE = re.compile(r"Score\s*:\s*([0-5](?:[.,]\d+)?)", re.I)
TOTAL_RE = re.compile(r"Total score\s*:\s*([0-9]+(?:[.,]\d+)?)", re.I)
META_PATTERNS = {
    "proposal_number": re.compile(r"Proposal number\s*:\s*([^\n]+)", re.I),
    "acronym": re.compile(r"Proposal acronym\s*:\s*([^\n]+)", re.I),
    "title": re.compile(r"Proposal title\s*:\s*([^\n]+)", re.I),
    "call": re.compile(r"Call\s*:\s*([^\n]+)", re.I),
    "action_type": re.compile(r"Type of action\s*:\s*([^\n]+)", re.I),
}
WEAKNESS = re.compile(r"\b(however|nevertheless|shortcoming|weakness|insufficient|not sufficiently|does not|fails to|lack(?:s|ing)?|unclear|limited|overlooked|not fully|risk)\b", re.I)
STRENGTH = re.compile(r"\b(very well|well[- ](?:defined|designed|structured|developed|aligned)|convincing|credible|comprehensive|appropriate|strong|clearly|good)\b", re.I)


def clean(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text).replace("\u00ad", "").strip()


def extract_text(path: Path) -> tuple[str, int]:
    reader = PdfReader(str(path))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages), len(pages)


def sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])|\n{2,}", clean(text))
    return [clean(part) for part in parts if 45 <= len(clean(part)) <= 900]


def normalise_criterion(value: str) -> str:
    name = clean(value).lower()
    if "relevance" in name:
        return "Relevance"
    if "excellence" in name:
        return "Excellence"
    if "impact" in name:
        return "Impact"
    if "risk" in name and "union support" in name:
        return "Risk & implementation"
    if "implementation" in name or "quality and efficiency" in name:
        return "Implementation"
    return clean(value).split("\n", 1)[0][:140]


def parse_score(body: str) -> float | None:
    line_match = re.search(r"Score\s*:(.{0,180})", body, re.I)
    if not line_match:
        return None
    line = line_match.group(1).split("\n", 1)[0]
    direct = re.match(r"\s*([0-5](?:[.,]\d+)?)", line)
    if direct:
        return float(direct.group(1).replace(",", "."))
    values = re.findall(r"[0-5](?:[.,]\d+)?", line)
    return float(values[-1].replace(",", ".")) if values else None


def criterion_blocks(text: str) -> list[dict]:
    matches = list(CRITERION_RE.finditer(text))
    blocks = []
    for index, match in enumerate(matches):
        body = text[match.end() : matches[index + 1].start() if index + 1 < len(matches) else len(text)]
        observations = sentences(body)
        blocks.append({
            "number": int(match.group(1)),
            "criterion": normalise_criterion(match.group(2)),
            "score": parse_score(body),
            "strengths": [item for item in observations if STRENGTH.search(item) and not WEAKNESS.search(item)][:12],
            "shortcomings": [item for item in observations if WEAKNESS.search(item)][:20],
        })
    return blocks


def record(path: Path, digest: str) -> dict:
    text, pages = extract_text(path)
    metadata = {}
    for key, pattern in META_PATTERNS.items():
        match = pattern.search(text)
        metadata[key] = clean(match.group(1))[:300] if match else ""
    total = TOTAL_RE.search(text)
    return {
        "case_id": digest[:16], "source_file": path.name, "sha256": digest, "pages": pages,
        **metadata,
        "total_score": float(total.group(1).replace(",", ".")) if total else None,
        "criteria": criterion_blocks(text),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--public-output", type=Path)
    args = parser.parse_args()
    seen, records, failures = set(), [], []
    for path in args.inputs:
        if not path.exists() or path.suffix.lower() != ".pdf":
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in seen:
            continue
        seen.add(digest)
        try:
            records.append(record(path, digest))
        except Exception as exc:
            failures.append({"file": path.name, "error": str(exc)})
    output = {
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "privacy": "PRIVATE - contains Commission evaluation excerpts; never publish.",
        "case_count": len(records), "cases": records, "failures": failures,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    if args.public_output:
        grouped = {}
        for case in records:
            for criterion in case["criteria"]:
                if criterion["score"] is None:
                    continue
                grouped.setdefault(criterion["criterion"], []).append(criterion["score"])
        public = {
            "schema_version": "1.0",
            "source": "Anonymised aggregate of private European Commission Evaluation Summary Reports",
            "case_count": len(records),
            "criterion_observation_count": sum(len(values) for values in grouped.values()),
            "shortcoming_observation_count": sum(len(criterion["shortcomings"]) for case in records for criterion in case["criteria"]),
            "strength_observation_count": sum(len(criterion["strengths"]) for case in records for criterion in case["criteria"]),
            "benchmarks": {key: {"mean_score": round(mean(values), 2), "observations": len(values)} for key, values in sorted(grouped.items())},
        }
        args.public_output.parent.mkdir(parents=True, exist_ok=True)
        args.public_output.write_text(json.dumps(public, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"cases": len(records), "failures": len(failures), "output": str(args.output)}))


if __name__ == "__main__":
    main()
