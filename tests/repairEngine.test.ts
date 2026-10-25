/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseAndRepair } from '../server/repairEngine.ts';
import { createIsolatedWorkspace, cleanupWorkspace, readWorkspaceFile } from '../server/workspace.ts';
import type { SubprocessExecutionResult } from '../src/types.ts';

describe('OmniPilot X Bounded Repair Engine Suite', () => {
  it('enforces hard ceiling of 2 repair attempts', async () => {
    const session = await createIsolatedWorkspace('data-kit-ts');

    const fakeExecution: SubprocessExecutionResult = {
      id: 'exec_fail_1',
      timestamp: new Date().toISOString(),
      attemptNumber: 2,
      command: 'node --test tests/collection.test.mjs',
      args: [],
      exitCode: 1,
      durationMs: 40,
      stdout: '',
      stderr: 'RangeError assertion failed',
      status: 'failed',
    };

    // Attempt 3 must be rejected because max is 2
    const result = await diagnoseAndRepair(session.sessionId, fakeExecution, 2, 'deterministic_offline');
    assert.equal(result.allowed, false);
    assert.match(result.rejectionReason || '', /Bounded repair limit exceeded/);

    await cleanupWorkspace(session.sessionId);
  });

  it('diagnoses RangeError omission and applies surgical patch under attempt budget', async () => {
    const session = await createIsolatedWorkspace('data-kit-ts');

    const initialCode = await readWorkspaceFile(session.sessionId, 'src/collection.mjs');
    assert.equal(initialCode.includes("throw new RangeError('Chunk size must be greater than 0')"), false);

    const failingExecution: SubprocessExecutionResult = {
      id: 'exec_fail_0',
      timestamp: new Date().toISOString(),
      attemptNumber: 0,
      command: 'node --test tests/collection.test.mjs',
      args: [],
      exitCode: 1,
      durationMs: 35,
      stdout: 'Missing expected exception (RangeError)',
      stderr: '',
      status: 'failed',
    };

    const repairResult = await diagnoseAndRepair(session.sessionId, failingExecution, 0, 'deterministic_offline');
    assert.equal(repairResult.allowed, true);
    assert.equal(repairResult.attemptNumber, 1);
    assert.equal(repairResult.diagnostic.failureCategory, 'assertion_mismatch');

    const updatedCode = await readWorkspaceFile(session.sessionId, 'src/collection.mjs');
    assert.equal(updatedCode.includes("throw new RangeError('Chunk size must be greater than 0')"), true);

    await cleanupWorkspace(session.sessionId);
  });
});
