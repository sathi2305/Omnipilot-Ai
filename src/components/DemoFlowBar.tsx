/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface DemoFlowBarProps {
  currentStage: number; // 1 to 6
  onRunStage: (stage: number) => void;
  isRunning: boolean;
}

const STAGES = [
  { stage: 1, label: '1. Inspect Fixture' },
  { stage: 2, label: '2. Baseline Test' },
  { stage: 3, label: '3. Approve Plan' },
  { stage: 4, label: '4. Bounded Repair' },
  { stage: 5, label: '5. Verify Suite' },
  { stage: 6, label: '6. Attest Evidence' },
];

export const DemoFlowBar: React.FC<DemoFlowBarProps> = ({
  currentStage,
  onRunStage,
  isRunning,
}) => {
  return (
    <div className="border border-[#1A263D] bg-[#0A0E1A] rounded-xl p-3 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold text-[#F3F6FC]">
            Evaluation Pipeline Stepper
          </span>
          <span className="text-[11px] text-[#64748B] hidden md:inline">
            — Step-by-step verifiable walkthrough
          </span>
        </div>

        {/* Pipeline Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {STAGES.map((s, idx) => {
            const isPassed = s.stage < currentStage;
            const isCurrent = s.stage === currentStage;

            return (
              <React.Fragment key={s.stage}>
                <button
                  onClick={() => onRunStage(s.stage)}
                  disabled={isRunning}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-sm'
                      : isPassed
                      ? 'bg-[#0B1A1E] text-emerald-400 border border-emerald-800/40'
                      : 'bg-[#0E1524] text-[#95A2B8] border border-[#1E293B] hover:text-[#F3F6FC]'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                  )}
                  <span>{s.label}</span>
                </button>
                {idx < STAGES.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-[#1E293B] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
