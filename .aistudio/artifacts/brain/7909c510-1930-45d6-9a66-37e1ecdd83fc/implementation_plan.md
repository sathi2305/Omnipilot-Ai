# OmniPilot X — Autonomous Software Engineering Workbench

OmniPilot X is an open-source, local-first autonomous software engineering platform designed for individual developers, open-source maintainers, and evaluation judges. It takes a plain-language software task, inspects the target codebase, formulates a verified dependency-aware plan, produces isolated reviewable diffs, executes strictly sandboxed tests, conducts bounded repairs (max 2 attempts), and generates cryptographic, reproducible evidence reports.

***

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1 clarification and form the non-negotiable foundation for Phase 0 and subsequent milestones:

- **Execution Engine**: **Full-stack Express backend with real Node subprocess execution**. OmniPilot X integrates a real local execution server running child processes with POSIX timeouts, SIGTERM/SIGKILL escalation, memory limits, and strict command allowlisting rather than mock simulators.
- **Autonomous Repair & Reasoning Engine**: **Dual-mode architecture**. The primary default engine is a 100% deterministic heuristic and AST-pattern patcher ensuring offline reproducibility and strict OmniRush competition compliance. An optional server-side toggle enables `@google/genai` (Gemini 2.5 Flash) via server proxy (`/api/agent/reason`) when credentials are provided.
- **Bundled Benchmark Fixture**: **TypeScript algorithmic utility package (`data-kit-ts`)** featuring genuine Vitest test suites, including an edge-case regression failure in chunking/memoization, type errors, and performance regression tests.

***

## 1. Overview & Core Concept

- **What It Does**: OmniPilot X automates the end-to-end software engineering task lifecycle: intake, static repository scanning, plan synthesis with human approval gate, isolated worktree patching, sandboxed test execution, automated failure triage, bounded self-repair, and verifiable evidence export (JSON/Markdown/Patch).
- **Target Audience & Persona**: Individual engineers, open-source maintainers reviewing contributor PRs, and competition judges evaluating autonomous agent rigor, reproducibility, and safety.
- **Key Value**: Replaces black-box, unverified AI code generators with an auditable, safety-bounded autonomous workbench that never pushes unapproved code and never marks an unverified change as successful.

***

## 2. User Experience & Visual Design

Following the universal frontend design constitution and SaaS developer console guidelines (`references/3_saas_dashboard.md`):

- **Visual Direction & Palette**: High-contrast, dense dark slate workbench (`#090D16` canvas, `#111827` surface panels, `#1E293B` borders). High-intent visual accents: Deep Blue (`#2563EB`) for execution primary actions, Emerald (`#059669`) for verified passing tests, Amber (`#D97706`) for pending approvals and bounded retries, and Rose (`#E11D48`) for test/security failures.
- **Typography & Tabular Discipline**: Distinctive headline type (`Plus Jakarta Sans`) paired with high-legibility body type (`DM Sans`). All telemetry, execution times, diff line numbers, exit codes, and hashes strictly formatted with tabular figures (`font-mono tabular-nums`).
- **Zero-Pill & Metadata Discipline**: Metadata rendered as quiet unboxed text separated by subtle middots (`·`). Interactive filters and run toggles rendered as solid segmented buttons with clear active states.
- **Top Bar Contract**: Strict 1-row, 3-zone layout:
  1. Brand Zone: `OmniPilot X` wordmark with quiet subtitle indicator below.
  2. Nav Zone: 4 clean single-line section links: `Task Intake`, `Workspace Plan`, `Diff & Repair`, `Evidence & Audit`.
  3. Action Zone: `New Task` primary button and Engine Mode toggle (`Deterministic Offline` vs `Gemini Enhanced`).
- **Interactive Workbench Panels**:
  - **Left Rail (Task & Repo Context)**: Repository tree inspector, branch/commit status, safety policy status, and acceptance criteria tracker.
  - **Center Stage (Plan & Execution Timeline)**: Interactive DAG plan steps, live subprocess terminal with real stdout/stderr streaming, and unified side-by-side git diff viewer.
  - **Right Rail (Verification & Evidence)**: Deterministic test results, exit codes, failure diagnosis tree, bounded repair budget gauge (Attempt 0/2, 1/2, 2/2), and export buttons (JSON / Markdown / Git Patch).
  - **Floating Action Modal / Banner**: Safety Approval Gate requiring explicit human confirmation before file commits, network requests, or destructive operations.

***

## 3. Key Product Decisions & Trade-Offs

