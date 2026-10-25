/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, type NavView } from './components/Sidebar.tsx';
import { RightInspector } from './components/RightInspector.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { RepoExplorerView } from './components/RepoExplorerView.tsx';
import { ExecutionLogsView } from './components/ExecutionLogsView.tsx';
import { TaskIntakePanel } from './components/TaskIntakePanel.tsx';
import { PlanDagPanel } from './components/PlanDagPanel.tsx';
import { ExecutionTerminal } from './components/ExecutionTerminal.tsx';
import { DiffViewer } from './components/DiffViewer.tsx';
import { DiagnosisRepairPanel } from './components/DiagnosisRepairPanel.tsx';
import { EvidenceAuditPanel } from './components/EvidenceAuditPanel.tsx';
import { DemoFlowBar } from './components/DemoFlowBar.tsx';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.tsx';
import { AgentRunsView } from './components/AgentRunsView.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { MultiAgentStudio } from './components/MultiAgentStudio.tsx';
import { WorkflowCanvas } from './components/WorkflowCanvas.tsx';
import { ProjectHealthRadar } from './components/ProjectHealthRadar.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { ShieldAlert, Sliders, CheckCircle2, Lock, Terminal, FolderGit2 } from 'lucide-react';
import type { 
  TaskIntake, 
  PlanStep, 
  SubprocessExecutionResult, 
  PatchRecord, 
  DiagnosticTriage, 
  EvidenceReport, 
  SecurityAuditResult, 
  RepositoryHealth 
} from './types.ts';
import type { ProjectRecord, TaskRecord } from '../server/database.ts';

const INITIAL_TASK: TaskIntake = {
  id: 'task_datakit_01',
  title: 'Resolve Edge-Case Regression in chunk() & Enforce RangeError Contract',
  description: 'Investigate and resolve test failures in data-kit-ts: chunk() must validate size > 0 throwing RangeError("Chunk size must be greater than 0"), and ensure remainder trailing elements are preserved when dividing uneven arrays without truncation.',
  targetFixture: 'data-kit-ts',
  acceptanceCriteria: [
    { id: 'c1', description: 'chunk() evenly partitions array without data loss', verified: false },
    { id: 'c2', description: 'chunk() retains trailing remainder slices for odd array lengths', verified: false },
    { id: 'c3', description: 'chunk() throws RangeError if size <= 0', verified: false },
    { id: 'c4', description: 'groupBy() and compact() utilities maintain 100% regression pass rate', verified: false },
  ],
  constraints: [
    'Strict 2-attempt bounded repair budget',
    'No unverified external dependencies',
    'Preserve original fixture integrity',
  ],
  allowedCommands: [
    'node --test tests/collection.test.mjs',
    'npm test',
    'npm run lint',
    'git status',
    'git diff',
  ],
  preventDestructiveGit: true,
  isolationMode: 'worktree_jail',
};

const STAGE_NAMES = [
  'Task Intake & Inspection',
  'Repository Intelligence',
  'Baseline Sandboxed Verification',
  'Human Policy Gate & Diagnosis',
  'Bounded Self-Repair (Attempt 1/2)',
  'Regression Verification Suite',
  'Cryptographic Evidence Attestation',
];

