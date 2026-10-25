/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import type { EvidenceReport } from '../src/types.ts';

export function generateEvidenceReport(data: Omit<EvidenceReport, 'id' | 'generatedAt' | 'manifestHash'>): EvidenceReport {
  const generatedAt = new Date().toISOString();
  const id = `evid_${Date.now()}`;

  // Compute deterministic SHA-256 checksum over execution payload
  const hashPayload = JSON.stringify({
    taskId: data.taskId,
    taskTitle: data.taskTitle,
    finalStatus: data.finalStatus,
    repairAttemptsUsed: data.repairAttemptsUsed,
    patches: data.patches.map((p) => ({ file: p.fileModified, diff: p.unifiedDiff })),
    runs: data.executionRuns.map((r) => ({
      cmd: r.command,
      code: r.exitCode,
      dur: r.durationMs,
      status: r.status,
    })),
  });

  const manifestHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  return {
    ...data,
    id,
    generatedAt,
    manifestHash,
  };
}

export function formatMarkdownReport(report: EvidenceReport): string {
  const statusBadge = report.finalStatus === 'VERIFIED_SUCCESS' 
    ? 'VERIFIED PASS' 
    : report.finalStatus === 'REPAIR_LIMIT_EXCEEDED'
    ? 'REPAIR CEILING EXCEEDED'
    : 'POLICY BLOCKED';

  return `# OmniPilot X — Autonomous Execution & Verification Evidence

**Task**: ${report.taskTitle}  
**Session ID**: \`${report.taskId}\`  
**Generated At**: \`${report.generatedAt}\`  
**Final Outcome**: **[${statusBadge}]**  
**Cryptographic Integrity Checksum (SHA-256)**:  
\`\`\`
${report.manifestHash}
\`\`\`

---

## 1. Executive Summary

- **Total Duration**: ${report.totalDurationMs} ms
- **Repair Budget**: ${report.repairAttemptsUsed} of ${report.maxRepairLimit} attempts used
- **Files Modified**: ${report.patches.map((p) => `\`${p.fileModified}\``).join(', ') || 'None'}
- **Engine Mode**: \`${report.environmentMetadata.engineMode}\`
- **Execution Sandbox**: Node.js \`${report.environmentMetadata.nodeVersion}\` (${report.environmentMetadata.platform})

---

## 2. Acceptance Criteria Verification

${report.acceptanceCriteria
  .map((c) => `- [${c.verified ? 'x' : ' '}] **${c.description}** — *${c.verified ? 'VERIFIED' : 'UNVERIFIED'}*`)
  .join('\n')}

---

## 3. Subprocess Execution History (Deterministic Logs)

${report.executionRuns
  .map(
    (run, idx) => `### Run #${idx + 1} (Attempt ${run.attemptNumber}/${report.maxRepairLimit})
- **Command**: \`${run.command}\`
- **Exit Code**: \`${run.exitCode}\` (${(run.status || (run.exitCode === 0 ? 'passed' : 'failed')).toUpperCase()})
- **Duration**: \`${run.durationMs}ms\`

\`\`\`txt
${run.stdout.trim() || '(No stdout)'}
${run.stderr.trim() ? '\n[STDERR]\n' + run.stderr.trim() : ''}
\`\`\`
`
  )
  .join('\n')}

---

## 4. Diagnostics & Repair Trace

${
  report.diagnosticHistory.length === 0
    ? '*No repairs required. Tests passed on baseline execution.*'
    : report.diagnosticHistory
        .map(
          (diag) => `### Diagnostic Attempt #${diag.repairAttempt}
- **Category**: \`${diag.failureCategory}\`
- **Failing Unit**: \`${diag.failingTestName}\` (\`${diag.sourceFile}\`)
- **Root Cause**: ${diag.rootCauseAnalysis}
- **Applied Fix Strategy**: ${diag.proposedPatchStrategy}
`
        )
        .join('\n')
}

---

## 5. Applied Patch (Unified Diff)

${
  report.patches.length === 0
    ? '*No changes were applied to the repository.*'
    : report.patches
        .map(
          (patch) => `\`\`\`diff
${patch.unifiedDiff}
\`\`\`
*(+${patch.linesAdded} / -${patch.linesRemoved} lines by ${patch.appliedBy})*`
        )
        .join('\n\n')
}

---

*Generated deterministically by OmniPilot X Workbench. This document forms an immutable audit record for competition evaluation and PR submission.*
`;
}