### A. Strict Competition Compliance & Dual-Mode Engine
- *Chosen Approach*: Deliver an offline-first deterministic rule-and-AST repair engine as the default, accompanied by an optional server-side Gemini 2.5 Flash reasoning mode.
- *Why*: Guarantees that judges can clone, test, and run the entire suite offline with zero external API dependencies or token failures, while remaining 100% compliant with competition rules prohibiting secondary third-party agent tools.

### B. Real Process Sandboxing & Threat Model
- *Chosen Approach*: Subprocess execution via Node `child_process.spawn` within a dedicated workspace jail (`.omnipilot_workspaces/<session-id>/`), bounded by:
  - Command allowlist (`npm test`, `npx vitest run`, `node --test`, `git diff`, `git status`).
  - Hard timeout ceiling (default 30 seconds per run).
  - Memory limit (512MB max child memory).
  - Environment sanitization (strips `GEMINI_API_KEY`, AWS/GCP keys, and SSH paths before spawning child processes).
  - Path traversal guard (rejects `../` escaping workspace root).
- *Why*: Prevents malicious repositories from executing arbitrary shell scripts or leaking developer credentials.

### C. Bounded Self-Repair Protocol
- *Chosen Approach*: Hard ceiling of at most 2 automated repair cycles. If tests do not pass after attempt #2, execution halts with status `NEEDS_HUMAN_INTERVENTION`.
- *Why*: Eliminates runaway loops, excessive token burn, and hallucinated fixes.

***

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

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
│  │  - Hard timeouts (30s)  - Allowlist only  - Stdout/stderr pipe   │ │
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

### Data Models

```typescript
export interface TaskIntake {
  id: string;
  title: string;
  description: string;
  targetRepoPath: string;
  acceptanceCriteria: string[];
  constraints: string[];
  allowedCommands: string[];
}

export interface PlanStep {
  id: string;
  order: number;
  phase: 'inspect' | 'patch' | 'test' | 'diagnose' | 'repair' | 'verify';
  title: string;
  description: string;
  targetFiles: string[];
  estimatedRisk: 'low' | 'medium' | 'high';
  requiresHumanApproval: boolean;
  status: 'pending' | 'approved' | 'running' | 'completed' | 'failed' | 'skipped';
}

export interface ExecutionRun {
  id: string;
  taskId: string;
  timestamp: string;
  attemptNumber: number; // 0 = initial, 1 = repair 1, 2 = repair 2
  status: 'running' | 'passed' | 'failed' | 'timeout' | 'blocked';
  command: string;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  patchApplied: string;
  changedFiles: string[];
  diagnostics?: {
    failureCategory: 'test_failure' | 'syntax_error' | 'timeout' | 'runtime_exception';
    rootCauseFile: string;
    suggestedFix: string;
  };
}

export interface EvidenceReport {
  taskId: string;
  generatedAt: string;
  taskTitle: string;
  finalStatus: 'VERIFIED_SUCCESS' | 'REPAIR_LIMIT_EXCEEDED' | 'REJECTED_BY_POLICY';
  totalDurationMs: number;
  totalRepairAttempts: number;
  gitDiff: string;
  filesModified: string[];
  testRuns: ExecutionRun[];
  manifestHash: string; // SHA-256 of all inputs, patches, and outcomes
}
```

***

## 5. Implementation Milestones & Verification Strategy

- **Milestone 1**: Foundation & Architecture Setup
  - Configure full-stack server integration (`server.ts` with Express).
  - Verify TypeScript compilation, clean dependencies, and script wiring.
- **Milestone 2**: Task Intake, Repository Scanner & Threat Guard
  - Implement repo directory inspector, ignore-file parser, secret pattern detector.
  - Implement task intake validator and dependency-aware DAG planner.
- **Milestone 3**: Isolated Workspace Engine & Diff Generator
  - Implement disposable directory manager (`.omnipilot_workspaces/`).
  - Unified patch applicator and side-by-side git diff viewer.
- **Milestone 4**: Sandboxed Subprocess Test Runner & Bounded Repair
  - POSIX process spawner with timeout kill switch and allowlist enforcement.
  - Failure diagnosis tree and bounded 2-cycle self-repair engine.
- **Milestone 5**: Interactive Developer Workbench UI
  - Real-time task dashboard, execution logs stream, approval modal, and diff viewer.
- **Milestone 6**: Bundled TypeScript Fixture & Automated Test Suite
  - Package real `data-kit-ts` test suite fixture with intentional regression.
  - Unit and security integration tests (path traversal, unsafe command rejection).
- **Milestone 7**: Evidence Export, README, Dockerfile & Submission Package
  - Reproducible JSON/Markdown export, Dockerfile, comprehensive README, and competition checklist.
