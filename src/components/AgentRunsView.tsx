/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  Download, 
  FileCode, 
  Layers, 
  Zap, 
  SlidersHorizontal 
} from 'lucide-react';
import type { TaskRecord } from '../../server/database.ts';

interface AgentRunsViewProps {
  tasks: TaskRecord[];
  onSelectTask: (task: TaskRecord) => void;
  onViewDiff: (task: TaskRecord) => void;
  onViewEvidence: (task: TaskRecord) => void;
  onStartNewTask: () => void;
}

export const AgentRunsView: React.FC<AgentRunsViewProps> = ({
  tasks,
  onSelectTask,
  onViewDiff,
  onViewEvidence,
  onStartNewTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fixtureFilter, setFixtureFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration' | 'repairs'>('newest');

  // Extract unique fixtures from tasks
  const availableFixtures = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      // Default to data-kit-ts if not specified
      set.add(t.projectId === 'proj_datakit' ? 'data-kit-ts' : t.projectId);
    });
    return Array.from(set);
  }, [tasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Search query match
        const matchesQuery = 
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase());

        // Status match
        const matchesStatus = 
          statusFilter === 'all' ||
          (statusFilter === 'completed' && t.status === 'completed') ||
          (statusFilter === 'failed' && t.status === 'failed') ||
          (statusFilter === 'in_progress' && ['executing', 'planning', 'testing', 'repairing'].includes(t.status)) ||
          (statusFilter === 'awaiting_approval' && t.status === 'awaiting_approval');

        // Fixture match
        const fixtureName = t.projectId === 'proj_datakit' ? 'data-kit-ts' : t.projectId;
        const matchesFixture = fixtureFilter === 'all' || fixtureName === fixtureFilter;

        return matchesQuery && matchesStatus && matchesFixture;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'repairs') {
          return (b.repairAttemptsUsed || 0) - (a.repairAttemptsUsed || 0);
        }
        if (sortBy === 'duration') {
          const durA = (a.executionRuns || []).reduce((acc, r) => acc + (r.durationMs || 0), 0);
          const durB = (b.executionRuns || []).reduce((acc, r) => acc + (r.durationMs || 0), 0);
          return durB - durA;
        }
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, fixtureFilter, sortBy]);

  const totalRuns = tasks.length;
  const completedRuns = tasks.filter((t) => t.status === 'completed').length;
  const passRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 100;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="border border-slate-800 bg-[#0B101D] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
              <Layers className="h-3.5 w-3.5" />
              <span>Historical Agent Execution Records</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Persisted Task State</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Agent Runs & Execution History
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter, search, inspect, and replay autonomous software development runs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onStartNewTask}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <span>+ New Engineering Task</span>
            </button>
          </div>
        </div>

        {/* Real Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">Total Persisted Runs</span>
            <span className="text-lg font-bold text-white tabular-nums">{totalRuns}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">Matching Filter</span>
            <span className="text-lg font-bold text-cyan-400 tabular-nums">{filteredTasks.length}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">Verification Rate</span>
            <span className="text-lg font-bold text-emerald-400 tabular-nums">{passRate}%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">Max Bounded Attempts</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">2 / task</span>
          </div>
        </div>
      </div>

      {/* Advanced Search and Filter Bar */}
      <div className="border border-slate-800 bg-[#0B101D] rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search runs by task title, run ID, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070B14] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-mono cursor-pointer"
            >
              <option value="all" className="bg-[#0B101D]">All Statuses</option>
              <option value="completed" className="bg-[#0B101D]">Completed (Pass)</option>
              <option value="in_progress" className="bg-[#0B101D]">In Progress</option>
              <option value="failed" className="bg-[#0B101D]">Failed / Triage</option>
              <option value="awaiting_approval" className="bg-[#0B101D]">Awaiting Approval</option>
            </select>
          </div>

          {/* Fixture Filter */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-slate-400 text-[11px]">Fixture:</span>
            <select
              value={fixtureFilter}
              onChange={(e) => setFixtureFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-mono cursor-pointer"
            >
              <option value="all" className="bg-[#0B101D]">All Fixtures</option>
              {availableFixtures.map((f) => (
                <option key={f} value={f} className="bg-[#0B101D]">{f}</option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-mono cursor-pointer"
            >
              <option value="newest" className="bg-[#0B101D]">Newest First</option>
              <option value="oldest" className="bg-[#0B101D]">Oldest First</option>
              <option value="duration" className="bg-[#0B101D]">Longest Duration</option>
              <option value="repairs" className="bg-[#0B101D]">Most Repairs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Table / Cards */}
      <div className="border border-slate-800 bg-[#0B101D] rounded-xl overflow-hidden divide-y divide-slate-800/80">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">No agent runs match the search filters</p>
            <p className="text-[11px] text-slate-400 mt-1">Try adjusting the status or fixture filter, or reset search query.</p>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setFixtureFilter('all'); }}
              className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors font-mono"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredTasks.map((run) => {
            const isSuccess = run.status === 'completed';
            const isFailed = run.status === 'failed';
            const totalDur = (run.executionRuns || []).reduce((acc, r) => acc + (r.durationMs || 0), 0);
            const patchCount = (run.patches || []).length;
            const fixtureTag = run.projectId === 'proj_datakit' ? 'data-kit-ts' : run.projectId;

            return (
              <div
                key={run.id}
                className="p-4 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                      isSuccess
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                        : isFailed
                        ? 'bg-rose-950/40 text-rose-400 border-rose-800/40'
                        : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                    }`}>
                      {run.status.toUpperCase()}
                    </span>

                    <span className="text-xs font-bold text-white font-mono truncate">
                      {run.title}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-cyan-300 border border-blue-800/30">
                      {fixtureTag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {run.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 pt-0.5">
                    <span>ID: <code className="text-slate-300">{run.id}</code></span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{totalDur > 0 ? `${totalDur}ms` : '0ms'}</span>
                    </span>
                    <span>·</span>
                    <span>Repairs: <span className="text-amber-400">{run.repairAttemptsUsed}/{run.maxRepairAttempts}</span></span>
                    <span>·</span>
                    <span>Patches: <span className="text-cyan-400">{patchCount}</span></span>
                    <span>·</span>
                    <span>{run.createdAt.replace('T', ' ').slice(0, 16)} UTC</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {patchCount > 0 && (
                    <button
                      onClick={() => onViewDiff(run)}
                      className="px-2.5 py-1 text-xs font-mono text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
                    >
                      Diff ({patchCount})
                    </button>
                  )}

                  {run.finalReport && (
                    <button
                      onClick={() => onViewEvidence(run)}
                      className="px-2.5 py-1 text-xs font-mono text-emerald-300 hover:text-white bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 rounded transition-colors"
                    >
                      Evidence
                    </button>
                  )}

                  <button
                    onClick={() => onSelectTask(run)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
