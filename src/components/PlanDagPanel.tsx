/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Play,
  ArrowRight
} from 'lucide-react';
import type { PlanStep } from '../types.ts';

interface PlanDagPanelProps {
  steps: PlanStep[];
  selectedStepId: string;
  setSelectedStepId: (id: string) => void;
  isHumanApproved: boolean;
  onApproveStep: () => void;
  onRejectStep: () => void;
  onProceedToExecution: () => void;
  isRunning: boolean;
}

export const PlanDagPanel: React.FC<PlanDagPanelProps> = ({
  steps,
  selectedStepId,
  setSelectedStepId,
  isHumanApproved,
  onApproveStep,
  onRejectStep,
  onProceedToExecution,
  isRunning,
}) => {
  const selectedStep = steps.find((s) => s.id === selectedStepId) || steps[0];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="border border-slate-800 bg-[#0E1524] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>DAG Execution Plan</span>
              <span aria-hidden="true">·</span>
              <span>Dependency-Aware</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400">Human Approval Gate Enforced</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Task Planning & Policy Gating
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect ordered execution stages, review risk classifications, and approve sensitive code patch mutations before sandbox execution.
            </p>
          </div>

          <button
            onClick={onProceedToExecution}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors shadow-sm whitespace-nowrap self-start md:self-auto"
          >
            <span>Proceed to Execution</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Human Approval Gate Card */}
      <div className={`border rounded-lg p-4 transition-all ${
        isHumanApproved 
          ? 'border-emerald-800/80 bg-emerald-950/20' 
          : 'border-amber-800/80 bg-amber-950/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="pt-0.5">
              {isHumanApproved ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white">
                  {isHumanApproved ? 'Human Approval Granted' : 'Human Approval Gate: Pending Confirmation'}
                </h4>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  isHumanApproved 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isHumanApproved ? 'APPROVED' : 'GATE REQUIRED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {isHumanApproved
                  ? 'Authorization granted for Stage 4 (Bounded Repair Patch). The sandbox may apply surgical modifications to src/collection.mjs.'
                  : 'Safety Invariant: Autonomous file mutations, network access, or git write operations require explicit developer confirmation.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isHumanApproved ? (
              <>
                <button
                  onClick={onRejectStep}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                >
                  Reject Patch
                </button>
                <button
                  onClick={onApproveStep}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded shadow-sm transition-colors"
                >
                  Approve & Authorize
                </button>
              </>
            ) : (
              <button
                onClick={onRejectStep}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded transition-colors"
              >
                Revoke Approval
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Plan Steps Timeline vs Step Detail (7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Step Cards */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">
            Execution Stages
          </h3>

          {steps.map((step) => {
            const isSelected = step.id === selectedStepId;
            return (
              <div
                key={step.id}
                onClick={() => setSelectedStepId(step.id)}
                className={`cursor-pointer border rounded-lg p-4 transition-all ${
                  isSelected
                    ? 'border-blue-500/80 bg-[#121B2E]'
                    : 'border-slate-800 bg-[#0B101D] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-mono text-slate-300">
                      {step.order}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-100">
                      {step.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      step.estimatedRisk === 'low'
                        ? 'text-emerald-400 bg-emerald-950/30'
                        : step.estimatedRisk === 'medium'
                        ? 'text-amber-400 bg-amber-950/30'
                        : 'text-rose-400 bg-rose-950/30'
                    }`}>
                      {step.estimatedRisk.toUpperCase()} RISK
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      step.status === 'completed'
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                        : step.status === 'running'
                        ? 'text-blue-400 bg-blue-950/40 border border-blue-800/40 animate-pulse'
                        : step.status === 'failed'
                        ? 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}>
                      {step.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 ml-7 line-clamp-2">
                  {step.description}
                </p>

                {step.outputSummary && (
                  <div className="mt-2 ml-7 p-2 rounded bg-[#070B14] border border-slate-800/60 text-[11px] text-slate-300 font-mono">
                    {step.outputSummary}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Selected Step Inspector */}
        <div className="lg:col-span-5">
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200">
                Stage {selectedStep.order} Inspector
              </h3>
              <span className="text-xs font-mono text-blue-400">
                Phase: {selectedStep.phase}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-1">Summary</h4>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {selectedStep.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-1">Target Files in Scope</h4>
              <div className="space-y-1">
                {selectedStep.targetFiles.map((file) => (
                  <div key={file} className="p-2 bg-[#070B14] border border-slate-800 rounded font-mono text-xs text-slate-300">
                    {file}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-1">Security & Policy Verification</h4>
              <div className="p-3 bg-[#070B14] border border-slate-800 rounded text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Human Approval Required:</span>
                  <span className="font-mono text-slate-200">
                    {selectedStep.requiresHumanApproval ? 'YES (Gated)' : 'NO (Automated)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Execution Boundary:</span>
                  <span className="font-mono text-slate-200">POSIX child_process jail</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Allowed Tooling:</span>
                  <span className="font-mono text-slate-200">Deterministic AST / Vitest</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