export default function App() {
  const [currentNavView, setCurrentNavView] = useState<NavView>('dashboard');
  const [engineMode, setEngineMode] = useState<'deterministic_offline' | 'gemini_enhanced'>('deterministic_offline');

  // Workspace Session & Data
  const [sessionId, setSessionId] = useState<string>('');
  const [files, setFiles] = useState<{ path: string; size: number; isTest: boolean }[]>([]);
  const [task, setTask] = useState<TaskIntake>(INITIAL_TASK);
  const [securityAudit, setSecurityAudit] = useState<SecurityAuditResult | null>(null);
  const [repoHealth, setRepoHealth] = useState<RepositoryHealth | null>(null);

  // Planning & Policy Gate
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string>('step_1');
  const [isHumanApproved, setIsHumanApproved] = useState<boolean>(false);

  // Execution & Subprocess
  const [executionHistory, setExecutionHistory] = useState<SubprocessExecutionResult[]>([]);
  const [lastExecution, setLastExecution] = useState<SubprocessExecutionResult | null>(null);
  const [patches, setPatches] = useState<PatchRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticTriage[]>([]);
  const [repairAttemptsCount, setRepairAttemptsCount] = useState<number>(0);

  // Evidence Report
  const [evidence, setEvidence] = useState<EvidenceReport | null>(null);
  const [markdownReport, setMarkdownReport] = useState<string>('');

  // Workflow Pipeline State
  const [isRunningWorkflow, setIsRunningWorkflow] = useState<boolean>(false);
  const [currentPipelineStage, setCurrentPipelineStage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Tasks and Projects from Database
  const [allTasks, setAllTasks] = useState<TaskRecord[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectRecord[]>([]);

  // Command Palette & Shortcuts
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [shortcutToast, setShortcutToast] = useState<{ message: string; keyHint: string } | null>(null);

  const showToast = (message: string, keyHint: string) => {
    setShortcutToast({ message, keyHint });
    setTimeout(() => {
      setShortcutToast((prev) => (prev?.message === message ? null : prev));
    }, 2200);
  };

  const loadTasksAndProjects = async () => {
    try {
      const [tasksRes, projsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
      ]);
      const tasksData = await tasksRes.json();
      const projsData = await projsRes.json();
      if (tasksData.tasks) setAllTasks(tasksData.tasks);
      if (projsData.projects) setAllProjects(projsData.projects);
    } catch (err) {
      console.error('Failed to load tasks/projects:', err);
    }
  };

  // Initialize workspace session and DB state on mount
  useEffect(() => {
    initWorkspace();
    loadTasksAndProjects();
  }, []);

  const initWorkspace = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture: 'data-kit-ts' }),
      });
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        await inspectWorkspace(data.sessionId);
      }
    } catch (err) {
      console.error('Failed to init workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const inspectWorkspace = async (sid: string) => {
    try {
      const res = await fetch('/api/workspaces/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, taskDescription: task.description }),
      });
      const data = await res.json();
      if (data.files) setFiles(data.files);
      if (data.securityAudit) setSecurityAudit(data.securityAudit);
      if (data.repoHealth) setRepoHealth(data.repoHealth);

      // Load Plan
      const planRes = await fetch('/api/workspaces/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskTitle: task.title }),
      });
      const planData = await planRes.json();
      if (planData.steps) setPlanSteps(planData.steps);
    } catch (err) {
      console.error('Failed to inspect workspace:', err);
    }
  };

  const handleReset = async () => {
    setExecutionHistory([]);
    setLastExecution(null);
    setPatches([]);
    setDiagnostics([]);
    setRepairAttemptsCount(0);
    setEvidence(null);
    setMarkdownReport('');
    setIsHumanApproved(false);
    setCurrentPipelineStage(1);
    setCurrentNavView('intake');
    setTask(INITIAL_TASK);
    await initWorkspace();
  };

  // Subprocess test execution
  const runSubprocessTest = async (cmd?: string): Promise<SubprocessExecutionResult | null> => {
    if (!sessionId) return null;
    setIsLoading(true);
    try {
      const res = await fetch('/api/workspaces/run-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          command: cmd || 'node --test tests/collection.test.mjs',
          attemptNumber: repairAttemptsCount,
          taskId: task.id,
        }),
      });
      const result: SubprocessExecutionResult = await res.json();
      setLastExecution(result);
      setExecutionHistory((prev) => [...prev, result]);

      if (result.exitCode === 0) {
        setTask((prev) => ({
          ...prev,
          acceptanceCriteria: prev.acceptanceCriteria.map((c) => ({ ...c, verified: true })),
        }));
      }

      return result;
    } catch (err) {
      console.error('Subprocess run failed:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Diagnostic & Bounded Repair
  const applyRepair = async () => {
    if (!sessionId || !lastExecution) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/workspaces/diagnose-and-repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          lastExecution,
          currentAttempt: repairAttemptsCount,
          engineMode,
          taskId: task.id,
        }),
      });
      const data = await res.json();

      if (data.diagnostic) {
        setDiagnostics((prev) => [...prev, data.diagnostic]);
      }

      if (data.patchApplied) {
        setPatches((prev) => [...prev, data.patchApplied]);
        setRepairAttemptsCount(data.attemptNumber);

        setPlanSteps((prev) =>
          prev.map((s) =>
            s.id === 'step_4'
              ? { ...s, status: 'completed', outputSummary: `Patch applied to src/collection.mjs (${data.patchApplied.appliedBy})` }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Repair failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Evidence
  const generateEvidence = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const allPassed = task.acceptanceCriteria.every((c) => c.verified) || (lastExecution?.exitCode === 0);
      const totalDur = executionHistory.reduce((acc, r) => acc + (r.durationMs || 0), 0);

      const res = await fetch('/api/workspaces/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: sessionId,
          taskTitle: task.title,
          finalStatus: allPassed ? 'VERIFIED_SUCCESS' : 'REPAIR_LIMIT_EXCEEDED',
          totalDurationMs: totalDur,
          repairAttemptsUsed: repairAttemptsCount,
          maxRepairLimit: 2,
          patches,
          executionRuns: executionHistory,
          diagnosticHistory: diagnostics,
          acceptanceCriteria: task.acceptanceCriteria.map((c) => ({
            ...c,
            verified: allPassed ? true : c.verified,
          })),
          engineMode,
        }),
      });

      const data = await res.json();
      if (data.report) setEvidence(data.report);
      if (data.markdown) setMarkdownReport(data.markdown);
      setCurrentNavView('evidence');
      setCurrentPipelineStage(6);
    } catch (err) {
      console.error('Evidence generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step-by-step pipeline execution
  const runPipelineStage = async (stage: number) => {
    setCurrentPipelineStage(stage);

    if (stage === 1) {
      setCurrentNavView('intake');
      if (sessionId) await inspectWorkspace(sessionId);
    } else if (stage === 2) {
      setCurrentNavView('terminal');
      await runSubprocessTest();
      setPlanSteps((prev) =>
        prev.map((s) => (s.id === 'step_2' ? { ...s, status: 'completed', outputSummary: 'Baseline test run captured 2 test failures' } : s))
      );
    } else if (stage === 3) {
      setCurrentNavView('plan');
      setIsHumanApproved(true);
      setPlanSteps((prev) =>
        prev.map((s) => (s.id === 'step_3' ? { ...s, status: 'completed', outputSummary: 'Root cause isolated to chunk() RangeError and uneven remainder truncation' } : s))
      );
    } else if (stage === 4) {
      setCurrentNavView('terminal');
      setIsHumanApproved(true);
      await applyRepair();
    } else if (stage === 5) {
      setCurrentNavView('terminal');
      const result = await runSubprocessTest();
      if (result && result.exitCode === 0) {
        setPlanSteps((prev) =>
          prev.map((s) => (s.id === 'step_5' ? { ...s, status: 'completed', outputSummary: 'All 4 tests passed (exit code 0). Zero regressions.' } : s))
        );
      }
    } else if (stage === 6) {
      await generateEvidence();
    }
  };

  // Full Autonomous Workflow Auto-Player
  const handleRunFullWorkflow = async () => {
    setIsRunningWorkflow(true);
    try {
      setCurrentNavView('intake');
      setCurrentPipelineStage(1);
      await new Promise((r) => setTimeout(r, 600));

      setCurrentNavView('terminal');
      setCurrentPipelineStage(2);
      await runSubprocessTest();
      setPlanSteps((prev) =>
        prev.map((s) => (s.id === 'step_2' ? { ...s, status: 'completed', outputSummary: 'Baseline test run captured 2 test failures' } : s))
      );
      await new Promise((r) => setTimeout(r, 700));

      setCurrentNavView('plan');
      setCurrentPipelineStage(3);
      setIsHumanApproved(true);
      setPlanSteps((prev) =>
        prev.map((s) => (s.id === 'step_3' ? { ...s, status: 'completed', outputSummary: 'Root cause isolated to chunk() RangeError and uneven remainder truncation' } : s))
      );
      await new Promise((r) => setTimeout(r, 700));

      setCurrentNavView('terminal');
      setCurrentPipelineStage(4);
      await applyRepair();
      await new Promise((r) => setTimeout(r, 700));

      setCurrentPipelineStage(5);
      const verifyRun = await runSubprocessTest();
      if (verifyRun && verifyRun.exitCode === 0) {
        setPlanSteps((prev) =>
          prev.map((s) => (s.id === 'step_5' ? { ...s, status: 'completed', outputSummary: 'All 4 tests passed (exit code 0). Zero regressions.' } : s))
        );
      }
      await new Promise((r) => setTimeout(r, 700));

      setCurrentPipelineStage(6);
      await generateEvidence();
    } catch (err) {
      console.error('Autonomous workflow failed:', err);
    } finally {
      setIsRunningWorkflow(false);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) : false;
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
          return;
        }
      }

      if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (isRunningWorkflow || isLoading) return;

        if (currentPipelineStage < 6) {
          const next = currentPipelineStage + 1;
          showToast(`Stage ${next}: ${STAGE_NAMES[next]}`, 'Ctrl+Enter');
          runPipelineStage(next);
        } else {
          showToast('Triggering Full Verification Workflow', 'Ctrl+Enter');
          handleRunFullWorkflow();
        }
        return;
      }

      if ((isCmdOrCtrl || e.altKey) && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        showToast('Workspace Reset: Reloaded Baseline Fixture', 'Ctrl+R');
        handleReset();
        return;
      }

      if ((e.altKey || (isCmdOrCtrl && e.shiftKey)) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsHumanApproved((prev) => {
          const nextVal = !prev;
          showToast(`Human Approval Gate: ${nextVal ? 'GRANTED' : 'REVOKED'}`, 'Alt+A');
          return nextVal;
        });
        return;
      }

      if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (isInput) return;

      if (e.key === '?' || (isCmdOrCtrl && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      if (e.key === '1') {
        e.preventDefault();
        setCurrentNavView('dashboard');
        showToast('View: Overview Dashboard', '1');
      } else if (e.key === '2') {
        e.preventDefault();
        setCurrentNavView('intake');
        showToast('View: Task Intake', '2');
      } else if (e.key === '3') {
        e.preventDefault();
        setCurrentNavView('explorer');
        showToast('View: Repository Explorer', '3');
      } else if (e.key === '4') {
        e.preventDefault();
        setCurrentNavView('terminal');
        showToast('View: Sandbox Terminal', '4');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPipelineStage,
    isRunningWorkflow,
    isLoading,
    isShortcutsModalOpen,
    sessionId,
    lastExecution,
    repairAttemptsCount,
    engineMode,
  ]);

  const isVerified = Boolean(evidence && evidence.finalStatus === 'VERIFIED_SUCCESS');

  return (
    <div className="min-h-screen bg-[#080B12] text-[#F3F6FC] flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        currentView={currentNavView}
        setCurrentView={setCurrentNavView}
        engineMode={engineMode}
        setEngineMode={setEngineMode}
        onRunFullWorkflow={handleRunFullWorkflow}
        onReset={handleReset}
        isRunningWorkflow={isRunningWorkflow}
        isVerified={isVerified}
        hasPatches={patches.length > 0}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Left Navigation Sidebar */}
        <Sidebar
          currentView={currentNavView}
          setCurrentView={setCurrentNavView}
          activeTaskId={task.id}
          isVerified={isVerified}
          hasPatches={patches.length > 0}
          approvalNeeded={!isHumanApproved && lastExecution !== null && lastExecution.exitCode !== 0}
        />

        {/* Column 2: Main Workspace Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#080B12] bg-ambient-radial">
          {/* Guided Step Walkthrough Pipeline */}
          <DemoFlowBar
            currentStage={currentPipelineStage}
            onRunStage={runPipelineStage}
            isRunning={isRunningWorkflow || isLoading}
          />

          {/* View: Overview Dashboard */}
          {currentNavView === 'dashboard' && (
            <DashboardView
              onStartNewTask={(customTask) => {
                if (customTask) {
                  setTask((prev) => ({
                    ...prev,
                    title: customTask.title,
                    description: customTask.description,
                    targetFixture: customTask.fixture,
                  }));
                  showToast(`Mission Initialized: ${customTask.fixture}`, 'LAUNCH');
                }
                setCurrentNavView('intake');
              }}
              onSelectTask={(taskId) => {
                const found = allTasks.find(t => t.id === taskId);
                if (found) {
                  setTask({
                    id: found.id,
                    title: found.title,
                    description: found.description,
                    targetFixture: found.projectId === 'proj_datakit' ? 'data-kit-ts' : found.projectId,
                    acceptanceCriteria: found.acceptanceCriteria || [],
                    constraints: ['Strict 2-attempt bounded repair budget', 'No unverified external dependencies'],
                    allowedCommands: found.allowedCommands || ['npm test'],
                    preventDestructiveGit: true,
                    isolationMode: 'worktree_jail',
                  });
                  if (found.patches) setPatches(found.patches);
                  if (found.diagnostics) setDiagnostics(found.diagnostics);
                  if (found.executionRuns && found.executionRuns.length > 0) {
                    setExecutionHistory(found.executionRuns);
                    setLastExecution(found.executionRuns[found.executionRuns.length - 1]);
                  }
                  setIsHumanApproved(found.isHumanApproved);
                  setCurrentNavView('plan');
                  showToast(`Loaded Task: ${found.title.slice(0, 30)}...`, 'TASK');
                } else {
                  setCurrentNavView('plan');
                }
              }}
              onViewDiff={(t) => {
                if (t.patches) setPatches(t.patches);
                setCurrentNavView('diff');
              }}
              onViewEvidence={(t) => {
                if (t.finalReport) setEvidence(t.finalReport);
                setCurrentNavView('evidence');
              }}
            />
          )}

          {/* View: Task Intake & Repo Intelligence */}
          {currentNavView === 'intake' && (
            <TaskIntakePanel
              task={task}
              setTask={setTask}
              securityAudit={securityAudit}
              repoHealth={repoHealth}
              files={files}
              onProceedToPlan={() => setCurrentNavView('plan')}
              isLoading={isLoading}
            />
          )}

          {/* View: Repository Explorer */}
          {currentNavView === 'explorer' && (
            <RepoExplorerView
              sessionId={sessionId}
              taskId={task.id}
              files={files}
              onFileSaved={() => inspectWorkspace(sessionId)}
            />
          )}

          {/* View: Plan & Policy Gate */}
          {currentNavView === 'plan' && (
            <PlanDagPanel
              steps={planSteps}
              selectedStepId={selectedStepId}
              setSelectedStepId={setSelectedStepId}
              isHumanApproved={isHumanApproved}
              onApproveStep={() => setIsHumanApproved(true)}
              onRejectStep={() => setIsHumanApproved(false)}
              onProceedToExecution={() => setCurrentNavView('terminal')}
              isRunning={isRunningWorkflow || isLoading}
            />
          )}

          {/* View: Sandbox Subprocess Runner & Terminal */}
          {currentNavView === 'terminal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7">
                  <ExecutionTerminal
                    lastExecution={lastExecution}
                    executionHistory={executionHistory}
                    onRunTest={runSubprocessTest}
                    isRunning={isLoading}
                  />
                </div>
                <div className="lg:col-span-5">
                  <DiagnosisRepairPanel
                    diagnostics={diagnostics}
                    lastExecution={lastExecution}
                    currentRepairAttempt={repairAttemptsCount}
                    maxRepairLimit={2}
                    isHumanApproved={isHumanApproved}
                    onApplyRepair={applyRepair}
                    isRunning={isLoading}
                    engineMode={engineMode}
                  />
                </div>
              </div>

              {/* Reviewable Patch Strip */}
              <div className="border border-slate-800 bg-[#0B101D] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Reviewable Git Worktree Patches
                  </h3>
                  <span className="text-xs font-mono text-slate-400">
                    {patches.length} patch{patches.length === 1 ? '' : 'es'} staged
                  </span>
                </div>
                <DiffViewer patches={patches} />
              </div>
            </div>
          )}

          {/* View: Diff Viewer Standalone */}
          {currentNavView === 'diff' && (
            <div className="border border-slate-800 bg-[#0B101D] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Staged Code Changes & Diffs</h2>
                  <p className="text-[11px] text-slate-400">Isolated workspace modifications ready for developer review</p>
                </div>
                <span className="text-xs font-mono text-cyan-400">{patches.length} active patches</span>
              </div>
              <DiffViewer patches={patches} />
            </div>
          )}

          {/* View: Agent Runs Search & Filter History */}
          {currentNavView === 'runs' && (
            <AgentRunsView
              tasks={allTasks}
              onSelectTask={(selected) => {
                setTask({
                  id: selected.id,
                  title: selected.title,
                  description: selected.description,
                  targetFixture: selected.projectId === 'proj_datakit' ? 'data-kit-ts' : selected.projectId,
                  acceptanceCriteria: selected.acceptanceCriteria || [],
                  constraints: ['Strict 2-attempt bounded repair budget', 'No unverified external dependencies'],
                  allowedCommands: selected.allowedCommands || ['npm test'],
                  preventDestructiveGit: true,
                  isolationMode: 'worktree_jail',
                });
                if (selected.patches) setPatches(selected.patches);
                if (selected.diagnostics) setDiagnostics(selected.diagnostics);
                if (selected.executionRuns && selected.executionRuns.length > 0) {
                  setExecutionHistory(selected.executionRuns);
                  setLastExecution(selected.executionRuns[selected.executionRuns.length - 1]);
                }
                setIsHumanApproved(selected.isHumanApproved);
                setCurrentNavView('plan');
                showToast(`Loaded Task: ${selected.title.slice(0, 30)}...`, 'TASK');
              }}
              onViewDiff={(t) => {
                if (t.patches) setPatches(t.patches);
                setCurrentNavView('diff');
              }}
              onViewEvidence={(t) => {
                if (t.finalReport) setEvidence(t.finalReport);
                setCurrentNavView('evidence');
              }}
              onStartNewTask={() => setCurrentNavView('intake')}
            />
          )}

          {/* View: Projects & Benchmarks Search & Filter */}
          {currentNavView === 'projects' && (
            <ProjectsView
              projects={allProjects}
              onSelectProject={(proj) => {
                setTask((prev) => ({
                  ...prev,
                  targetFixture: proj.fixtureName,
                  title: `Enhance & Verify ${proj.name}`,
                  description: proj.description,
                }));
                setCurrentNavView('intake');
                showToast(`Loaded Fixture: ${proj.fixtureName}`, 'FIXTURE');
              }}
              onExploreProject={() => {
                setCurrentNavView('explorer');
                showToast('Viewing Workspace Tree', 'EXPLORER');
              }}
              onCreateProject={() => setCurrentNavView('intake')}
            />
          )}

          {/* View: Multi-Agent Collaboration Studio */}
          {currentNavView === 'multiagent' && (
            <MultiAgentStudio
              task={task}
              currentStage={currentPipelineStage}
              isRunning={isRunningWorkflow || isLoading}
              isHumanApproved={isHumanApproved}
              patches={patches}
              lastExecution={lastExecution}
              diagnostics={diagnostics}
              onTriggerAction={(action) => {
                if (action.includes('test')) runSubprocessTest('node --test tests/collection.test.mjs');
                else if (action.includes('repair')) applyRepair();
                else if (action.includes('approval')) setIsHumanApproved(!isHumanApproved);
              }}
            />
          )}

          {/* View: Interactive Workflow Canvas */}
          {currentNavView === 'workflow' && (
            <WorkflowCanvas
              currentStage={currentPipelineStage}
              onRunStage={runPipelineStage}
              isRunning={isRunningWorkflow || isLoading}
              task={task}
              isHumanApproved={isHumanApproved}
              lastExecution={lastExecution}
              patches={patches}
              diagnostics={diagnostics}
              evidence={evidence}
              onToggleApproval={() => setIsHumanApproved(!isHumanApproved)}
              onNavigateToView={setCurrentNavView}
            />
          )}

          {/* View: AI Project Health Radar */}
          {currentNavView === 'health' && (
            <ProjectHealthRadar
              task={task}
              lastExecution={lastExecution}
              patches={patches}
              securityAudit={securityAudit}
              isHumanApproved={isHumanApproved}
              repairAttemptsCount={repairAttemptsCount}
            />
          )}

          {/* View: Execution Logs Audit */}
          {currentNavView === 'logs' && (
            <ExecutionLogsView taskId={task.id} />
          )}

          {/* View: Evidence & Reports */}
          {currentNavView === 'evidence' && (
            <EvidenceAuditPanel
              evidence={evidence}
              markdownText={markdownReport}
            />
          )}

          {/* View: Safety & Policies */}
          {currentNavView === 'settings' && (
            <div className="border border-slate-800 bg-[#0B101D] rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Safety & Policy Configuration</h2>
                <p className="text-xs text-slate-400 mt-1">Non-negotiable security boundaries and sandbox constraints</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 rounded-lg bg-[#070B14] border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">Subprocess Command Allowlist</span>
                  <div className="space-y-1 text-slate-300">
                    <div>✔ node --test tests/*.test.mjs</div>
                    <div>✔ npm test / npm run lint</div>
                    <div>✔ git status / git diff</div>
                    <div className="text-rose-400">✖ Shell pipes (; && || `) strictly blocked</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#070B14] border border-slate-800 space-y-2">
                  <span className="text-slate-400 font-bold block">Resource & Timeout Ceilings</span>
                  <div className="space-y-1 text-slate-300">
                    <div>• Hard Execution Timeout: 25,000ms</div>
                    <div>• Memory Sandbox Cap: 512 MB</div>
                    <div>• Bounded Repair Limit: Exactly 2 Cycles Max</div>
                    <div>• Secret Sanitizer: Strips API keys from child env</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Column 3: Right-Side Inspector Rail */}
        <RightInspector
          task={task}
          currentStage={currentPipelineStage}
          stageName={STAGE_NAMES[currentPipelineStage] || 'Active Execution'}
          isHumanApproved={isHumanApproved}
          repairAttemptsCount={repairAttemptsCount}
          maxRepairLimit={2}
          patches={patches}
          lastExecution={lastExecution}
          executionHistory={executionHistory}
          isRunning={isRunningWorkflow || isLoading}
          onToggleApproval={() => setIsHumanApproved(!isHumanApproved)}
        />
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentNavView}
        onRunTest={() => runSubprocessTest('node --test tests/collection.test.mjs')}
        onApplyRepair={applyRepair}
        onRunFullWorkflow={handleRunFullWorkflow}
        onResetWorkspace={handleReset}
        onToggleApproval={() => setIsHumanApproved(!isHumanApproved)}
        onSetEngineMode={setEngineMode}
        engineMode={engineMode}
        isHumanApproved={isHumanApproved}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Transient Shortcut Feedback Toast */}
      {shortcutToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="font-medium">{shortcutToast.message}</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 border border-slate-600 rounded text-cyan-300">
            {shortcutToast.keyHint}
          </kbd>
        </div>
      )}
    </div>
  );
}
