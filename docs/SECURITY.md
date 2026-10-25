# OmniPilot X — Security Architecture & Threat Model

### Threat Model Invariants

| Vector | Mitigation Strategy | Enforced In |
| :--- | :--- | :--- |
| **Prompt Injection** | Scans inputs for directive override patterns (`ignore previous instructions`, `bypass policy`). | `server/security.ts:auditTextForThreats` |
| **Credential Exfiltration** | Sanitizes `process.env`, stripping all API keys (`GEMINI_API_KEY`, AWS tokens, SSH keys) before spawning subprocesses. | `server/security.ts:sanitizeEnvironment` |
| **Arbitrary Code Execution** | Strict regex command allowlist; blocks shell chaining (`;`, `&&`, `\|`, `` ` ``), subshells, and destructive binaries (`rm -rf`, `curl`). | `server/security.ts:validateCommand` |
| **Path Traversal Escape** | Resolves target paths relative to workspace boundary; rejects `../` and attempts to touch `.env` or sensitive system files. | `server/security.ts:validateSafePath` |
| **Unbounded Loops & Cost** | Hard mathematical ceiling: maximum 2 automated repair attempts. Process timeout ceiling at 25 seconds. | `server/repairEngine.ts:diagnoseAndRepair` |
| **Unauthorized File Writes** | Human Policy Gate requires explicit developer confirmation before applying file mutations to repositories. | `src/components/RightInspector.tsx`, `server.ts:/api/tasks/:id/approve` |
