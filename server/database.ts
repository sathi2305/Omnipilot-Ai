/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { 
  TaskIntake, 
  PlanStep, 
  SubprocessExecutionResult, 
  PatchRecord, 
  DiagnosticTriage, 
  EvidenceReport 
} from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), '.omnipilot_data');
const DB_FILE = path.join(DATA_DIR, 'omnipilot_db.json');

export type TaskStatus = 
  | 'queued' 
  | 'planning' 
  | 'awaiting_approval' 
  | 'executing' 
  | 'testing' 
  | 'repairing' 
  | 'in_progress'
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type ExecutionMode = 'plan_only' | 'supervised' | 'autonomous';

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  fixtureName: string;
  language: string;
  framework: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  language: string;
  framework: string;
  mode: ExecutionMode;
  status: TaskStatus;
  currentStage: string;
  maxRepairAttempts: number;
  repairAttemptsUsed: number;
  timeoutSeconds: number;
  acceptanceCriteria: { id: string; description: string; verified: boolean }[];
  allowedCommands: string[];
  sessionId: string;
  planSteps: PlanStep[];
  patches: PatchRecord[];
  executionRuns: SubprocessExecutionResult[];
  diagnostics: DiagnosticTriage[];
  isHumanApproved: boolean;
  finalReport?: EvidenceReport;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  taskId?: string;
  timestamp: string;
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'security';
  metadata?: Record<string, any>;
}

export interface DatabaseSchema {
  version: number;
  projects: ProjectRecord[];
  tasks: TaskRecord[];
  auditEvents: AuditEvent[];
}

