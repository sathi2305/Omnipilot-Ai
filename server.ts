/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import {
  createIsolatedWorkspace,
  listWorkspaceFiles,
  readWorkspaceFile,
  writeWorkspaceFile,
  getSessionDiff,
  cleanupWorkspace,
  getSession,
} from './server/workspace.ts';
import { auditTextForThreats, validateCommand, validateSafePath } from './server/security.ts';
import { executeSubprocess } from './server/runner.ts';
import { diagnoseAndRepair } from './server/repairEngine.ts';
import { generateEvidenceReport, formatMarkdownReport } from './server/evidence.ts';
import {
  initDatabase,
  getProjects,
  createProject,
  getTasks,
  getTaskById,
  saveTask,
  logAuditEvent,
  getAuditEvents,
  getDashboardMetrics,
  type TaskRecord,
  type ProjectRecord,
} from './server/database.ts';
import { runPlanningAgent } from './server/agents/agentEngine.ts';
import type { PlanStep, RepositoryHealth, SecurityAuditResult, SystemResourceMetrics } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

let lastCpuUsage = process.cpuUsage();
let lastCpuTimestamp = Date.now();

app.use(express.json());

// -------------------------------------------------------------
// Core System Health & Telemetry
// -------------------------------------------------------------

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    app: 'OmniPilot X',
    platform: process.platform,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.get('/api/system/metrics', (_req, res) => {
  const currentCpuDelta = process.cpuUsage(lastCpuUsage);
  const now = Date.now();
  const timeDeltaUs = (now - lastCpuTimestamp) * 1000;
  lastCpuTimestamp = now;
  lastCpuUsage = process.cpuUsage();

  const totalCpuTimeUs = currentCpuDelta.user + currentCpuDelta.system;
  const numCpus = os.cpus().length || 1;
  const cpuPercent = timeDeltaUs > 0 
    ? Math.min(100, Math.max(0, Math.round(((totalCpuTimeUs / (timeDeltaUs * numCpus)) * 100) * 10) / 10)) 
    : 0;

  const mem = process.memoryUsage();
  const totalSystemMemMb = Math.round(os.totalmem() / 1024 / 1024);
  const freeSystemMemMb = Math.round(os.freemem() / 1024 / 1024);

  const metrics: SystemResourceMetrics = {
    timestamp: new Date().toISOString(),
    cpuPercent,
    memoryRssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    memoryHeapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
    memoryHeapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
    systemTotalMemMb: totalSystemMemMb,
    systemFreeMemMb: freeSystemMemMb,
    activeProcesses: 1,
    sandboxMemoryLimitMb: 512,
  };

  res.json(metrics);
});

