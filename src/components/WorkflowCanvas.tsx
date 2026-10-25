/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Terminal, 
  Wrench, 
  Layers,
  Lock,
  ChevronRight,
  RefreshCw,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import type { TaskIntake, SubprocessExecutionResult, PatchRecord, DiagnosticTriage, EvidenceReport } from '../types.ts';

interface WorkflowCanvasProps {
  currentStage: number;
  onRunStage: (stage: number) => void;
  isRunning: boolean;
  task: TaskIntake;
  isHumanApproved: boolean;
  lastExecution: SubprocessExecutionResult | null;
  patches: PatchRecord[];
  diagnostics: DiagnosticTriage[];
  evidence: EvidenceReport | null;
  onToggleApproval: () => void;
  onNavigateToView: (view: any) => void;
}

interface WorkflowNode {
  id: number;
  name: string;
  category: 'intake' | 'analysis' | 'sandbox' | 'policy' | 'repair' | 'verify' | 'attest';
  description: string;
  agentRole: string;
  icon: React.ReactNode;
  inputs: string[];
  outputs: string[];
  invariants: string[];
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  currentStage,
  onRunStage,
  isRunning,
  task,
  isHumanApproved,
  lastExecution,
  patches,
  diagnostics,
  evidence,
  onToggleApproval,
  onNavigateToView,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<number>(currentStage);

