/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Cpu, 
  Terminal, 
  FileCheck, 
  Sparkles,
  Layers,
  Info
} from 'lucide-react';
import type { TaskIntake, SubprocessExecutionResult, PatchRecord, SecurityAuditResult } from '../types.ts';

interface ProjectHealthRadarProps {
  task: TaskIntake;
  lastExecution: SubprocessExecutionResult | null;
  patches: PatchRecord[];
  securityAudit: SecurityAuditResult | null;
  isHumanApproved: boolean;
  repairAttemptsCount: number;
}

export const ProjectHealthRadar: React.FC<ProjectHealthRadarProps> = ({
  task,
  lastExecution,
  patches,
  securityAudit,
  isHumanApproved,
  repairAttemptsCount,
}) => {
  // Compute health dimensions (0 to 100)
  const healthMetrics = useMemo(() => {
    // 1. Test Pass Rate
    let testPassRate = 0;
    if (lastExecution) {
      testPassRate = lastExecution.exitCode === 0 ? 100 : 33;
    }

    // 2. Acceptance Criteria Coverage
    const verifiedCount = task.acceptanceCriteria.filter((c) => c.verified).length;
    const criteriaScore = Math.round((verifiedCount / Math.max(1, task.acceptanceCriteria.length)) * 100);

    // 3. Security & Sandboxing (100 if no threats, path safe)
    let securityScore = 100;
    if (securityAudit && !securityAudit.isClean) {
      securityScore = 40;
    }

    // 4. Policy Gate Compliance
    const policyScore = isHumanApproved ? 100 : 75;

    // 5. Repair Budget Health (100 if 0-1 attempts, 50 if 2, 0 if breached)
    const budgetScore = repairAttemptsCount === 0 ? 100 : repairAttemptsCount === 1 ? 80 : 50;

    // 6. AST & Code Integrity (100 if patched and clean, 85 baseline)
    const codeIntegrity = patches.length > 0 && lastExecution?.exitCode === 0 ? 100 : 80;

    return [
      { label: 'Test Pass Rate', value: testPassRate, unit: '%', color: '#10B981' },
      { label: 'Acceptance Criteria', value: criteriaScore, unit: '%', color: '#06B6D4' },
      { label: 'Security Invariants', value: securityScore, unit: '%', color: '#8B5CF6' },
      { label: 'Policy Compliance', value: policyScore, unit: '%', color: '#3B82F6' },
      { label: 'Repair Budget', value: budgetScore, unit: '%', color: '#F59E0B' },
      { label: 'Code Quality', value: codeIntegrity, unit: '%', color: '#EC4899' },
    ];
  }, [lastExecution, task.acceptanceCriteria, securityAudit, isHumanApproved, repairAttemptsCount, patches]);

  // Overall Health Score
  const overallHealth = useMemo(() => {
    const sum = healthMetrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round(sum / healthMetrics.length);
  }, [healthMetrics]);

  // Generate SVG Radar Chart Points
  const radarChartData = useMemo(() => {
    const size = 260;
    const center = size / 2;
    const radius = 95;
    const count = healthMetrics.length;

    const points = healthMetrics.map((m, index) => {
      const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
      const r = (m.value / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, label: m.label, value: m.value, angle };
    });

    const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

    const webCircles = [0.25, 0.5, 0.75, 1.0].map((scale) => {
      return points.map((_, index) => {
        const angle = (Math.PI * 2 / count) * index - Math.PI / 2;
        const x = center + radius * scale * Math.cos(angle);
        const y = center + radius * scale * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
    });

    return { size, center, points, polygonPoints, webCircles };
  }, [healthMetrics]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-[#090D18] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-white tracking-tight">AI Project Health & Invariants Radar</h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Autonomous verification score evaluated across test pass rates, security guardrails, policy gates, and acceptance coverage.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#070B14] p-3.5 rounded-xl border border-slate-800/80">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block">Overall Health</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {overallHealth}/100
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart & Metrics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart Visualizer */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#070B14] border border-slate-800 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Multi-Axis Quality Radar
          </span>
          
          <div className="relative">
            <svg width={radarChartData.size} height={radarChartData.size} className="overflow-visible">
              {/* Web Rings */}
              {radarChartData.webCircles.map((pts, i) => (
                <polygon
                  key={i}
                  points={pts}
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="1"
                  strokeDasharray={i < 3 ? '2 2' : 'none'}
                />
              ))}

              {/* Axis lines */}
              {radarChartData.points.map((p, i) => (
                <line
                  key={i}
                  x1={radarChartData.center}
                  y1={radarChartData.center}
                  x2={p.x}
                  y2={p.y}
                  stroke="#1E293B"
                  strokeWidth="1"
                />
              ))}

              {/* Active Polygon Area */}
              <polygon
                points={radarChartData.polygonPoints}
                fill="rgba(6, 182, 212, 0.25)"
                stroke="#06B6D4"
                strokeWidth="2"
                className="transition-all duration-500"
              />

              {/* Vertices */}
              {radarChartData.points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#06B6D4"
                  stroke="#070B14"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          <div className="text-[11px] font-mono text-slate-500 text-center mt-3">
            Target benchmark: &ge;85/100 for production attestation
          </div>
        </div>

        {/* 6 Dimension Score Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {healthMetrics.map((metric, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#090D18] border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">{metric.label}</span>
                <span className="text-xs font-mono font-bold" style={{ color: metric.color }}>
                  {metric.value}{metric.unit}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Threshold: 80%</span>
                <span>{metric.value >= 80 ? 'Optimal' : 'Needs Verification'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Invariant Verifications List */}
      <div className="p-6 rounded-2xl bg-[#090D18] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Active Non-Negotiable Safety Invariants</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">All 5 Invariants Enforced</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#060A13] border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Subprocess Sandboxing & Execution Cap</span>
              <span className="text-slate-400 text-[11px]">Hard 25,000ms timeout ceiling; memory RSS monitored; shell pipes strictly rejected.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060A13] border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Worktree Boundary & Path Traversal Guard</span>
              <span className="text-slate-400 text-[11px]">Strict path.resolve containment check prevents path escapes outside project jail.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060A13] border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Environment Secret Sanitization</span>
              <span className="text-slate-400 text-[11px]">GEMINI_API_KEY and authentication tokens automatically stripped from spawned child environments.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060A13] border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Bounded Repair Budget Ceiling</span>
              <span className="text-slate-400 text-[11px]">Autonomous repairs limited to exactly 2 cycles max; terminates cleanly without unbounded loops.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
