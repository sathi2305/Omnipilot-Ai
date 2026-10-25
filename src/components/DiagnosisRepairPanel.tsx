/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wrench, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { DiagnosticTriage, SubprocessExecutionResult } from '../types.ts';

interface DiagnosisRepairPanelProps {
  diagnostics: DiagnosticTriage[];
  lastExecution: SubprocessExecutionResult | null;
  currentRepairAttempt: number;
  maxRepairLimit: number;
  isHumanApproved: boolean;
  onApplyRepair: () => void;
  isRunning: boolean;
  engineMode: 'deterministic_offline' | 'gemini_enhanced';
}

export const DiagnosisRepairPanel: React.FC<DiagnosisRepairPanelProps> = ({
  diagnostics,
  lastExecution,
  currentRepairAttempt,
  maxRepairLimit,
  isHumanApproved,
  onApplyRepair,
  isRunning,
  engineMode,
}) => {
  const latestDiagnostic = diagnostics[diagnostics.length - 1];
  const hasExceededBudget = currentRepairAttempt >= maxRepairLimit;
  const isTestsFailing = lastExecution && lastExecution.exitCode !== 0;

  return (
    <div className="space-y-4">
      {/* Repair Budget Header & Counter */}
      <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Bounded Self-Repair Controller
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enforces a strict safety ceiling of at most {maxRepairLimit} automated repair attempts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-mono">Repair Budget</div>
              <div className="text-sm font-bold font-mono text-slate-200 tabular-nums">
                {currentRepairAttempt} / {maxRepairLimit} Attempts Used
              </div>
            </div>

            <button
              onClick={onApplyRepair}
              disabled={isRunning || !isTestsFailing || hasExceededBudget || !isHumanApproved}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
            >
              {isRunning ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Wrench className="h-3.5 w-3.5" />
              )}
              <span>
                {hasExceededBudget 
                  ? 'Budget Limit Exceeded' 
                  : `Apply Repair (${currentRepairAttempt + 1}/${maxRepairLimit})`}
              </span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {!isHumanApproved && isTestsFailing && (
          <div className="mt-3 p-2.5 rounded bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between">
            <span>Human Approval Required: Approve Stage 4 in the Plan tab before modifying repository files.</span>
          </div>
        )}

        {hasExceededBudget && (
          <div className="mt-3 p-2.5 rounded bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
            <span>Safety Limit Reached: OmniPilot X strictly stops after {maxRepairLimit} attempts to prevent unbounded loops.</span>
          </div>
        )}
      </div>

      {/* Latest Diagnostic Triage Card */}
      {latestDiagnostic ? (
        <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Diagnostic Triage (Attempt #{latestDiagnostic.repairAttempt})
            </span>
            <span className="text-[10px] font-mono bg-rose-950/40 text-rose-400 border border-rose-800/40 px-2 py-0.5 rounded">
              {(latestDiagnostic.failureCategory || latestDiagnostic.failureType || 'defect').toUpperCase()}
            </span>
          </div>

          <div className="p-3 bg-[#070B14] rounded border border-slate-800/80 text-xs space-y-2">
            <div>
              <span className="text-slate-500 font-mono text-[11px]">Failing Test Unit: </span>
              <span className="text-slate-200 font-mono font-medium">{latestDiagnostic.failingTestName}</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[11px]">Target Source: </span>
              <span className="text-blue-400 font-mono">{latestDiagnostic.sourceFile}</span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-500 text-[11px] block mb-1">Root Cause Analysis:</span>
              <p className="text-slate-300 text-xs leading-relaxed font-sans">
                {latestDiagnostic.rootCauseAnalysis}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-500 text-[11px] block mb-1">Proposed Patch Strategy:</span>
              <p className="text-emerald-400 text-xs leading-relaxed font-mono">
                {latestDiagnostic.proposedPatchStrategy}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-6 text-center text-slate-500 text-xs">
          No diagnostic records yet. Run tests to capture and triage failures.
        </div>
      )}
    </div>
  );
};
