# OmniPilot X — Architecture Documentation

## 1. System Overview

OmniPilot X is an autonomous software engineering workbench designed for local-first execution, strict POSIX sandboxing, bounded repair cycles, and cryptographic evidence attestation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OmniPilot X Workbench UI                         │
│   (React 19 + Tailwind CSS + Lucide Icons + Motion + Tabular Figures)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API & Polling Telemetry
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   OmniPilot X Full-Stack Engine Server                  │
│                      (Express.js + Node.js 22 LTS)                     │
│                                                                        │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌───────────────┐ │
│  │ Project Inspector     │  │ Planning Agent     │  │ Threat Guard  │ │
│  │ - File tree discovery │  │ - DAG dependency   │  │ - Secret san. │ │
│  │ - Language & tests    │  │ - Risk analysis    │  │ - Cmd allow   │ │
│  └──────────┬────────────┘  └─────────┬──────────┘  └───────┬───────┘ │
│             │                         │                     │         │
│  ┌──────────▼─────────────────────────▼─────────────────────▼───────┐ │
│  │            Workspace Isolation (.omnipilot_workspaces/)           │ │
│  │  - Copy-on-write disposable worktree                             │ │
│  │  - Unified diff generator & revert engine                        │ │
│  └────────────────────────────────────┬─────────────────────────────┘ │
│                                       │                               │
│  ┌────────────────────────────────────▼─────────────────────────────┐ │
│  │           Sandboxed Test Runner (child_process.spawn)            │ │
│  │  - 25s timeout ceiling   - Memory & CPU telemetry collection     │ │
│  └────────────────────────────────────┬─────────────────────────────┘ │
│                                       │                               │
│  ┌────────────────────────────────────▼─────────────────────────────┐ │
│  │        Bounded Self-Repair Controller (Strictly <= 2 Cycles)     │ │
│  │  - Deterministic AST Patcher (Offline Default)                   │ │
│  │  - Optional Gemini 2.5 Flash Proxy (/api/agent/reason)           │ │
│  └────────────────────────────────────┬─────────────────────────────┘ │
│                                       │                               │
│  ┌────────────────────────────────────▼─────────────────────────────┐ │
│  │              Evidence & Attestation Generator                    │ │
│  │  - SHA-256 Manifest Hash   - JSON Audit  - Markdown PR Summary   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

## 2. Modular Agent Roles

1. **Project Inspector Agent (`server/agents/agentEngine.ts:runInspectorAgent`)**:
   - Inspects workspace files, identifies language (TypeScript/JavaScript/Python), frameworks, and available test suites.
2. **Planning Agent (`server/agents/agentEngine.ts:runPlanningAgent`)**:
   - Decomposes tasks into ordered DAG stages with risk levels and human authorization flags.
3. **Testing Agent (`server/agents/agentEngine.ts:runTestingAgent`)**:
   - Spawns child process test runners in disposable worktrees; collects stdout/stderr, exit codes, CPU and memory overhead.
4. **Debugging & Repair Agent (`server/repairEngine.ts`)**:
   - Parses assertion failures; synthesizes surgical patches; strictly enforces a maximum of 2 repair cycles.
5. **Review Agent (`server/evidence.ts`)**:
   - Verifies acceptance criteria against actual test execution outcomes; generates cryptographic SHA-256 manifests.

## 3. Storage & State Persistence (`server/database.ts`)

- Real file-backed transactional store in `.omnipilot_data/omnipilot_db.json`.
- Persists projects, tasks, execution runs, file modifications, audit event streams, and final reports.
