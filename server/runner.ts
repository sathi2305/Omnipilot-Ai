/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import { getSession } from './workspace.ts';
import { validateCommand, sanitizeEnvironment } from './security.ts';
import type { SubprocessExecutionResult } from '../src/types.ts';

const MAX_EXECUTION_TIMEOUT_MS = 25000;

export async function executeSubprocess(
  sessionId: string,
  rawCommand: string,
  attemptNumber: number = 0
): Promise<SubprocessExecutionResult> {
  const startTime = Date.now();
  const session = getSession(sessionId);

  if (!session) {
    return {
      id: `exec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      attemptNumber,
      command: rawCommand,
      args: [],
      exitCode: -1,
      durationMs: 0,
      stdout: '',
      stderr: `Workspace session ${sessionId} does not exist or was cleaned up.`,
      status: 'blocked_by_policy',
    };
  }

  // 1. Verify Command Allowlist
  const validation = validateCommand(rawCommand);
  if (!validation.allowed) {
    return {
      id: `exec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      attemptNumber,
      command: rawCommand,
      args: [],
      exitCode: 126,
      durationMs: Date.now() - startTime,
      stdout: '',
      stderr: `SECURITY POLICY REJECTION: ${validation.reason}`,
      status: 'blocked_by_policy',
    };
  }

  // Parse command binary and arguments
  const parts = rawCommand.trim().split(/\s+/);
  const binary = parts[0];
  const args = parts.slice(1);
  const startCpu = process.cpuUsage();

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let timedOut = false;

    const child = spawn(binary, args, {
      cwd: session.workspacePath,
      env: sanitizeEnvironment(process.env),
      shell: false, // Strict: do not spawn via shell
    });

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 500);
    }, MAX_EXECUTION_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      resolve({
        id: `exec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        attemptNumber,
        command: rawCommand,
        args,
        exitCode: -1,
        durationMs: Date.now() - startTime,
        stdout: stdoutData,
        stderr: stderrData + `\nExecution error: ${err.message}`,
        status: 'failed',
      });
    });

    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const durationMs = Date.now() - startTime;
      const cpuDelta = process.cpuUsage(startCpu);
      const resourceOverhead = {
        peakMemoryMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10,
        cpuUserMs: Math.round(cpuDelta.user / 1000),
        cpuSystemMs: Math.round(cpuDelta.system / 1000),
        memoryLimitMb: 512,
      };

      if (timedOut) {
        resolve({
          id: `exec_${Date.now()}`,
          timestamp: new Date().toISOString(),
          attemptNumber,
          command: rawCommand,
          args,
          exitCode: 124,
          durationMs,
          stdout: stdoutData,
          stderr: stderrData + `\nProcess terminated: exceeded ${MAX_EXECUTION_TIMEOUT_MS}ms timeout ceiling.`,
          status: 'timeout',
          timedOut: true,
          resourceOverhead,
        });
      } else {
        resolve({
          id: `exec_${Date.now()}`,
          timestamp: new Date().toISOString(),
          attemptNumber,
          command: rawCommand,
          args,
          exitCode: code,
          durationMs,
          stdout: stdoutData,
          stderr: stderrData,
          status: code === 0 ? 'passed' : 'failed',
          resourceOverhead,
        });
      }
    });
  });
}