const DEFAULT_DB: DatabaseSchema = {
  version: 1,
  projects: [
    {
      id: 'proj_datakit',
      name: 'data-kit-ts Utility Library',
      description: 'High-performance collection utilities library with Vitest/Node test runner.',
      fixtureName: 'data-kit-ts',
      language: 'TypeScript',
      framework: 'Node.js',
      createdAt: '2026-10-16T12:00:00Z',
      updatedAt: '2026-10-16T12:00:00Z',
    },
    {
      id: 'proj_jwtguard',
      name: 'express-jwt-guard',
      description: 'Zero-trust JWT authentication middleware with bounded clock skew tolerance.',
      fixtureName: 'jwt-guard-ts',
      language: 'TypeScript',
      framework: 'Express',
      createdAt: '2026-10-18T09:30:00Z',
      updatedAt: '2026-10-18T09:30:00Z',
    },
    {
      id: 'proj_matrixmath',
      name: 'fast-matrix-sim',
      description: 'High-performance computational matrix math and WebGL linear algebra kernel.',
      fixtureName: 'matrix-math-ts',
      language: 'TypeScript',
      framework: 'Native',
      createdAt: '2026-10-20T14:15:00Z',
      updatedAt: '2026-10-20T14:15:00Z',
    },
  ],
  tasks: [
    {
      id: 'task_datakit_01',
      projectId: 'proj_datakit',
      title: 'Resolve Edge-Case Regression in chunk() & Enforce RangeError Contract',
      description: 'Investigate and resolve test failures in data-kit-ts: chunk() must validate size > 0 throwing RangeError, and retain trailing remainder slices without truncation.',
      language: 'TypeScript',
      framework: 'Node.js',
      mode: 'supervised',
      status: 'completed',
      currentStage: 'Stage 7: Cryptographic Evidence Attestation',
      maxRepairAttempts: 2,
      repairAttemptsUsed: 1,
      timeoutSeconds: 25,
      acceptanceCriteria: [
        { id: 'c1', description: 'chunk() evenly partitions array without data loss', verified: true },
        { id: 'c2', description: 'chunk() retains trailing remainder slices for odd array lengths', verified: true },
        { id: 'c3', description: 'chunk() throws RangeError if size <= 0', verified: true },
        { id: 'c4', description: 'groupBy() and compact() maintain 100% regression pass rate', verified: true },
      ],
      allowedCommands: ['node --test tests/collection.test.mjs', 'npm test', 'git diff'],
      sessionId: 'sess_datakit_initial',
      planSteps: [],
      patches: [
        {
          id: 'patch_01',
          fileModified: 'src/collection.mjs',
          explanation: 'Add chunk size <= 0 RangeError check and fix Math.ceil remainder slicing bounds',
          patchDiff: '@@ -12,3 +12,8 @@\n+ if (size <= 0) throw new RangeError("Chunk size must be greater than 0");',
          appliedAt: '2026-10-24T18:12:00Z',
          verifiedByTest: true,
        },
      ],
      executionRuns: [
        {
          command: 'node --test tests/collection.test.mjs',
          exitCode: 1,
          stdout: '# Subtest: chunk() handles edge cases\nnot ok 2 - should throw RangeError when size is 0',
          stderr: '',
          durationMs: 312,
          executedAt: '2026-10-24T18:10:00Z',
          telemetry: { userCpuMicros: 42000, sysCpuMicros: 12000, memoryRssMb: 38.4 },
        },
        {
          command: 'node --test tests/collection.test.mjs',
          exitCode: 0,
          stdout: '# pass 6\n# fail 0\n# ok',
          stderr: '',
          durationMs: 295,
          executedAt: '2026-10-24T18:14:00Z',
          telemetry: { userCpuMicros: 39000, sysCpuMicros: 11000, memoryRssMb: 39.1 },
        },
      ],
      diagnostics: [
        {
          targetFile: 'src/collection.mjs',
          failureType: 'RangeError Contract & Integer Division',
          suggestedFix: 'Insert guard condition if (size <= 0) and use slice iteration',
          confidence: 0.98,
        },
      ],
      isHumanApproved: true,
      createdAt: '2026-10-24T18:05:00Z',
      updatedAt: '2026-10-24T18:15:00Z',
    },
    {
      id: 'task_jwtguard_02',
      projectId: 'proj_jwtguard',
      title: 'Enforce Clock Skew Validation & Expired Token Rejection',
      description: 'Audit JWT expiration claims to prevent replay attacks during clock skew window; enforce max 60s tolerance.',
      language: 'TypeScript',
      framework: 'Express',
      mode: 'supervised',
      status: 'awaiting_approval',
      currentStage: 'Stage 4: Human Policy Gate & Diagnosis',
      maxRepairAttempts: 2,
      repairAttemptsUsed: 0,
      timeoutSeconds: 25,
      acceptanceCriteria: [
        { id: 'c1', description: 'Reject expired tokens outside 60s skew allowance', verified: false },
        { id: 'c2', description: 'Log security audit event for signature mismatch', verified: false },
      ],
      allowedCommands: ['npm test', 'npm run lint'],
      sessionId: 'sess_jwt_stage',
      planSteps: [],
      patches: [],
      executionRuns: [
        {
          command: 'npm test',
          exitCode: 1,
          stdout: 'FAIL tests/jwt.test.ts: Token replay skew test exceeded threshold',
          stderr: '',
          durationMs: 440,
          executedAt: '2026-10-25T00:20:00Z',
          telemetry: { userCpuMicros: 58000, sysCpuMicros: 16000, memoryRssMb: 45.2 },
        },
      ],
      diagnostics: [
        {
          targetFile: 'src/jwt.ts',
          failureType: 'Replay Window Vulnerability',
          suggestedFix: 'Add Math.abs(currentTimestamp - exp) <= 60 validation',
          confidence: 0.94,
        },
      ],
      isHumanApproved: false,
      createdAt: '2026-10-25T00:15:00Z',
      updatedAt: '2026-10-25T00:22:00Z',
    },
    {
      id: 'task_matrixmath_03',
      projectId: 'proj_matrixmath',
      title: 'Vector Dimension Bounds Guard for Matrix Multiply',
      description: 'Add matrix dimension mismatch assertions throwing DimensionMismatchError when cols(A) !== rows(B).',
      language: 'TypeScript',
      framework: 'Native',
      mode: 'autonomous',
      status: 'completed',
      currentStage: 'Stage 7: Cryptographic Evidence Attestation',
      maxRepairAttempts: 2,
      repairAttemptsUsed: 1,
      timeoutSeconds: 25,
      acceptanceCriteria: [
        { id: 'c1', description: 'Validate inner dimension agreement before compute loop', verified: true },
        { id: 'c2', description: 'Maintain zero allocation overhead for valid dimensions', verified: true },
      ],
      allowedCommands: ['node --test tests/matrix.test.mjs'],
      sessionId: 'sess_matrix_bench',
      planSteps: [],
      patches: [
        {
          id: 'patch_matrix_01',
          fileModified: 'src/matrix.mjs',
          explanation: 'Assert inner dimensions match before float64 typed array multiplication',
          patchDiff: '@@ -5,2 +5,4 @@\n+ if (a.cols !== b.rows) throw new Error("DimensionMismatchError");',
          appliedAt: '2026-10-23T11:05:00Z',
          verifiedByTest: true,
        },
      ],
      executionRuns: [
        {
          command: 'node --test tests/matrix.test.mjs',
          exitCode: 0,
          stdout: '# pass 8\n# fail 0\n# ok',
          stderr: '',
          durationMs: 180,
          executedAt: '2026-10-23T11:06:00Z',
          telemetry: { userCpuMicros: 28000, sysCpuMicros: 8000, memoryRssMb: 32.8 },
        },
      ],
      diagnostics: [],
      isHumanApproved: true,
      createdAt: '2026-10-23T11:00:00Z',
      updatedAt: '2026-10-23T11:08:00Z',
    },
    {
      id: 'task_datakit_04',
      projectId: 'proj_datakit',
      title: 'Detect Circular Object References in deepClone()',
      description: 'Handle self-referencing property graphs without throwing Maximum call stack size exceeded RangeError.',
      language: 'TypeScript',
      framework: 'Node.js',
      mode: 'supervised',
      status: 'in_progress',
      currentStage: 'Stage 3: Baseline Sandboxed Verification',
      maxRepairAttempts: 2,
      repairAttemptsUsed: 0,
      timeoutSeconds: 25,
      acceptanceCriteria: [
        { id: 'c1', description: 'Use WeakMap to track visited object references', verified: false },
        { id: 'c2', description: 'Clone nested primitives and arrays identically', verified: false },
      ],
      allowedCommands: ['node --test tests/collection.test.mjs'],
      sessionId: 'sess_datakit_clone',
      planSteps: [],
      patches: [],
      executionRuns: [],
      diagnostics: [],
      isHumanApproved: false,
      createdAt: '2026-10-25T01:00:00Z',
      updatedAt: '2026-10-25T01:05:00Z',
    },
  ],
  auditEvents: [
    {
      id: 'ev_01',
      taskId: 'task_datakit_01',
      timestamp: '2026-10-24T18:05:00Z',
      type: 'task.created',
      message: 'Autonomous task intake registered for data-kit-ts',
      severity: 'info',
    },
    {
      id: 'ev_02',
      taskId: 'task_datakit_01',
      timestamp: '2026-10-24T18:10:00Z',
      type: 'test.failed',
      message: 'Baseline execution failed: chunk() threw unexpected error on 0 size',
      severity: 'warning',
    },
    {
      id: 'ev_03',
      taskId: 'task_datakit_01',
      timestamp: '2026-10-24T18:12:00Z',
      type: 'repair.applied',
      message: 'Self-repair patch successfully staged into src/collection.mjs',
      severity: 'info',
    },
    {
      id: 'ev_04',
      taskId: 'task_datakit_01',
      timestamp: '2026-10-24T18:14:00Z',
      type: 'test.passed',
      message: 'All 6 regression test suites passed with exit code 0',
      severity: 'info',
    },
  ],
};