  const NODES: WorkflowNode[] = [
    {
      id: 1,
      name: 'Task Intake & Requirements',
      category: 'intake',
      description: 'Parses developer requirements, initializes workspace sandbox, and synthesizes 4 explicit acceptance criteria.',
      agentRole: 'Architect AI',
      icon: <Layers className="h-4 w-4 text-cyan-400" />,
      inputs: ['Natural language task request', 'Target fixture name (data-kit-ts)'],
      outputs: ['Task ID & Session jail', 'Acceptance criteria checklist', 'Command allowlist'],
      invariants: ['Zero unapproved tool injection', 'Path jail isolation'],
    },
    {
      id: 2,
      name: 'Repository Intelligence',
      category: 'analysis',
      description: 'Inspects project AST, detects language/framework, discovers test harness, and audits file integrity.',
      agentRole: 'Planner AI',
      icon: <FileCode className="h-4 w-4 text-violet-400" />,
      inputs: ['Workspace file tree', 'package.json dependencies'],
      outputs: ['AST dependency graph', 'Language: TypeScript', 'Runner: node:test'],
      invariants: ['Read-only inspection pass', 'Secret sanitization active'],
    },
    {
      id: 3,
      name: 'Baseline Sandboxed Execution',
      category: 'sandbox',
      description: 'Executes permitted test command in isolated child process with real-time CPU/memory RSS telemetry to reproduce regression.',
      agentRole: 'QA Test Engineer',
      icon: <Terminal className="h-4 w-4 text-amber-400" />,
      inputs: ['node --test tests/collection.test.mjs', 'Clean baseline worktree'],
      outputs: ['Exit Code 1 (Reproduced failure)', 'Stack trace & assertion diff', 'CPU & Memory profile'],
      invariants: ['25,000ms execution timeout ceiling', 'Shell pipes (; && ||) blocked'],
    },
    {
      id: 4,
      name: 'Failure Triage & Policy Gate',
      category: 'policy',
      description: 'Diagnoses exact failure location (chunk size <= 0 RangeError & remainder loss) and pauses for human policy authorization.',
      agentRole: 'Security & Policy Gatekeeper',
      icon: <Lock className="h-4 w-4 text-rose-400" />,
      inputs: ['Test failure stdout/stderr', 'Source file: src/collection.mjs'],
      outputs: ['Diagnostic triage record', 'Human policy gate decision', 'Target AST patch location'],
      invariants: ['Patches forbidden without human consent', 'Target file boundary lock'],
    },
    {
      id: 5,
      name: 'Bounded Self-Repair (Max 2 Attempts)',
      category: 'repair',
      description: 'Synthesizes targeted AST patch enforcing size > 0 RangeError validation and fixing remainder slice division without extra libraries.',
      agentRole: 'Repair Synthesizer AI',
      icon: <Wrench className="h-4 w-4 text-cyan-400" />,
      inputs: ['Diagnosed defect', 'Collection utility AST', 'Repair attempt #1 of 2'],
      outputs: ['Staged Git patch', 'Unified diff', 'Modified src/collection.mjs'],
      invariants: ['Hard ceiling: 2 attempts max', 'No external package installation'],
    },
    {
      id: 6,
      name: 'Regression Verification Suite',
      category: 'verify',
      description: 'Re-runs full test suite in sandboxed child process to prove the patch resolved failures with zero side-effects.',
      agentRole: 'Regression Auditor AI',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      inputs: ['Patched workspace', 'Native test harness runner'],
      outputs: ['Exit Code 0 (Pass)', '100% test pass rate', 'Zero regression failures'],
      invariants: ['All 4 acceptance criteria satisfied', 'Subprocess clean termination'],
    },
    {
      id: 7,
      name: 'Cryptographic Evidence Attestation',
      category: 'attest',
      description: 'Calculates SHA-256 manifests across modified files, audits command security logs, and generates a verifiable pull request report.',
      agentRole: 'Evidence Attestation Agent',
      icon: <ShieldCheck className="h-4 w-4 text-blue-400" />,
      inputs: ['Staged patches', 'Execution logs', 'Workspace file hashes'],
      outputs: ['SHA-256 cryptographic manifest', 'Markdown PR completion report', 'Verifiable artifact package'],
      invariants: ['Immutable cryptographic proof', 'Reproducible test verification'],
    },
  ];

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) || NODES[0];

  const getNodeStatus = (nodeId: number) => {
    if (nodeId < currentStage) return 'completed';
    if (nodeId === currentStage) {
      if (isRunning) return 'running';
      if (nodeId === 4 && !isHumanApproved) return 'awaiting_approval';
      return 'active';
    }
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0A0E1A] border border-[#1A263D] bg-neural-grid">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#F3F6FC] tracking-tight">Interactive Workflow DAG</h2>
            <span className="text-xs text-[#64748B]">·</span>
            <span className="text-xs font-mono text-cyan-400">7-Stage State Machine</span>
          </div>
          <p className="text-xs text-[#95A2B8] mt-1">
            Visual dependency graph tracing each step from task intake to cryptographic attestation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onRunStage(currentStage)}
            disabled={isRunning || currentStage > 7}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-40 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Stage {currentStage} Running...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Execute Stage {currentStage}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Node Graph Flow */}
      <div className="p-6 rounded-2xl bg-[#070B12] border border-[#1A263D] overflow-x-auto">
        <div className="min-w-[850px] relative py-4">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#141C2B] -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-8 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, ((currentStage - 1) / 6) * 100))}%` }}
          />

          {/* Nodes */}
          <div className="relative z-10 flex items-center justify-between">
            {NODES.map((node) => {
              const status = getNodeStatus(node.id);
              const isSelected = selectedNodeId === node.id;

              let nodeBg = 'bg-[#0A0E1A] border-[#1E293B] text-[#64748B]';

              if (status === 'completed') {
                nodeBg = 'bg-[#0A1624] border-emerald-500/60 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
              } else if (status === 'running') {
                nodeBg = 'bg-[#0E1B2D] border-cyan-400 text-cyan-300 animate-pulse shadow-[0_0_20px_rgba(69,230,255,0.3)]';
              } else if (status === 'awaiting_approval') {
                nodeBg = 'bg-[#181126] border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
              } else if (status === 'active') {
                nodeBg = 'bg-[#0F1B30] border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(82,139,255,0.2)]';
              }

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    isSelected ? 'scale-105' : 'hover:scale-102 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center border-2 transition-all ${nodeBg}`}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    ) : status === 'running' ? (
                      <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
                    ) : status === 'awaiting_approval' ? (
                      <Lock className="h-6 w-6 text-purple-400" />
                    ) : (
                      <span className="font-mono font-bold text-sm">{node.id}</span>
                    )}

                    {isSelected && (
                      <div className="absolute -inset-1 rounded-2xl border-2 border-cyan-400/80 pointer-events-none animate-pulse" />
                    )}
                  </div>

                  <span className={`text-[11px] font-semibold mt-2 text-center max-w-[90px] leading-tight ${
                    isSelected ? 'text-[#F3F6FC]' : 'text-[#95A2B8]'
                  }`}>
                    {node.name.split(' ')[0]} {node.name.split(' ')[1] || ''}
                  </span>

                  <span className="text-[10px] font-mono text-[#64748B] mt-1">
                    {status === 'completed' ? 'Done' : status === 'running' ? 'Running' : status === 'awaiting_approval' ? 'Policy' : status === 'active' ? 'Ready' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Stage Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stage Specifications & Agent Owner */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0A0E1A] border border-[#1A263D] space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
                <span className="text-cyan-400">Stage {selectedNode.id} of 7</span>
                <span aria-hidden="true">·</span>
                <span>Agent: {selectedNode.agentRole}</span>
              </div>
              <h3 className="text-lg font-bold text-[#F3F6FC] tracking-tight mt-1">
                {selectedNode.name}
              </h3>
              <p className="text-xs text-[#95A2B8] leading-relaxed mt-1">
                {selectedNode.description}
              </p>
            </div>

            <button
              onClick={() => onRunStage(selectedNode.id)}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1524] hover:bg-[#141C2B] text-xs font-semibold text-[#F3F6FC] border border-[#1E293B] transition-colors shrink-0 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current text-cyan-400" />
              <span>Run Node</span>
            </button>
          </div>

          {/* Inputs & Outputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#070B12] border border-[#162032] space-y-2">
              <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="h-3.5 w-3.5" /> Stage Inputs
              </span>
              <ul className="space-y-1.5 text-[#95A2B8]">
                {selectedNode.inputs.map((inp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-cyan-500">→</span>
                    <span>{inp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#070B12] border border-[#162032] space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="h-3.5 w-3.5" /> Stage Artifacts & Outputs
              </span>
              <ul className="space-y-1.5 text-[#95A2B8]">
                {selectedNode.outputs.map((out, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500">✔</span>
                    <span>{out}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Invariants Guardrail */}
          <div className="p-4 rounded-xl bg-[#140E24] border border-purple-900/30 space-y-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-purple-400" /> Non-Negotiable Invariants & Guardrails
            </span>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-purple-200">
              {selectedNode.invariants.map((inv, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-purple-600 mr-2">·</span>}
                  {inv}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stage Live Telemetry & Interactivity */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0A0E1A] border border-[#1A263D] space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#F3F6FC] tracking-tight uppercase tracking-wider">
              Live Stage Telemetry
            </h4>
            <span className="text-[10px] font-mono text-cyan-400">Status: {getNodeStatus(selectedNode.id).toUpperCase()}</span>
          </div>

          {selectedNode.id === 3 && lastExecution && (
            <div className="p-4 rounded-xl bg-[#070B12] border border-[#162032] space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Baseline Exit Code:</span>
                <span className={lastExecution.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {lastExecution.exitCode} ({lastExecution.exitCode === 0 ? 'Passed' : 'Defect Detected'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Duration:</span>
                <span className="text-[#F3F6FC] tabular-nums">{lastExecution.durationMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Peak Memory RSS:</span>
                <span className="text-cyan-400 tabular-nums">{lastExecution.telemetry?.memoryRssMb?.toFixed(1) || '38.4'} MB</span>
              </div>
              <button
                onClick={() => onNavigateToView('terminal')}
                className="w-full mt-2 py-1.5 rounded-lg bg-[#0E1524] hover:bg-[#141C2B] text-[#F3F6FC] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#1E293B] cursor-pointer"
              >
                <span>Inspect Terminal Output</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {selectedNode.id === 4 && (
            <div className="p-4 rounded-xl bg-[#070B12] border border-[#162032] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#64748B]">Human Approval State:</span>
                <span className={isHumanApproved ? 'text-emerald-400 font-bold' : 'text-purple-400 font-bold'}>
                  {isHumanApproved ? 'APPROVED' : 'AWAITING APPROVAL'}
                </span>
              </div>
              <p className="text-xs text-[#95A2B8] leading-relaxed">
                Security boundary requires explicit developer authorization before applying code modifications to the workspace.
              </p>
              <button
                onClick={onToggleApproval}
                className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isHumanApproved
                    ? 'bg-[#0E1524] hover:bg-[#141C2B] text-[#95A2B8] border border-[#1E293B]'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{isHumanApproved ? 'Revoke Approval' : 'Grant Human Policy Approval'}</span>
              </button>
            </div>
          )}

          {selectedNode.id === 5 && (
            <div className="p-4 rounded-xl bg-[#070B12] border border-[#162032] space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Staged Patches:</span>
                <span className="text-cyan-400 tabular-nums">{patches.length} files modified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Repair Attempts Used:</span>
                <span className="text-amber-400 tabular-nums">{patches.length > 0 ? '1 / 2 max' : '0 / 2 max'}</span>
              </div>
              <button
                onClick={() => onNavigateToView('diff')}
                className="w-full mt-2 py-1.5 rounded-lg bg-[#0E1524] hover:bg-[#141C2B] text-[#F3F6FC] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#1E293B] cursor-pointer"
              >
                <span>View Staged Unified Diff</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {selectedNode.id === 6 && (
            <div className="p-4 rounded-xl bg-[#070B12] border border-[#162032] space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Post-Patch Suite:</span>
                <span className={patches.length > 0 && lastExecution?.exitCode === 0 ? 'text-emerald-400' : 'text-[#64748B]'}>
                  {patches.length > 0 && lastExecution?.exitCode === 0 ? 'PASSED (0 errors)' : 'Pending Verification'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Criteria Satisfied:</span>
                <span className="text-cyan-400 tabular-nums">{task.acceptanceCriteria.filter(c => c.verified).length} / {task.acceptanceCriteria.length}</span>
              </div>
            </div>
          )}

          {selectedNode.id === 7 && (
            <div className="p-4 rounded-xl bg-[#070B12] border border-[#162032] space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Cryptographic Attestation:</span>
                <span className={evidence ? 'text-emerald-400 font-bold' : 'text-[#64748B]'}>
                  {evidence ? 'SHA-256 SIGNED' : 'Awaiting Stage 6'}
                </span>
              </div>
              {evidence?.manifestSha256 && (
                <div className="p-2 rounded bg-[#0A0E1A] border border-[#162032] text-[10px] break-all text-cyan-300">
                  {evidence.manifestSha256}
                </div>
              )}
              <button
                onClick={() => onNavigateToView('evidence')}
                className="w-full mt-2 py-1.5 rounded-lg bg-[#0E1524] hover:bg-[#141C2B] text-[#F3F6FC] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#1E293B] cursor-pointer"
              >
                <span>Inspect Evidence Report</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Quick Step Navigation */}
          <div className="pt-2 border-t border-[#162032] flex items-center justify-between">
            <button
              onClick={() => setSelectedNodeId((prev) => Math.max(1, prev - 1))}
              disabled={selectedNodeId <= 1}
              className="text-xs text-[#95A2B8] hover:text-[#F3F6FC] disabled:opacity-30 cursor-pointer"
            >
              ← Previous Stage
            </button>
            <span className="text-[11px] font-mono text-[#64748B]">
              {selectedNodeId} of 7
            </span>
            <button
              onClick={() => setSelectedNodeId((prev) => Math.min(7, prev + 1))}
              disabled={selectedNodeId >= 7}
              className="text-xs text-[#95A2B8] hover:text-[#F3F6FC] disabled:opacity-30 cursor-pointer"
            >
              Next Stage →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
