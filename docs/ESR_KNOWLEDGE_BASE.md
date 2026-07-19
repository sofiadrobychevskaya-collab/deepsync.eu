# DeepSync ESR Knowledge Base

The raw knowledge base is private and generated under `private-data/`, which is excluded from Git.

Each deduplicated ESR record contains programme metadata, scores by criterion, evaluator strengths and evaluator shortcomings. Raw proposal text is not stored in the public website.

Build locally:

```bash
python scripts/build-esr-knowledge-base.py <ESR PDFs...> \
  --output private-data/esr/esr-knowledge-base.json \
  --public-output evaluator/data/esr-benchmarks.json
```

Public evaluator patterns must be anonymised and reviewed before export to the browser. The browser must never receive applicant names, proposal numbers, confidential proposal text or raw ESR excerpts.
