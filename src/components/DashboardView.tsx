/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Wrench, 
  FileCode, 
  ArrowRight, 
  Play, 
  Sparkles,
  ShieldCheck,
  Zap,
  Terminal,
  Cpu,
  Layers,
  Search,
  ChevronRight,
  Send,
  Boxes
} from 'lucide-react';
import type { TaskRecord, ProjectRecord } from '../../server/database.ts';

interface DashboardViewProps {
  onStartNewTask: (customTask?: { title: string; description: string; fixture: string }) => void;
  onSelectTask: (taskId: string) => void;
  onViewDiff?: (task: TaskRecord) => void;
  onViewEvidence?: (task: TaskRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartNewTask,
  onSelectTask,
  onViewDiff,
  onViewEvidence,
}) => {
  const [metrics, setMetrics] = useState({
    tasksCompleted: 0,
    tasksInProgress: 0,
    testsPassed: 0,
    failedTestRuns: 0,
    successfulRepairRate: 100,
    filesModified: 0,
    totalDurationMs: 0,
  });
  const [recentTasks, setRecentTasks] = useState<TaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Task Composer State
  const [promptText, setPromptText] = useState('');
  const [selectedFixture, setSelectedFixture] = useState('data-kit-ts');
  const [searchFilter, setSearchFilter] = useState('');

  const TEMPLATES = [
    {
      label: 'Fix RangeError regression in chunk()',
      fixture: 'data-kit-ts',
      prompt: 'Investigate and resolve test failures in data-kit-ts: chunk() must validate size > 0 throwing RangeError("Chunk size must be greater than 0"), and ensure remainder trailing elements are preserved when dividing uneven arrays without truncation.',
    },
    {
      label: 'JWT Guard expired token contract',
      fixture: 'jwt-guard',
      prompt: 'Implement token verification middleware in jwt-guard: enforce algorithm pinning (RS256/HS256 only), strictly reject expired tokens with TokenExpiredError, and verify HMAC signatures against secrets.',
    },
    {
      label: 'Matrix Math dimension compatibility',
      fixture: 'matrix-math',
      prompt: 'Implement dimension compatibility assertions in matrix-math dot product: raise DimensionMismatchError when columns of matrix A do not match rows of matrix B, and maintain precision.',
    },
  ];

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [metricRes, taskRes, projRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/tasks'),
          fetch('/api/projects'),
        ]);

        if (metricRes.ok) setMetrics(await metricRes.json());
        if (taskRes.ok) {
          const data = await taskRes.json();
          setRecentTasks(data.tasks || []);
        }
        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleLaunchTask = () => {
    const title = promptText.trim() 
      ? promptText.slice(0, 60) + (promptText.length > 60 ? '...' : '') 
      : 'Autonomous Engineering Mission';
    
    onStartNewTask({
      title,
      description: promptText.trim() || 'Execute bounded autonomous repair workflow and verify against test suite.',
      fixture: selectedFixture,
    });
  };

  const filteredTasks = recentTasks.filter(t => 
    t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.language.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.status.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Natural Language Mission Control */}
      <div className="relative rounded-2xl border border-[#1A263D] bg-[#0A0E1A] p-6 sm:p-8 overflow-hidden bg-neural-grid">
        <div className="absolute top-0 right-0 w-[500px] h-[350px] bg-gradient-to-bl from-cyan-500/10 via-violet-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A263D] pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Autonomous AI Software Engineer</span>
                <span className="text-[#64748B]">·</span>
                <span className="text-[#95A2B8]">POSIX Worktree Sandbox</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3F6FC] tracking-tight">
                Build. Test. Evolve.
              </h1>
              <p className="text-xs sm:text-sm text-[#95A2B8] mt-1 max-w-2xl leading-relaxed">
                Transform natural-language software specifications into verified, tested, and cryptographically attested deliverables. Operating under strict POSIX sandboxing with zero unverified claims.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#95A2B8] bg-[#0E1524] px-3 py-2 rounded-lg border border-[#1A263D] shrink-0">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Safety Budget: <strong className="text-[#F3F6FC] tabular-nums font-semibold">2 Cycles</strong></span>
            </div>
          </div>

          {/* AI Task Composer Input Box */}
          <div className="rounded-xl border border-[#1E2C45] bg-[#0D1322]/90 p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <label htmlFor="task-composer" className="text-xs font-semibold text-[#F3F6FC] flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>Autonomous Task Composer</span>
              </label>
              
              {/* Fixture Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#64748B] text-[11px] font-mono">Target Fixture:</span>
                <select
                  value={selectedFixture}
                  onChange={(e) => setSelectedFixture(e.target.value)}
                  className="bg-[#080B12] text-cyan-300 text-xs font-mono px-2.5 py-1 rounded border border-[#1E2C45] focus:outline-none focus:border-cyan-500"
                >
                  <option value="data-kit-ts">data-kit-ts (TypeScript)</option>
                  <option value="jwt-guard">jwt-guard (Node.js/Auth)</option>
                  <option value="matrix-math">matrix-math (Python/Numeric)</option>
                </select>
              </div>
            </div>

            <textarea
              id="task-composer"
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Describe a software bug, feature request, or regression to investigate and repair..."
              className="w-full bg-[#070B12] text-xs text-[#F3F6FC] rounded-lg p-3 border border-[#1E293B] focus:outline-none focus:border-cyan-400/60 placeholder-[#64748B] leading-relaxed resize-none font-sans"
            />

            {/* Quick-Prompt Preset Chips & Launch Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-[#64748B] mr-1">Presets:</span>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    onClick={() => {
                      setPromptText(tmpl.prompt);
                      setSelectedFixture(tmpl.fixture);
                    }}
                    className="text-[11px] text-[#95A2B8] hover:text-cyan-300 bg-[#0E1524] hover:bg-[#141F36] px-2.5 py-1 rounded border border-[#1E293B] transition-colors cursor-pointer text-left"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleLaunchTask}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Launch Mission</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real Persisted Metrics Grid (6 KPI Panels) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1A263D] hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-medium text-[#95A2B8]">Tasks Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#F3F6FC] tabular-nums">
            {metrics.tasksCompleted}
          </div>
          <div className="text-[10px] text-[#64748B] font-mono mt-1">Verified Pass (Exit 0)</div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1A263D] hover:border-amber-500/30 transition-colors">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-medium text-[#95A2B8]">In Progress</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {metrics.tasksInProgress}
          </div>
          <div className="text-[10px] text-[#64748B] font-mono mt-1">Active Pipeline</div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1A263D] hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-medium text-[#95A2B8]">Tests Passed</span>
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
            {metrics.testsPassed}
          </div>
          <div className="text-[10px] text-[#64748B] font-mono mt-1">Subprocess Assertions</div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1A263D] hover:border-rose-500/30 transition-colors">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-medium text-[#95A2B8]">Failed Test Runs</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300 tabular-nums">
            {metrics.failedTestRuns}
          </div>
          <div className="text-[10px] text-[#64748B] font-mono mt-1">Captured For Triage</div>
        </div>

        {/* Metric 5 */}
        <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1A263D] hover:border-blue-500/30 transition-colors">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-medium text-[#95A2B8]">Repair Success</span>
            <Wrench className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300 tabular-nums">
            {metrics.successfulRepairRate}%
          </div>
          <div className="text-[10px] text-[#64748B] font-mono mt-1">Bounded ($\le$ 2 cycles)</div>
        </div>

        {/* Metric 6 */}
        <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1A263D] hover:border-violet-500/30 transition-colors">
          <div className="flex items-center justify-between text-[#64748B] mb-1.5">
            <span className="text-[11px] font-medium text-[#95A2B8]">Files Staged</span>
            <FileCode className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-violet-300 tabular-nums">
            {metrics.filesModified}
          </div>
          <div className="text-[10px] text-[#64748B] font-mono mt-1">Reviewable Diffs</div>
        </div>
      </div>

      {/* Two Column Section: Recent Tasks vs Target Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Tasks List (8 cols) */}
        <div className="lg:col-span-8 border border-[#1A263D] bg-[#0A0E1A] rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F3F6FC]">
                Persisted Task Execution Records
              </h2>
              <p className="text-[11px] text-[#95A2B8]">
                Real historical runs from database storage
              </p>
            </div>

            {/* Quick search filter */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter tasks..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 bg-[#080B12] text-xs text-[#F3F6FC] rounded-md border border-[#1E293B] focus:outline-none focus:border-cyan-400 w-44 font-sans placeholder-[#64748B]"
              />
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-[#95A2B8] text-xs">
              <Terminal className="h-8 w-8 mx-auto mb-2 text-[#64748B]" />
              <p>No matching task records found.</p>
              <p className="text-[11px] text-[#64748B] mt-1">Use the task composer above to initiate a new autonomous software run.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#162032]">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t.id)}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-[#0E1524] px-2 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#F3F6FC] group-hover:text-cyan-300 transition-colors truncate">
                        {t.title}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                        t.status === 'completed'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                          : t.status === 'failed'
                          ? 'bg-rose-950/60 text-rose-400 border-rose-800/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#64748B] font-mono">
                      <span>{t.id}</span>
                      <span>·</span>
                      <span>{t.language} / {t.framework}</span>
                      <span>·</span>
                      <span>Repairs: {t.repairAttemptsUsed}/{t.maxRepairAttempts}</span>
                      {t.executionRuns && t.executionRuns.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-cyan-400/80">{t.executionRuns.length} runs</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.patches && t.patches.length > 0 && onViewDiff && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDiff(t);
                        }}
                        className="px-2 py-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 bg-[#0E1B2D] border border-cyan-800/40 rounded hover:bg-[#13253F] transition-colors"
                      >
                        Diff ({t.patches.length})
                      </button>
                    )}
                    {t.finalReport && onViewEvidence && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewEvidence(t);
                        }}
                        className="px-2 py-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-[#0C241B] border border-emerald-800/40 rounded hover:bg-[#123628] transition-colors"
                      >
                        Evidence
                      </button>
                    )}
                    <ArrowRight className="h-4 w-4 text-[#64748B] group-hover:text-cyan-400 shrink-0 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Target Project Inventory (4 cols) */}
        <div className="lg:col-span-4 border border-[#1A263D] bg-[#0A0E1A] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F3F6FC] flex items-center gap-2">
              <Boxes className="h-4 w-4 text-cyan-400" />
              <span>Registered Fixtures</span>
            </h2>
            <span className="text-xs font-mono text-[#64748B]">{projects.length} targets</span>
          </div>

          <div className="space-y-3">
            {projects.map((proj) => (
              <div 
                key={proj.id} 
                onClick={() => {
                  setSelectedFixture(proj.fixtureName);
                  setPromptText(`Verify and run full test suite on ${proj.name} (${proj.fixtureName})`);
                }}
                className="p-3.5 rounded-lg bg-[#070B14] border border-[#1E293B] hover:border-cyan-500/40 transition-colors cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F3F6FC] group-hover:text-cyan-300 transition-colors">
                    {proj.name}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-800/40">
                    {proj.language}
                  </span>
                </div>
                <p className="text-[11px] text-[#95A2B8] leading-relaxed">
                  {proj.description}
                </p>
                <div className="pt-2 border-t border-[#162032] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                  <span>Fixture: {proj.fixtureName}</span>
                  <span>{proj.framework}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
