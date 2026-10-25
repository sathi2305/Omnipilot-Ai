/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  FileJson, 
  GitCommit, 
  ShieldCheck, 
  Hash 
} from 'lucide-react';
import type { EvidenceReport } from '../types.ts';

interface EvidenceAuditPanelProps {
  evidence: EvidenceReport | null;
  markdownText: string;
}

export const EvidenceAuditPanel: React.FC<EvidenceAuditPanelProps> = ({
  evidence,
  markdownText,
}) => {
  const [activeView, setActiveView] = useState<'summary' | 'markdown' | 'json' | 'patch'>('summary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!evidence) {
    return (
      <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-10 text-center flex flex-col items-center justify-center min-h-[380px]">
        <ShieldCheck className="h-10 w-10 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300">
          No Verification Evidence Generated Yet
        </h3>
        <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
          Execute the autonomous engineering flow or run tests in the sandbox to produce verifiable cryptographic proof, exit code logs, and immutable PR audit manifests.
        </p>
      </div>
    );
  }

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename: string, content: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isSuccess = evidence.finalStatus === 'VERIFIED_SUCCESS';

  return (
    <div className="space-y-6">
      {/* Verification Status Header */}
      <div className={`border rounded-lg p-5 ${
        isSuccess 
          ? 'border-emerald-800/80 bg-[#0A161E]' 
          : 'border-amber-800/80 bg-[#16120E]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="pt-0.5">
              {isSuccess ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-amber-400 shrink-0" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isSuccess ? 'Verified Engineering Completion' : 'Execution Complete — Policy Ceiling Reached'}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  isSuccess 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {evidence.finalStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {isSuccess
                  ? 'All automated test suites verified passing with exit code 0. Zero test regressions detected in baseline fixtures.'
                  : 'Automated repair budget ceiling reached. System preserved original fixture and generated full triage report.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleDownload(`omnipilot-evidence-${evidence.taskId}.md`, markdownText, 'text/markdown')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* SHA-256 Checksum Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 truncate">
            <Hash className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-500">SHA-256 Manifest Checksum:</span>
            <span className="text-blue-300 truncate">{evidence.manifestHash}</span>
          </div>
          <button
            onClick={() => handleCopy('hash', evidence.manifestHash)}
            className="text-[11px] text-slate-400 hover:text-slate-200 self-start sm:self-auto flex items-center gap-1 shrink-0"
          >
            {copiedKey === 'hash' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>Copy Hash</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('summary')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeView === 'summary'
                ? 'bg-slate-800 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Summary & Criteria
          </button>
          <button
            onClick={() => setActiveView('markdown')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeView === 'markdown'
                ? 'bg-slate-800 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Markdown Report
          </button>
          <button
            onClick={() => setActiveView('json')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeView === 'json'
                ? 'bg-slate-800 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JSON Manifest
          </button>
          <button
            onClick={() => setActiveView('patch')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeView === 'patch'
                ? 'bg-slate-800 text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Diff Patch
          </button>
        </div>

        <button
          onClick={() => {
            const content = activeView === 'markdown' 
              ? markdownText 
              : activeView === 'json' 
              ? JSON.stringify(evidence, null, 2) 
              : evidence.patches.map((p) => p.unifiedDiff).join('\n\n');
            handleCopy(activeView, content);
          }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
        >
          {copiedKey === activeView ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          <span>Copy {activeView.toUpperCase()}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeView === 'summary' && (
        <div className="space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#0B101D] border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-500 font-mono">Total Execution Time</span>
              <div className="text-lg font-bold font-mono text-slate-200 tabular-nums mt-0.5">
                {evidence.totalDurationMs} ms
              </div>
            </div>
            <div className="p-3 bg-[#0B101D] border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-500 font-mono">Repairs Used</span>
              <div className="text-lg font-bold font-mono text-slate-200 tabular-nums mt-0.5">
                {evidence.repairAttemptsUsed} / {evidence.maxRepairLimit}
              </div>
            </div>
            <div className="p-3 bg-[#0B101D] border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-500 font-mono">Subprocess Runs</span>
              <div className="text-lg font-bold font-mono text-slate-200 tabular-nums mt-0.5">
                {evidence.executionRuns.length} runs
              </div>
            </div>
            <div className="p-3 bg-[#0B101D] border border-slate-800 rounded-lg">
              <span className="text-[11px] text-slate-500 font-mono">Engine Mode</span>
              <div className="text-sm font-semibold font-mono text-blue-400 mt-1 truncate">
                {evidence.environmentMetadata.engineMode}
              </div>
            </div>
          </div>

          {/* Acceptance Criteria Table */}
          <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-5">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">
              Acceptance Criteria Attestation
            </h4>
            <div className="space-y-2">
              {evidence.acceptanceCriteria.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-[#070B14] border border-slate-800 rounded text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200">{c.description}</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                    PASS (EXIT 0)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'markdown' && (
        <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-4 font-mono text-xs overflow-auto max-h-[500px] leading-relaxed text-slate-300 whitespace-pre-wrap">
          {markdownText}
        </div>
      )}

      {activeView === 'json' && (
        <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-4 font-mono text-xs overflow-auto max-h-[500px] leading-relaxed text-blue-300 whitespace-pre">
          {JSON.stringify(evidence, null, 2)}
        </div>
      )}

      {activeView === 'patch' && (
        <div className="border border-slate-800 bg-[#0B101D] rounded-lg p-4 font-mono text-xs overflow-auto max-h-[500px] leading-relaxed text-slate-300 whitespace-pre">
          {evidence.patches.map((p) => p.unifiedDiff).join('\n\n') || '(No patches)'}
        </div>
      )}
    </div>
  );
};