let cachedDb: DatabaseSchema | null = null;

export async function initDatabase(): Promise<DatabaseSchema> {
  if (!fsSync.existsSync(DATA_DIR)) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  if (!fsSync.existsSync(DB_FILE)) {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
    cachedDb = { ...DEFAULT_DB };
    return cachedDb;
  }

  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    cachedDb = JSON.parse(raw);
    return cachedDb!;
  } catch (err) {
    console.error('[Database] Failed to read db file, reinitializing default:', err);
    cachedDb = { ...DEFAULT_DB };
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
    return cachedDb;
  }
}

async function persistDb(): Promise<void> {
  if (!cachedDb) return;
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  await fs.writeFile(tempFile, JSON.stringify(cachedDb, null, 2), 'utf8');
  await fs.rename(tempFile, DB_FILE);
}

// -------------------------------------------------------------
// Database Access Operations
// -------------------------------------------------------------

export async function getProjects(): Promise<ProjectRecord[]> {
  const db = cachedDb || (await initDatabase());
  return db.projects;
}

export async function createProject(data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectRecord> {
  const db = cachedDb || (await initDatabase());
  const now = new Date().toISOString();
  const project: ProjectRecord = {
    ...data,
    id: `proj_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    createdAt: now,
    updatedAt: now,
  };
  db.projects.push(project);
  await persistDb();
  await logAuditEvent('project.created', `Project "${project.name}" registered`, 'info', { projectId: project.id });
  return project;
}

export async function getTasks(projectId?: string): Promise<TaskRecord[]> {
  const db = cachedDb || (await initDatabase());
  if (projectId) {
    return db.tasks.filter((t) => t.projectId === projectId);
  }
  return db.tasks;
}

export async function getTaskById(taskId: string): Promise<TaskRecord | undefined> {
  const db = cachedDb || (await initDatabase());
  return db.tasks.find((t) => t.id === taskId);
}

export async function saveTask(task: TaskRecord): Promise<void> {
  const db = cachedDb || (await initDatabase());
  const idx = db.tasks.findIndex((t) => t.id === task.id);
  task.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    db.tasks[idx] = task;
  } else {
    db.tasks.unshift(task);
  }
  await persistDb();
}

export async function logAuditEvent(
  type: string,
  message: string,
  severity: AuditEvent['severity'] = 'info',
  metadata?: Record<string, any>,
  taskId?: string
): Promise<AuditEvent> {
  const db = cachedDb || (await initDatabase());
  const event: AuditEvent = {
    id: `ev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    taskId,
    timestamp: new Date().toISOString(),
    type,
    message,
    severity,
    metadata,
  };
  db.auditEvents.unshift(event);
  if (db.auditEvents.length > 500) {
    db.auditEvents = db.auditEvents.slice(0, 500);
  }
  await persistDb();
  return event;
}

export async function getAuditEvents(taskId?: string, limit: number = 50): Promise<AuditEvent[]> {
  const db = cachedDb || (await initDatabase());
  if (taskId) {
    return db.auditEvents.filter((e) => e.taskId === taskId).slice(0, limit);
  }
  return db.auditEvents.slice(0, limit);
}

export async function getDashboardMetrics(): Promise<{
  tasksCompleted: number;
  tasksInProgress: number;
  testsPassed: number;
  failedTestRuns: number;
  successfulRepairRate: number;
  filesModified: number;
  totalDurationMs: number;
}> {
  const db = cachedDb || (await initDatabase());
  const tasksCompleted = db.tasks.filter((t) => t.status === 'completed').length;
  const tasksInProgress = db.tasks.filter((t) => ['planning', 'executing', 'testing', 'repairing', 'awaiting_approval'].includes(t.status)).length;
  
  let testsPassed = 0;
  let failedTestRuns = 0;
  let totalDurationMs = 0;
  const modifiedFileSet = new Set<string>();

  for (const t of db.tasks) {
    for (const run of t.executionRuns || []) {
      totalDurationMs += run.durationMs || 0;
      if (run.exitCode === 0) {
        testsPassed++;
      } else {
        failedTestRuns++;
      }
    }
    for (const patch of t.patches || []) {
      modifiedFileSet.add(patch.fileModified);
    }
  }

  const repairedTasks = db.tasks.filter((t) => t.repairAttemptsUsed > 0 && t.status === 'completed').length;
  const totalTasksWithRepairs = db.tasks.filter((t) => t.repairAttemptsUsed > 0).length;
  const successfulRepairRate = totalTasksWithRepairs > 0 ? Math.round((repairedTasks / totalTasksWithRepairs) * 100) : 100;

  return {
    tasksCompleted,
    tasksInProgress,
    testsPassed,
    failedTestRuns,
    successfulRepairRate,
    filesModified: modifiedFileSet.size,
    totalDurationMs,
  };
}
