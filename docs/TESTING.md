# OmniPilot X — Automated Testing Guide

### Running Automated Tests

OmniPilot X uses the native Node.js test runner via `tsx` for hermetic, zero-dependency offline verification:

```bash
npm test
```

### Test Suites

1. **Security & Threat Model (`tests/security.test.ts`)**
   - Verifies command allowlist enforcement (`node --test`, `npm test`, `git status`).
   - Verifies rejection of shell injections (`rm -rf /`, `curl`, `;`, `&&`).
   - Verifies path traversal guards (`../../etc/shadow`, `.env`).
   - Verifies child environment secret sanitization (`GEMINI_API_KEY`, AWS tokens).
   - Verifies prompt injection detection on adversarial inputs.

2. **Bounded Repair Engine (`tests/repairEngine.test.ts`)**
   - Enforces mathematical limit of at most 2 repair cycles.
   - Verifies failure diagnosis and deterministic patch application on `data-kit-ts`.

3. **Cryptographic Evidence & Report (`tests/evidence.test.ts`)**
   - Verifies deterministic calculation of SHA-256 integrity manifest hashes.
   - Verifies automated Markdown PR report generation.
