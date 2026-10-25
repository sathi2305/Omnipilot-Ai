/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  GitBranch, 
  Code2, 
  CheckCircle2, 
  Wrench, 
  ShieldAlert, 
  FileText, 
  Scale, 
  Cpu
} from 'lucide-react';
import type { TaskIntake, SubprocessExecutionResult, PatchRecord, DiagnosticTriage } from '../types.ts';

interface MultiAgentStudioProps {
  task: TaskIntake;
  currentStage: number;
  isRunning: boolean;
  isHumanApproved: boolean;
  patches: PatchRecord[];
  lastExecution: SubprocessExecutionResult | null;
  diagnostics: DiagnosticTriage[];
  onTriggerAction?: (actionName: string) => void;
}

export const MultiAgentStudio: React.FC<MultiAgentStudioProps> = ({
  task,
  currentStage,
  isRunning,
  isHumanApproved,
  patches,
  lastExecution,
  diagnostics,
}) => {
  const latestDiagnostic = diagnostics[diagnostics.length - 1];
  const isTestsPassing = lastExecution?.exitCode === 0;

  const AGENTS = [
    {
      id: 'architect',
      name: 'Architect AI',
      role: 'System Invariants & Specifications',
      icon: <Building2 className="h-4 w-4 text-cyan-400" />,
      status: currentStage >= 1 ? 'completed' : 'standby',
      activeInStage: 1,
      currentTask: 'Verifying repository language targets and package structure',
      recentOutput: 'Target identified: TypeScript utility package with native node:test harness.',
      tag: 'ARCH-01',
    },
    {
      id: 'planner',
      name: 'Planner AI',
      role: 'DAG Task Graph & Risk Assessment',
      icon: <GitBranch className="h-4 w-4 text-violet-400" />,
      status: currentStage >= 1 ? 'completed' : 'standby',
      activeInStage: 1,
      currentTask: 'Decomposing task into ordered dependency-aware stages',
      recentOutput: 'Generated 5-stage plan. Tagged Stage 4 with Human Approval Gate.',
      tag: 'PLAN-02',
    },
    {
      id: 'qa',
      name: 'QA AI',
      role: 'Sandboxed Subprocess Test Execution',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      status: currentStage >= 2 ? (isTestsPassing ? 'completed' : 'active') : 'standby',
      activeInStage: 2,
      currentTask: 'Executing allowlisted test command in POSIX sandbox',
      recentOutput: lastExecution 
        ? `Execution Exit Code: ${lastExecution.exitCode} (${lastExecution.durationMs}ms)`
        : 'Awaiting test trigger in child_process sandbox.',
      tag: 'QA-03',
    },
    {
      id: 'debugger',
      name: 'Debugger AI',
      role: 'Root Cause & Failure Triage',
      icon: <Wrench className="h-4 w-4 text-amber-400" />,
      status: currentStage >= 3 ? (diagnostics.length > 0 ? 'completed' : 'active') : 'standby',
      activeInStage: 3,
      currentTask: 'Analyzing assertion failure diffs and error stack traces',
      recentOutput: latestDiagnostic 
        ? `Isolated root cause: ${latestDiagnostic.failingTestName}`
        : 'Standby for failure triage.',
      tag: 'DEBUG-04',
    },
    {
      id: 'developer',
      name: 'Developer AI',
      role: 'Surgical Patch Synthesis & AST Edits',
      icon: <Code2 className="h-4 w-4 text-cyan-400" />,
      status: currentStage >= 4 ? (patches.length > 0 ? 'completed' : 'active') : 'standby',
      activeInStage: 4,
      currentTask: 'Synthesizing bounded fix adhering to project conventions',
      recentOutput: patches.length > 0
        ? `Generated reviewable unified patch for ${patches[0].fileModified} (+${patches[0].linesAdded}/-${patches[0].linesRemoved})`
        : 'Standby for repair authorization.',
      tag: 'DEV-05',
    },
    {
      id: 'security',
      name: 'Security AI',
      role: 'Threat Invariants & Policy Boundaries',
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
      status: 'active',
      activeInStage: 0,
      currentTask: 'Enforcing secret sanitization, allowlists, and timeout ceilings',
      recentOutput: 'Clean environment. Stripped sensitive tokens. Allowlist active.',
      tag: 'SEC-06',
    },
    {
      id: 'documentation',
      name: 'Documentation AI',
      role: 'PR Summaries & Technical Audits',
      icon: <FileText className="h-4 w-4 text-blue-400" />,
      status: currentStage >= 6 ? 'completed' : 'standby',
      activeInStage: 6,
      currentTask: 'Formatting Markdown PR reports and test logs',
      recentOutput: 'Prepared reproducible Markdown audit report and run metadata.',
      tag: 'DOC-07',
    },
    {
      id: 'reviewer',
      name: 'Reviewer AI',
      role: 'Acceptance Verification & Attestation',
      icon: <Scale className="h-4 w-4 text-teal-400" />,
      status: currentStage >= 6 ? 'completed' : 'standby',
      activeInStage: 6,
      currentTask: 'Verifying acceptance criteria against actual test execution',
      recentOutput: currentStage >= 6 
        ? 'All acceptance criteria verified pass. Issued SHA-256 manifest hash.'
        : 'Standby for final verification suite completion.',
      tag: 'REV-08',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="border border-[#1A263D] bg-[#0A0E1A] rounded-2xl p-6 bg-neural-grid">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
              <Cpu className="h-3.5 w-3.5" />
              <span>Multi-Agent Collaborative Orchestration</span>
              <span className="text-[#64748B]">·</span>
              <span className="text-[#95A2B8]">8 Autonomous Roles</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F3F6FC] tracking-tight">
              Multi-Agent Collaboration Studio
            </h1>
            <p className="text-xs text-[#95A2B8] mt-1 max-w-2xl leading-relaxed">
              Specialized logical agent roles collaborate autonomously to plan, inspect, test, debug, and attest software changes.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[#95A2B8] bg-[#0E1524] px-3.5 py-2 rounded-xl border border-[#1E2C45] shrink-0">
            <span>Stage {currentStage} Active</span>
            <span className="text-[#64748B]">·</span>
            <span className="text-cyan-400 font-semibold">{isRunning ? 'Running' : 'Ready'}</span>
          </div>
        </div>
      </div>

      {/* Grid of Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENTS.map((agent) => {
          const isActive = agent.activeInStage === currentStage || (agent.activeInStage === 0 && isRunning);
          const isDone = agent.status === 'completed';

          return (
            <div
              key={agent.id}
              className={`rounded-xl p-4 flex flex-col justify-between transition-all border ${
                isActive
                  ? 'border-cyan-400/80 bg-[#0E172A] shadow-lg shadow-cyan-950/40'
                  : isDone
                  ? 'border-emerald-800/40 bg-[#0A131F]'
                  : 'border-[#162032] bg-[#0A0E1A]'
              }`}
            >
              <div className="space-y-3">
                {/* Agent Header - Clean unboxed text */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#070B12] border border-[#1E293B]">
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#F3F6FC] tracking-tight">
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#64748B]">
                        <span>{agent.tag}</span>
                        <span aria-hidden="true">·</span>
                        <span className={isActive ? 'text-cyan-400' : isDone ? 'text-emerald-400' : 'text-[#64748B]'}>
                          {isActive ? 'Active' : isDone ? 'Verified' : 'Standby'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-[#95A2B8]">
                  {agent.role}
                </div>

                <div className="space-y-2 pt-2 border-t border-[#162032] text-[11px]">
                  <div>
                    <span className="text-[#64748B] block text-[10px] font-mono">Assigned Responsibility:</span>
                    <span className="text-[#F3F6FC] line-clamp-2 mt-0.5">{agent.currentTask}</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-[#64748B] block text-[10px] font-mono">Verifiable Finding:</span>
                    <p className="text-cyan-300 font-mono text-[10px] bg-[#070B12] p-2 rounded-md border border-[#1A263D] line-clamp-2 mt-0.5">
                      {agent.recentOutput}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#162032] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                <span>Deterministic AST</span>
                <span className={isActive ? 'text-cyan-400 font-semibold' : 'text-[#64748B]'}>
                  {isActive ? 'Processing' : 'Idle'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
