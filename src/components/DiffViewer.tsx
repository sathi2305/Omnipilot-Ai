/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GitCompare, Plus, Minus, FileCode2 } from 'lucide-react';
import type { PatchRecord } from '../types.ts';

interface DiffViewerProps {
  patches: PatchRecord[];
  activeFile?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ patches }) => {
  if (patches.length === 0) {
    return (
      <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[360px]">
        <GitCompare className="h-8 w-8 text-slate-600 mb-2" />
        <h4 className="text-sm font-semibold text-slate-300">No Patches Applied Yet</h4>
        <p className="text-xs text-slate-500 max-w-md mt-1">
          When the autonomous engine diagnoses a failure and synthesizes a fix, reviewable unified diffs will appear here with line-by-line syntax highlighting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {patches.map((patch) => {
        const diffLines = (patch.unifiedDiff || patch.patchDiff || '').split('\n');

        return (
          <div key={patch.id} className="border border-slate-800 bg-[#0B101D] rounded-lg overflow-hidden">
            {/* Diff Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#080C16] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode2 className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-mono text-slate-200 font-medium">
                  {patch.fileModified}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  (Attempt {patch.repairAttempt}/2)
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Plus className="h-3 w-3" />
                  <span>{patch.linesAdded}</span>
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <Minus className="h-3 w-3" />
                  <span>{patch.linesRemoved}</span>
                </span>
                <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {patch.appliedBy === 'deterministic_engine' ? 'Deterministic AST' : 'Gemini 2.5 Flash'}
                </span>
              </div>
            </div>

            {/* Diff Body */}
            <div className="p-3 font-mono text-xs overflow-x-auto bg-[#060A12] divide-y divide-slate-900/40">
              {diffLines.map((line, idx) => {
                const isAddition = line.startsWith('+') && !line.startsWith('+++');
                const isDeletion = line.startsWith('-') && !line.startsWith('---');
                const isHunkHeader = line.startsWith('@@');

                let lineClass = 'text-slate-400';
                let bgClass = 'hover:bg-slate-900/50';

                if (isAddition) {
                  lineClass = 'text-emerald-300 font-medium';
                  bgClass = 'bg-emerald-950/30';
                } else if (isDeletion) {
                  lineClass = 'text-rose-300 line-through opacity-80';
                  bgClass = 'bg-rose-950/30';
                } else if (isHunkHeader) {
                  lineClass = 'text-blue-400 font-semibold';
                  bgClass = 'bg-blue-950/20';
                }

                return (
                  <div key={idx} className={`py-0.5 px-2 flex items-start gap-3 ${lineClass} ${bgClass}`}>
                    <span className="w-6 text-[10px] text-slate-600 select-none text-right shrink-0">
                      {idx + 1}
                    </span>
                    <pre className="m-0 font-mono whitespace-pre">{line}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
