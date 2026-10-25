# OmniPilot X — Autonomous Software Engineering Workbench

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Test Suite](https://img.shields.io/badge/Tests-9%20Passing-emerald.svg)](https://github.com)
[![Competition Compliance](https://img.shields.io/badge/OmniRush-100%25%20Compliant-brightgreen.svg)](https://unstop.com)
[![Docker Support](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)

**OmniPilot X** is an open-source, local-first autonomous software engineering workbench built for individual developers, open-source maintainers, and evaluation judges. It takes a plain-language software task, inspects the target codebase, formulates a verified dependency-aware plan, executes isolated test suites, conducts bounded self-repairs (strictly $\le 2$ attempts), and generates cryptographic, reproducible evidence reports.

Designed as an individual entry for the **OmniRush Agentic Buildathon 2026**.

---

## Key Capabilities & Architectural Differentiators

1. **Subprocess Sandboxing with Strict POSIX Isolation**
   - Subprocess executions (`child_process.spawn`) operate inside isolated copy-on-write worktrees (`.omnipilot_workspaces/<session-id>/`).
   - Hard execution timeout ceiling (25,000ms) with `SIGTERM`/`SIGKILL` process traps.
   - Read-only original fixture preservation—the source repository is never mutated without explicit authorization.

2. **Dual-Mode Repair Architecture (Competition Compliant)**
   - **Deterministic AST Engine (Default)**: 100% reproducible offline heuristic and AST patcher requiring 0 external AI API calls or tokens. Guarantees that evaluation judges can clone and verify offline without API keys.
   - **Gemini 2.5 Flash Enhanced Mode (Optional)**: Proxied server-side reasoning via `@google/genai` when configured with a `GEMINI_API_KEY`.

3. **Strict Bounded Self-Repair Protocol**
   - Hard mathematical ceiling of **at most 2 repair cycles**.
   - If tests fail after attempt #2, the agent immediately halts with status `NEEDS_HUMAN_INTERVENTION`.
   - Prevents runaway loop recursion, hallucinated fixes, and cost escalation.

4. **Cryptographic Integrity & Verifiable Evidence Reports**
   - Calculates a deterministic SHA-256 manifest checksum over task inputs, execution durations, exit codes, and unified patches.
   - Exports machine-readable JSON reports, human-readable Markdown PR summaries, and standard unified `.patch` files.
   - Adheres to the core principle: **Never label an unverified change as successful**.

5. **Threat Guard Security Layer**
   - **Secret Sanitizer**: Strips credentials (`GEMINI_API_KEY`, AWS tokens, SSH paths) from child process environments.
   - **Command Allowlist**: Restricts command execution to safe test/lint/git probers (`node --test`, `npm test`, `git status`). Rejects shell injections, chained operators (`;`, `&&`, `||`), and subshells.
   - **Prompt Injection Detector**: Scans task instructions and repository comments for injection strings (`ignore previous instructions`, `bypass security`).

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OmniPilot X Workbench UI                         │
│   (React 19 + Tailwind CSS + Lucide Icons + Motion + Tabular Figures)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / Server-Sent Events (SSE)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   OmniPilot X Express Engine Server                     │
│                           (Node.js / TypeScript)                       │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌───────────────┐ │
│  │  Repository Inspector │  │ Task Planner Engine│  │ Threat Guard  │ │
│  │  - File tree & AST    │  │ - DAG dependency   │  │ - Secret san. │ │
│  │  - Git status & diff  │  │ - Risk analysis    │  │ - Cmd allow   │ │
│  └──────────┬────────────┘  └─────────┬──────────┘  └───────┬───────┘ │
│             │                         │                     │         │
│  ┌──────────▼─────────────────────────▼─────────────────────▼───────┐ │
│  │               Workspace Jail (.omnipilot_workspaces/)             │ │
│  │  - Copy-on-write disposable worktree                             │ │
│  │  - Unified patch applicator & reverser                           │ │
│  └────────────────────────────────────┬─────────────────────────────┘ │
│                                       │                               │
│  ┌────────────────────────────────────▼─────────────────────────────┐ │
│  │           Sandboxed Test Runner (child_process.spawn)            │ │
│  │  - Hard timeouts (25s)  - Allowlist only  - Stdout/stderr pipe   │ │
│  └────────────────────────────────────┬─────────────────────────────┘ │
│                                       │                               │
│  ┌────────────────────────────────────▼─────────────────────────────┐ │
│  │       Diagnostic & Bounded Repair Engine (Attempts: 0/2)         │ │
│  │  - Deterministic AST Patcher (Offline Default)                   │ │
│  │  - Optional Gemini 2.5 Flash Proxy (/api/agent/reason)           │ │
│  └────────────────────────────────────┬─────────────────────────────┘ │
│                                       │                               │
│  ┌────────────────────────────────────▼─────────────────────────────┐ │
│  │              Evidence & Attestation Generator                    │ │
│  │  - SHA-256 Run Manifest  - JSON Audit  - Markdown PR Summary     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Threat Model & Security Mitigations

| Threat Vector | Mitigation in OmniPilot X | Verified By Test |
| :--- | :--- | :--- |
| **Prompt Injection** | Scans inputs for directive override patterns (`ignore previous instructions`, `bypass controls`). | `tests/security.test.ts` |
| **Credential Exfiltration** | Sanitizes `process.env`, stripping all API keys, cloud tokens, and SSH keys before spawning child processes. | `tests/security.test.ts` |
| **Arbitrary Code Execution** | Strict command allowlist regex; blocks shell chaining (`;`, `&&`, `|`, `` ` ``), subshells, and destructive binaries. | `tests/security.test.ts` |
| **Path Traversal Escape** | Resolves target paths relative to workspace boundary; rejects `../` and attempts to touch `.env` or sensitive system files. | `tests/security.test.ts` |
| **Unbounded Loops & Cost** | Hard mathematical bound: maximum 2 automated repair attempts. Process timeout ceiling at 25 seconds. | `tests/repairEngine.test.ts` |

---

## Quickstart & Installation

### Prerequisites
- **Node.js**: $\ge 22.0.0$
- **npm**: $\ge 10.0.0$
- **Git**

### 1. Clone & Install
```bash
git clone https://github.com/your-username/omnipilot-x.git
cd omnipilot-x
npm install
```

### 2. Configure Environment (Optional)
Copy the template file:
```bash
cp .env.example .env
```
*Note: OmniPilot X operates in 100% deterministic offline mode by default without any API keys required.*

### 3. Run Automated Tests
Execute the full unit, security, and verification test suite:
```bash
npm test
```
**Recorded Outcome**: 9 tests pass across Security & Threat Model, Bounded Repair Engine, and Cryptographic Evidence.

### 4. Start Development Workbench
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Power-User Keyboard Shortcuts

OmniPilot X includes global keybindings for efficient developer navigation:

| Keybinding | Action |
| :--- | :--- |
| `Ctrl + Enter` / `⌘ + Enter` | Advance to next workflow stage / execute active stage action |
| `Ctrl + R` / `Alt + R` | Reset workspace session and reload pristine benchmark fixture |
| `Ctrl + Shift + A` / `Alt + A` | Toggle Human Approval Gate for staged modifications |
| `1` / `2` / `3` / `4` | Directly switch between Workbench tabs (Intake, Plan, Diff, Evidence) |
| `?` or `Ctrl + /` | Open the interactive keyboard shortcuts cheat-sheet modal |
| `Esc` | Close open dialogs and dismiss focus |

---

## Docker Deployment

Build and run the hermetic container:
```bash
docker build -t omnipilot-x:latest .
docker run -p 3000:3000 omnipilot-x:latest
```

---

## Step-by-Step Autonomous Workflow (Live Demo)

1. **Intake & Static Audit**: Select the bundled `data-kit-ts` benchmark fixture. Review the static repository health score and threat guard audit.
2. **DAG Plan Formulation**: The engine creates a 5-step dependency-aware plan with risk classifications.
3. **Baseline Subprocess Execution**: Click **Run Test** to execute `node --test tests/collection.test.mjs`. Observe 2 reproducible failures in `chunk()` (missing `RangeError` on `size <= 0` and trailing remainder element truncation).
4. **Human Policy Gate**: In the **Plan & Policy Gate** tab, review the proposed changes and click **Approve & Authorize**.
5. **Bounded Auto-Repair (Attempt 1/2)**: The engine diagnoses stderr logs and synthesizes a surgical patch for `src/collection.mjs`.
6. **Regression Verification**: Re-run the test suite. All 5 test cases pass with exit code `0`. Zero regression detected.
7. **Evidence Attestation**: View and export the cryptographic SHA-256 manifest, JSON evidence report, and Markdown PR summary.

---

## Submission Checklist (OmniRush & Unstop)

- [x] **Single-Agent Compliance**: OmniRush was the sole generative AI or agent tool used during development.
- [x] **Zero Secondary AI Assistants**: No external cursor, copilot, or unapproved AI coding tools introduced.
- [x] **Deterministic Offline Mode**: Fully runnable and verifiable without external API tokens.
- [x] **Verifiable Tests**: Automated test suite passing (`npm test`, 9/9 pass).
- [x] **Open Source License**: Apache-2.0 OSI-approved license included.
- [x] **Docker Container**: Validated `Dockerfile` with multi-stage build.
- [x] **Evidence Exports**: Sample JSON (`examples/evidence_report.json`) and Markdown (`examples/evidence_report.md`) generated from real runs.
- [x] **OFB Submission ID**: Ready for attachment upon official submission form submission.

---

## License

OmniPilot X is open-source software licensed under the [Apache License, Version 2.0](LICENSE).
