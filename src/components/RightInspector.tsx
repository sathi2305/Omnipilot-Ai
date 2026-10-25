/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Layers,
  Lock
} from 'lucide-react';
import type { TaskIntake, SubprocessExecutionResult, PatchRecord } from '../types.ts';

interface RightInspectorProps {
  task: TaskIntake;
  currentStage: number;
  stageName: string;
  isHumanApproved: boolean;
  repairAttemptsCount: number;
  maxRepairLimit: number;
  patches: PatchRecord[];
  lastExecution: SubprocessExecutionResult | null;
  executionHistory: SubprocessExecutionResult[];
  isRunning: boolean;
  onToggleApproval?: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  task,
  currentStage,
  stageName,
  isHumanApproved,
  repairAttemptsCount,
  maxRepairLimit,
  patches,
  executionHistory,
  isRunning,
  onToggleApproval,
}) => {
  const testsPassed = executionHistory.filter((r) => r.exitCode === 0).length;
  const testsFailed = executionHistory.filter((r) => r.exitCode !== 0).length;
  const totalDuration = executionHistory.reduce((acc, r) => acc + (r.durationMs || 0), 0);

  return (
    <aside className="w-80 border-l border-[#162032] bg-[#070B12] p-4 flex flex-col gap-4 overflow-y-auto select-none shrink-0">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#162032]">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F3F6FC] font-mono">
            Agent Inspector
          </h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          isRunning 
            ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40 animate-pulse'
            : 'bg-[#0E1524] text-[#64748B] border-[#1E293B]'
        }`}>
          {isRunning ? 'RUNNING' : 'STANDBY'}
        </span>
      </div>

      {/* Task Status & Stage */}
      <div className="p-3.5 rounded-xl bg-[#0A0E1A] border border-[#1A263D] space-y-2">
        <div className="text-[10px] font-mono uppercase text-[#64748B] tracking-wider">
          Active Lifecycle Stage
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-600/20 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/30">
            {currentStage}
          </span>
          <span className="text-xs font-semibold text-[#F3F6FC] truncate">
            {stageName}
          </span>
        </div>
        <div className="text-[11px] text-[#95A2B8] font-mono truncate">
          Task: {task.title}
        </div>
      </div>

      {/* Human Approval Gate Card */}
      <div className={`p-3.5 rounded-xl border transition-all ${
        isHumanApproved 
          ? 'bg-[#0A1620] border-emerald-800/40' 
          : 'bg-[#18111E] border-amber-800/40'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {isHumanApproved ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
            <span className="text-xs font-semibold text-[#F3F6FC]">Policy Gate</span>
          </div>
          <span className={`text-[10px] font-mono font-bold ${
            isHumanApproved ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {isHumanApproved ? 'GRANTED' : 'GATED'}
          </span>
        </div>
        <p className="text-[11px] text-[#95A2B8] leading-relaxed mb-2.5">
          {isHumanApproved 
            ? 'Authorization granted for Stage 4 bounded file mutation.'
            : 'Autonomous file write operations gated by human approval.'}
        </p>
        {onToggleApproval && (
          <button
            onClick={onToggleApproval}
            className={`w-full py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              isHumanApproved 
                ? 'bg-[#0E1524] text-[#95A2B8] hover:bg-[#141C2B] border border-[#1E293B]' 
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {isHumanApproved ? 'Revoke Approval' : 'Authorize Stage 4 Patch'}
          </button>
        )}
      </div>

      {/* Verification & Test Telemetry */}
      <div className="p-3.5 rounded-xl bg-[#0A0E1A] border border-[#1A263D] space-y-2.5">
        <div className="text-[10px] font-mono uppercase text-[#64748B] tracking-wider">
          Verification Outcome
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-[#070B12] rounded-lg border border-[#162032]">
            <div className="text-[#64748B] text-[10px]">Tests Passed</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5 tabular-nums">
              {testsPassed}
            </div>
          </div>
          <div className="p-2.5 bg-[#070B12] rounded-lg border border-[#162032]">
            <div className="text-[#64748B] text-[10px]">Tests Failed</div>
            <div className="text-rose-400 font-bold text-sm mt-0.5 tabular-nums">
              {testsFailed}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#162032] text-[11px] font-mono space-y-1.5 text-[#64748B]">
          <div className="flex items-center justify-between">
            <span>Duration:</span>
            <span className="text-[#F3F6FC] tabular-nums">{totalDuration}ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Repair Budget:</span>
            <span className="text-[#F3F6FC] tabular-nums font-semibold">
              {repairAttemptsCount} / {maxRepairLimit} Used
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Patches Staged:</span>
            <span className="text-cyan-400 tabular-nums font-semibold">
              {patches.length} file{patches.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Sandbox Security Guard Status */}
      <div className="p-3.5 rounded-xl bg-[#0A0E1A] border border-[#1A263D] space-y-2">
        <div className="text-[10px] font-mono uppercase text-[#64748B] tracking-wider flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-cyan-400" />
          <span>Security Invariants</span>
        </div>

        <div className="space-y-1 text-[11px] font-mono text-[#64748B]">
          <div className="flex items-center justify-between">
            <span>Process Timeout:</span>
            <span className="text-[#95A2B8] tabular-nums">25,000ms</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Memory Ceiling:</span>
            <span className="text-[#95A2B8] tabular-nums">512 MB</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Secret Sanitizer:</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Command Allowlist:</span>
            <span className="text-emerald-400 font-semibold">Enforced</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