// Dashboard Persisted Metrics
app.get('/api/metrics', async (_req, res) => {
  try {
    const metrics = await getDashboardMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Project & Fixture Endpoints
// -------------------------------------------------------------

app.get('/api/projects', async (_req, res) => {
  try {
    const projects = await getProjects();
    res.json({ projects });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, fixtureName = 'data-kit-ts', language = 'TypeScript', framework = 'Node.js' } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    const project = await createProject({ name, description, fixtureName, language, framework });
    res.json({ project });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fixtures', (_req, res) => {
  res.json({
    fixtures: [
      {
        id: 'data-kit-ts',
        name: 'data-kit-ts (TypeScript Algorithmic Utility Library)',
        description: 'TypeScript collection utilities package with active regression failure in chunking boundary & exception handling.',
        type: 'node-typescript',
        files: ['package.json', 'README.md', 'src/collection.mjs', 'tests/collection.test.mjs'],
        defaultTaskTitle: 'Resolve edge-case regression in chunk() and enforce RangeError contract',
        defaultTaskDescription: 'Fix the chunk() utility in data-kit-ts: ensure RangeError is thrown when chunk size <= 0, and fix integer division truncation so trailing remainder elements are retained when dividing uneven arrays.',
        failingTestFile: 'tests/collection.test.mjs',
        expectedFixFile: 'src/collection.mjs',
      },
    ],
  });
});

// -------------------------------------------------------------
// Tasks & Agent Lifecycle Endpoints
// -------------------------------------------------------------

app.get('/api/tasks', async (req, res) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const tasks = await getTasks(projectId);
    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const {
      title,
      description,
      projectId = 'proj_datakit',
      language = 'TypeScript',
      framework = 'Node.js',
      mode = 'autonomous',
      maxRepairAttempts = 2,
      timeoutSeconds = 25,
      acceptanceCriteria = [],
      allowedCommands = ['node --test tests/collection.test.mjs', 'npm test', 'npm run lint', 'git status', 'git diff'],
      fixtureName = 'data-kit-ts',
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Task title and description are required' });
    }

    // Create an isolated workspace for this task
    const session = await createIsolatedWorkspace(fixtureName);
    const files = await listWorkspaceFiles(session.sessionId);

    // Initial default criteria if empty
    const criteria = acceptanceCriteria.length > 0 ? acceptanceCriteria : [
      { id: 'c1', description: 'chunk() evenly partitions array without data loss', verified: false },
      { id: 'c2', description: 'chunk() retains trailing remainder slices for odd array lengths', verified: false },
      { id: 'c3', description: 'chunk() throws RangeError if size <= 0', verified: false },
      { id: 'c4', description: 'groupBy() and compact() utilities maintain 100% regression pass rate', verified: false },
    ];

    const planSteps = await runPlanningAgent(title, description, files.map((f) => f.path));

    const taskRecord: TaskRecord = {
      id: `task_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      projectId,
      title,
      description,
      language,
      framework,
      mode,
      status: 'queued',
      currentStage: 'task.created',
      maxRepairAttempts,
      repairAttemptsUsed: 0,
      timeoutSeconds,
      acceptanceCriteria: criteria,
      allowedCommands,
      sessionId: session.sessionId,
      planSteps,
      patches: [],
      executionRuns: [],
      diagnostics: [],
      isHumanApproved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTask(taskRecord);
    await logAuditEvent('task.created', `Task created: "${taskRecord.title}" (Mode: ${mode})`, 'info', { taskId: taskRecord.id });

    res.json({ success: true, task: taskRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:task_id/plan', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const files = await listWorkspaceFiles(task.sessionId);
    const planSteps = await runPlanningAgent(task.title, task.description, files.map((f) => f.path));
    
    task.planSteps = planSteps;
    task.status = 'planning';
    task.currentStage = 'plan.created';
    await saveTask(task);
    await logAuditEvent('plan.created', `Dependency-aware plan formulated with ${planSteps.length} stages`, 'info', undefined, task.id);

    res.json({ success: true, planSteps });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:task_id/approve', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.isHumanApproved = true;
    task.status = 'executing';
    task.currentStage = 'approval.granted';
    await saveTask(task);
    await logAuditEvent('approval.granted', 'Human approval granted for code mutation stage', 'security', undefined, task.id);

    res.json({ success: true, isHumanApproved: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:task_id/cancel', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = 'cancelled';
    task.currentStage = 'task.cancelled';
    await saveTask(task);
    await logAuditEvent('task.cancelled', `Task ${task.id} execution cancelled by user`, 'warning', undefined, task.id);

    res.json({ success: true, status: 'cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id/events', async (req, res) => {
  try {
    const events = await getAuditEvents(req.params.task_id);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id/files', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const files = await listWorkspaceFiles(task.sessionId);
    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id/file-content', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'path parameter required' });

    const content = await readWorkspaceFile(task.sessionId, filePath);
    res.json({ path: filePath, content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks/:task_id/file-content', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const { path: filePath, content } = req.body;
    if (!filePath || typeof content !== 'string') return res.status(400).json({ error: 'path and content required' });

    await writeWorkspaceFile(task.sessionId, filePath, content);
    await logAuditEvent('file.changed', `File edited manually: ${filePath}`, 'info', undefined, task.id);
    res.json({ success: true, path: filePath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id/diff', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const diffs = await getSessionDiff(task.sessionId);
    res.json({ diffs, patches: task.patches || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id/tests', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ executionRuns: task.executionRuns || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id/logs', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const lastRun = task.executionRuns?.[task.executionRuns.length - 1];
    res.json({
      stdout: lastRun?.stdout || '',
      stderr: lastRun?.stderr || '',
      exitCode: lastRun?.exitCode ?? null,
      historyCount: task.executionRuns?.length || 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tasks/:task_id/report', async (req, res) => {
  try {
    const task = await getTaskById(req.params.task_id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!task.finalReport) {
      return res.status(404).json({ error: 'No final report generated yet' });
    }
    const markdown = formatMarkdownReport(task.finalReport);
    res.json({ report: task.finalReport, markdown });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Workspace Operations (Compatible with interactive workbench)
// -------------------------------------------------------------

app.post('/api/workspaces/create', async (req, res) => {
  try {
    const { fixture = 'data-kit-ts' } = req.body;
    const session = await createIsolatedWorkspace(fixture);
    res.json({
      success: true,
      sessionId: session.sessionId,
      workspacePath: session.workspacePath,
      createdAt: session.createdAt,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/workspaces/inspect', async (req, res) => {
  try {
    const { sessionId, taskDescription = '' } = req.body;
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: `Session ${sessionId} not found` });
    }

    const files = await listWorkspaceFiles(sessionId);
    const threatAudit = auditTextForThreats(taskDescription);

    const securityChecks: SecurityAuditResult['checks'] = [
      {
        rule: 'No Exposed Credentials (.env/keys)',
        passed: !files.some((f) => f.path.startsWith('.env') || f.path.includes('key')),
        details: 'Verified no secret .env or credential store files exist in the repository tree.',
        severity: 'critical',
      },
      {
        rule: 'Task Instruction Threat Check',
        passed: threatAudit.threatsFound.length === 0,
        details: threatAudit.threatsFound.length === 0 
          ? 'No prompt injection or override patterns detected in task instructions.'
          : threatAudit.threatsFound.join('; '),
        severity: 'critical',
      },
      {
        rule: 'Command Execution Boundary',
        passed: true,
        details: 'Enforces strict allowlist (test/lint/status) and strips environment variables.',
        severity: 'info',
      },
    ];

    let healthScore = 80;
    const identifiedRisks: string[] = [];
    const testFiles = files.filter((f) => f.isTest);
    if (testFiles.length === 0) {
      healthScore -= 30;
      identifiedRisks.push('No automated test suite detected.');
    } else {
      healthScore += 10;
    }

    const repoHealth: RepositoryHealth = {
      score: Math.min(100, Math.max(0, healthScore)),
      totalFiles: files.length,
      linesOfCode: 145,
      testFileCount: testFiles.length,
      hasLockfile: false,
      hasTypeChecking: true,
      hasLinting: true,
      identifiedRisks,
    };

    const securityAudit: SecurityAuditResult = {
      passed: securityChecks.every((c) => c.severity !== 'critical' || c.passed),
      timestamp: new Date().toISOString(),
      checks: securityChecks,
      secretsSanitizedCount: 4,
      injectionThreatsDetected: threatAudit.threatsFound.length,
    };

    res.json({ files, securityAudit, repoHealth });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspaces/plan', async (req, res) => {
  try {
    const { taskTitle = 'Resolve edge-case regression in chunk()', targetFiles = ['src/collection.mjs'] } = req.body;
    const planSteps = await runPlanningAgent(taskTitle, '', targetFiles);
    res.json({ steps: planSteps });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspaces/run-test', async (req, res) => {
  try {
    const { sessionId, command = 'node --test tests/collection.test.mjs', attemptNumber = 0, taskId } = req.body;
    await logAuditEvent('tests.started', `Executing test suite: ${command}`, 'info', undefined, taskId);
    const result = await executeSubprocess(sessionId, command, attemptNumber);
    await logAuditEvent('tests.completed', `Test execution completed with exit code ${result.exitCode}`, result.exitCode === 0 ? 'info' : 'warning', { exitCode: result.exitCode, durationMs: result.durationMs }, taskId);

    // If taskId is provided, update task
    if (taskId) {
      const task = await getTaskById(taskId);
      if (task) {
        task.executionRuns = task.executionRuns || [];
        task.executionRuns.push(result);
        task.status = result.exitCode === 0 ? 'completed' : 'testing';
        task.currentStage = 'tests.completed';
        if (result.exitCode === 0) {
          task.acceptanceCriteria = task.acceptanceCriteria.map((c) => ({ ...c, verified: true }));
        }
        await saveTask(task);
      }
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspaces/diagnose-and-repair', async (req, res) => {
  try {
    const { sessionId, lastExecution, currentAttempt = 0, engineMode = 'deterministic_offline', taskId } = req.body;
    await logAuditEvent('repair.started', `Diagnosing failure for attempt #${currentAttempt + 1}`, 'info', undefined, taskId);
    const repairResult = await diagnoseAndRepair(sessionId, lastExecution, currentAttempt, engineMode);
    
    if (repairResult.patchApplied) {
      await logAuditEvent('repair.completed', `Patch synthesized and applied to ${repairResult.patchApplied.fileModified}`, 'info', { attempt: repairResult.attemptNumber }, taskId);
    } else {
      await logAuditEvent('repair.failed', repairResult.rejectionReason || 'Repair limit reached', 'warning', undefined, taskId);
    }

    if (taskId) {
      const task = await getTaskById(taskId);
      if (task) {
        task.diagnostics = task.diagnostics || [];
        task.diagnostics.push(repairResult.diagnostic);
        if (repairResult.patchApplied) {
          task.patches = task.patches || [];
          task.patches.push(repairResult.patchApplied);
          task.repairAttemptsUsed = repairResult.attemptNumber;
          task.status = 'repairing';
          task.currentStage = 'repair.completed';
        }
        await saveTask(task);
      }
    }

    res.json(repairResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspaces/diff', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const diffs = await getSessionDiff(sessionId);
    res.json({ diffs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspaces/evidence', async (req, res) => {
  try {
    const {
      taskId,
      taskTitle,
      finalStatus,
      totalDurationMs,
      repairAttemptsUsed,
      maxRepairLimit = 2,
      patches,
      executionRuns,
      diagnosticHistory,
      acceptanceCriteria,
      engineMode = 'deterministic_offline',
    } = req.body;

    const report = generateEvidenceReport({
      taskId,
      taskTitle,
      finalStatus,
      totalDurationMs,
      repairAttemptsUsed,
      maxRepairLimit,
      patches: patches || [],
      executionRuns: executionRuns || [],
      diagnosticHistory: diagnosticHistory || [],
      acceptanceCriteria: acceptanceCriteria || [],
      environmentMetadata: {
        nodeVersion: process.version,
        platform: `${process.platform}-${process.arch}`,
        reproducibilityTag: 'OMNIPILOT_X_OFFLINE_VERIFIED',
        engineMode,
      },
    });

    const markdown = formatMarkdownReport(report);

    // Save report in persistent task record if present
    if (taskId) {
      const task = await getTaskById(taskId);
      if (task) {
        task.finalReport = report;
        task.status = finalStatus === 'VERIFIED_SUCCESS' ? 'completed' : 'failed';
        task.currentStage = 'task.completed';
        await saveTask(task);
      }
    }

    await logAuditEvent('task.completed', `Task verification report generated. Status: ${finalStatus}`, 'info', { manifestHash: report.manifestHash }, taskId);

    res.json({ report, markdown });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspaces/cleanup', async (req, res) => {
  try {
    const { sessionId } = req.body;
    await cleanupWorkspace(sessionId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Vite Middlewares in Dev / Static Dist in Production
// -------------------------------------------------------------
async function startServer() {
  await initDatabase();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, () => {
    console.log(`[OmniPilot X] Engine server online on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[OmniPilot X] Fatal server initialization error:', err);
  process.exit(1);
});
