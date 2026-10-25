# OmniPilot X — REST API Specification

### 1. Health & Resource Telemetry
- `GET /api/health` — System status, Node runtime version, platform, and Gemini configuration.
- `GET /api/system/metrics` — Real-time CPU percentage, memory RSS, heap utilization, and sandbox limits.
- `GET /api/metrics` — Persisted dashboard metrics (tasks completed, tests passed, repair rate, files modified).

### 2. Projects & Fixtures
- `GET /api/projects` — List registered workspaces and projects.
- `POST /api/projects` — Register a new project workspace.
- `GET /api/fixtures` — List bundled benchmark fixtures (`data-kit-ts`).

### 3. Task Lifecycle
- `GET /api/tasks` — List all persisted tasks (optional `?projectId=` filter).
- `POST /api/tasks` — Submit a natural-language engineering task.
- `GET /api/tasks/:task_id` — Fetch complete task record with execution runs and patches.
- `POST /api/tasks/:task_id/plan` — Generate dependency-aware DAG execution plan.
- `POST /api/tasks/:task_id/approve` — Authorize human approval gate for code modifications.
- `POST /api/tasks/:task_id/cancel` — Cancel active task execution.
- `GET /api/tasks/:task_id/events` — Retrieve immutable audit trail events.
- `GET /api/tasks/:task_id/files` — List files in the task's isolated workspace.
- `GET /api/tasks/:task_id/file-content?path=...` — Read source code of a workspace file.
- `POST /api/tasks/:task_id/file-content` — Update file content in workspace.
- `GET /api/tasks/:task_id/diff` — Fetch unified git diffs for staged modifications.
- `GET /api/tasks/:task_id/tests` — Fetch subprocess execution results.
- `GET /api/tasks/:task_id/logs` — Fetch raw stdout and stderr logs.
- `GET /api/tasks/:task_id/report` — Fetch cryptographic completion report and Markdown summary.

### 4. Sandboxed Workspaces
- `POST /api/workspaces/create` — Initialize isolated copy-on-write workspace.
- `POST /api/workspaces/inspect` — Run static security and repository health audit.
- `POST /api/workspaces/run-test` — Execute subprocess test command with timeout.
- `POST /api/workspaces/diagnose-and-repair` — Triage failure and apply bounded patch ($\le 2$).
- `POST /api/workspaces/evidence` — Compute SHA-256 manifest and export reports.
- `POST /api/workspaces/cleanup` — Dispose temporary workspace jail.
