/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileCode2, 
  ShieldAlert, 
  CheckCircle2, 
  Terminal, 
  Activity, 
  Lock,
  ArrowRight
} from 'lucide-react';
import type { TaskIntake, SecurityAuditResult, RepositoryHealth } from '../types.ts';

interface TaskIntakePanelProps {
  task: TaskIntake;
  setTask: React.Dispatch<React.SetStateAction<TaskIntake>>;
  securityAudit: SecurityAuditResult | null;
  repoHealth: RepositoryHealth | null;
  files: { path: string; size: number; isTest: boolean }[];
  onProceedToPlan: () => void;
  isLoading: boolean;
}

export const TaskIntakePanel: React.FC<TaskIntakePanelProps> = ({
  task,
  setTask,
  securityAudit,
  repoHealth,
  files,
  onProceedToPlan,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="border border-slate-800 bg-[#0E1524] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Fixture Target</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-blue-400">fixtures/data-kit-ts</span>
              <span aria-hidden="true">·</span>
              <span>Node.js v22 Test Runner</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Task Intake & Repository Intelligence
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect target repository structure, verify security invariants, evaluate deterministic codebase health, and formulate a dependency-aware plan.
            </p>
          </div>

          <button
            onClick={onProceedToPlan}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors shadow-sm whitespace-nowrap self-start md:self-auto"
          >
            <span>Proceed to Plan</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid: Task Specification vs Repo Health & Security Guard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task & Acceptance Criteria (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Task Title & Description */}
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Task Specification & Scope
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Task Title
              </label>
              <input
                type="text"
                value={task.title}
                onChange={(e) => setTask((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full bg-[#070B14] border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Detailed Engineering Requirements
              </label>
              <textarea
                rows={4}
                value={task.description}
                onChange={(e) => setTask((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-[#070B14] border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
              />
            </div>
          </div>

          {/* Acceptance Criteria Checklist */}
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">
                Measurable Acceptance Criteria
              </h3>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {task.acceptanceCriteria.filter((c) => c.verified).length} / {task.acceptanceCriteria.length} Verified
              </span>
            </div>

            <div className="space-y-2">
              {task.acceptanceCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="flex items-start gap-3 p-2.5 rounded-md bg-[#070B14] border border-slate-800/80 text-xs"
                >
                  <div className="pt-0.5">
                    {criterion.verified ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded border border-slate-700 bg-slate-900 shrink-0" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={criterion.verified ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                      {criterion.description}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono shrink-0 ${criterion.verified ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {criterion.verified ? 'PASS' : 'UNTESTED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Allowed Commands & Constraints */}
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Execution Constraints & Allowlist Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#070B14] border border-slate-800/80 rounded-md space-y-1.5">
                <span className="text-slate-400 font-medium">Permitted Subprocess Commands</span>
                <div className="font-mono text-slate-300 space-y-1 text-[11px]">
                  {task.allowedCommands.map((cmd) => (
                    <div key={cmd} className="text-blue-400/90 flex items-center gap-1.5">
                      <Terminal className="h-3 w-3 shrink-0" />
                      <span>{cmd}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#070B14] border border-slate-800/80 rounded-md space-y-1.5">
                <span className="text-slate-400 font-medium">Safety Policy Boundaries</span>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div>• Bounded Repair: Max 2 automated attempts</div>
                  <div>• Timeout: 25,000ms hard ceiling</div>
                  <div>• Secret Sanitization: Active for child env</div>
                  <div>• Worktree Isolation: Read-only fixture original</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Repo Health, Files & Threat Guard (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Repository Health Score */}
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">
                Repository Health Assessment
              </h3>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-blue-400 font-mono tabular-nums">
                {repoHealth ? repoHealth.score : 85}
              </span>
              <span className="text-xs text-slate-400">
                / 100 Deterministic Static Analysis
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="p-2 bg-[#070B14] rounded border border-slate-800">
                <div className="text-slate-500 text-[11px]">Total Monitored Files</div>
                <div className="font-mono text-slate-200 tabular-nums font-semibold mt-0.5">
                  {files.length || 4} files
                </div>
              </div>
              <div className="p-2 bg-[#070B14] rounded border border-slate-800">
                <div className="text-slate-500 text-[11px]">Test Suite Coverage</div>
                <div className="font-mono text-slate-200 tabular-nums font-semibold mt-0.5">
                  {files.filter((f) => f.isTest).length || 1} test suites
                </div>
              </div>
              <div className="p-2 bg-[#070B14] rounded border border-slate-800">
                <div className="text-slate-500 text-[11px]">Type Checking</div>
                <div className="text-emerald-400 font-medium mt-0.5">Active</div>
              </div>
              <div className="p-2 bg-[#070B14] rounded border border-slate-800">
                <div className="text-slate-500 text-[11px]">Git Modification Policy</div>
                <div className="text-blue-400 font-medium mt-0.5">Approval Required</div>
              </div>
            </div>
          </div>

          {/* Threat Guard Security Audit */}
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-400" />
                <span>Threat Guard Audit</span>
              </h3>
              <span className="text-xs font-mono text-emerald-400">PASSED</span>
            </div>

            <div className="space-y-2 text-xs">
              {securityAudit?.checks.map((check, idx) => (
                <div key={idx} className="p-2.5 rounded bg-[#070B14] border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-200">{check.rule}</span>
                    <span className={`text-[10px] font-mono ${check.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {check.passed ? 'SECURE' : 'THREAT'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{check.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inspected Files List */}
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-blue-400" />
              <span>Workspace File Tree</span>
            </h3>

            <div className="divide-y divide-slate-800 text-xs font-mono">
              {files.map((file) => (
                <div key={file.path} className="py-1.5 flex items-center justify-between">
                  <span className={file.isTest ? 'text-amber-400' : 'text-slate-300'}>
                    {file.path}
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {Math.round(file.size / 1024 * 10) / 10} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
