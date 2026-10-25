/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { listWorkspaceFiles, readWorkspaceFile, writeWorkspaceFile, getSessionDiff } from '../workspace.ts';
import { executeSubprocess } from '../runner.ts';
import { diagnoseAndRepair } from '../repairEngine.ts';
import { generateEvidenceReport, formatMarkdownReport } from '../evidence.ts';
import { logAuditEvent, saveTask, type TaskRecord, type TaskStatus } from '../database.ts';
import type { PlanStep, DiagnosticTriage, PatchRecord, SubprocessExecutionResult } from '../../src/types.ts';

// -------------------------------------------------------------
// 1. Project Inspector Agent
// -------------------------------------------------------------
export async function runInspectorAgent(sessionId: string) {
  const files = await listWorkspaceFiles(sessionId);
  let detectedLanguage = 'JavaScript/TypeScript';
  let detectedFramework = 'Node.js Native Test Runner';
  let hasTests = false;

  for (const f of files) {
    if (f.path.endsWith('.py')) detectedLanguage = 'Python';
    if (f.path.endsWith('.ts') || f.path.endsWith('.tsx')) detectedLanguage = 'TypeScript';
    if (f.path === 'package.json') detectedFramework = 'Node.js';
    if (f.path === 'pyproject.toml') detectedFramework = 'Python Poetry/Pip';
    if (f.isTest) hasTests = true;
  }

  return {
    filesCount: files.length,
    files,
    detectedLanguage,
    detectedFramework,
    hasTests,
    summary: `Discovered ${files.length} project files. Target environment: ${detectedLanguage} (${detectedFramework}). Tests detected: ${hasTests ? 'Yes' : 'No'}.`,
  };
}

// -------------------------------------------------------------
// 2. Planning Agent
// -------------------------------------------------------------
export async function runPlanningAgent(taskTitle: string, taskDescription: string, files: string[]): Promise<PlanStep[]> {
  const isCustomOrGeneric = !files.includes('src/collection.mjs');

  const steps: PlanStep[] = [
    {
      id: 'step_1',
      order: 1,
      phase: 'inspect',
      title: 'Repository & Dependency Manifest Audit',
      description: 'Discover source structure, detect package manifests, and verify static code invariants.',
      targetFiles: files.slice(0, 3),
      estimatedRisk: 'low',
      requiresHumanApproval: false,
      status: 'completed',
      outputSummary: `Inspected ${files.length} files. Language and framework verified.`,
    },
    {
      id: 'step_2',
      order: 2,
      phase: 'test',
      title: 'Execute Baseline Verification Suite in POSIX Sandbox',
      description: 'Run allowed test command in disposable workspace to record baseline pass/fail outcome.',
      targetFiles: files.filter((f) => f.includes('test')),
      estimatedRisk: 'low',
      requiresHumanApproval: false,
      status: 'pending',
    },
    {
      id: 'step_3',
      order: 3,
      phase: 'diagnose',
      title: 'Deterministic Failure Triage & Root Cause Isolation',
      description: 'Parse stdout/stderr logs and isolate assertion mismatches, boundary errors, or missing exceptions.',
      targetFiles: files.filter((f) => !f.includes('test')),
      estimatedRisk: 'low',
      requiresHumanApproval: false,
      status: 'pending',
    },
    {
      id: 'step_4',
      order: 4,
      phase: 'repair',
      title: 'Synthesize & Apply Bounded Repair Patch (Attempt 1/2)',
      description: 'Generate surgical diff complying with repository conventions. Strictly bounded by policy limit.',
      targetFiles: files.filter((f) => !f.includes('test') && !f.includes('json') && !f.includes('md')),
      estimatedRisk: 'medium',
      requiresHumanApproval: true,
      status: 'pending',
    },
    {
      id: 'step_5',
      order: 5,
      phase: 'verify',
      title: 'Regression Guard & Final Verification Suite',
      description: 'Re-run all tests to guarantee 100% test pass rate with zero regression in existing test fixtures.',
      targetFiles: files.filter((f) => f.includes('test')),
      estimatedRisk: 'low',
      requiresHumanApproval: false,
      status: 'pending',
    },
  ];

  return steps;
}

// -------------------------------------------------------------
// 3. Testing Agent
// -------------------------------------------------------------
export async function runTestingAgent(
  sessionId: string,
  command: string = 'node --test tests/collection.test.mjs',
  attemptNumber: number = 0
): Promise<SubprocessExecutionResult> {
  return await executeSubprocess(sessionId, command, attemptNumber);
}

// -------------------------------------------------------------
// 4. Debugging & Repair Agent
// -------------------------------------------------------------
export async function runRepairAgent(
  sessionId: string,
  lastExecution: SubprocessExecutionResult,
  currentAttempt: number,
  engineMode: 'deterministic_offline' | 'gemini_enhanced' = 'deterministic_offline'
) {
  return await diagnoseAndRepair(sessionId, lastExecution, currentAttempt, engineMode);
}

// -------------------------------------------------------------
// 5. Documentation & Review Agent
// -------------------------------------------------------------
export function runReviewAgent(data: {
  taskId: string;
  taskTitle: string;
  finalStatus: 'VERIFIED_SUCCESS' | 'REPAIR_LIMIT_EXCEEDED' | 'REJECTED_BY_POLICY';
  totalDurationMs: number;
  repairAttemptsUsed: number;
  maxRepairLimit: number;
  patches: PatchRecord[];
  executionRuns: SubprocessExecutionResult[];
  diagnosticHistory: DiagnosticTriage[];
  acceptanceCriteria: { id: string; description: string; verified: boolean }[];
  engineMode: 'deterministic_offline' | 'gemini_enhanced';
}) {
  const report = generateEvidenceReport({
    ...data,
    environmentMetadata: {
      nodeVersion: process.version,
      platform: `${process.platform}-${process.arch}`,
      reproducibilityTag: 'OMNIPILOT_X_OFFLINE_VERIFIED',
      engineMode: data.engineMode,
    },
  });

  const markdown = formatMarkdownReport(report);
  return { report, markdown };
}
