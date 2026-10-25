/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateEvidenceReport, formatMarkdownReport } from '../server/evidence.ts';

describe('OmniPilot X Cryptographic Evidence & Report Suite', () => {
  it('computes deterministic SHA-256 manifest hash over execution history', () => {
    const reportData = {
      taskId: 'test_session_100',
      taskTitle: 'Resolve Regression in chunk()',
      finalStatus: 'VERIFIED_SUCCESS' as const,
      totalDurationMs: 120,
      repairAttemptsUsed: 1,
      maxRepairLimit: 2,
      patches: [
        {
          id: 'patch_1',
          timestamp: '2026-10-16T12:00:00Z',
          fileModified: 'src/collection.mjs',
          unifiedDiff: '+ throw new RangeError()',
          linesAdded: 1,
          linesRemoved: 0,
          repairAttempt: 1,
          appliedBy: 'deterministic_engine' as const,
        },
      ],
      executionRuns: [
        {
          id: 'run_1',
          timestamp: '2026-10-16T12:00:00Z',
          attemptNumber: 0,
          command: 'node --test tests/collection.test.mjs',
          args: [],
          exitCode: 1,
          durationMs: 50,
          stdout: 'FAIL',
          stderr: '',
          status: 'failed' as const,
        },
        {
          id: 'run_2',
          timestamp: '2026-10-16T12:00:10Z',
          attemptNumber: 1,
          command: 'node --test tests/collection.test.mjs',
          args: [],
          exitCode: 0,
          durationMs: 40,
          stdout: 'PASS',
          stderr: '',
          status: 'passed' as const,
        },
      ],
      diagnosticHistory: [],
      acceptanceCriteria: [
        { id: 'c1', description: 'Passes chunk test', verified: true },
      ],
      environmentMetadata: {
        nodeVersion: 'v22.14.0',
        platform: 'linux-x64',
        reproducibilityTag: 'OMNIPILOT_X_OFFLINE_VERIFIED',
        engineMode: 'deterministic_offline' as const,
      },
    };

    const report1 = generateEvidenceReport(reportData);
    const report2 = generateEvidenceReport(reportData);

    assert.equal(report1.manifestHash.length, 64);
    assert.equal(report1.manifestHash, report2.manifestHash);
  });

  it('formats comprehensive Markdown PR audit report', () => {
    const report = generateEvidenceReport({
      taskId: 'session_demo',
      taskTitle: 'Fix chunk remainder edge case',
      finalStatus: 'VERIFIED_SUCCESS' as const,
      totalDurationMs: 85,
      repairAttemptsUsed: 1,
      maxRepairLimit: 2,
      patches: [],
      executionRuns: [],
      diagnosticHistory: [],
      acceptanceCriteria: [
        { id: 'c1', description: 'Zero regression', verified: true },
      ],
      environmentMetadata: {
        nodeVersion: 'v22.14.0',
        platform: 'linux-x64',
        reproducibilityTag: 'OMNIPILOT_X_OFFLINE_VERIFIED',
        engineMode: 'deterministic_offline' as const,
      },
    });

    const markdown = formatMarkdownReport(report);
    assert.match(markdown, /OmniPilot X — Autonomous Execution & Verification Evidence/);
    assert.match(markdown, /Cryptographic Integrity Checksum \(SHA-256\)/);
    assert.match(markdown, /VERIFIED PASS/);
  });
});
