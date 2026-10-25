/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  ShieldAlert, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import type { AuditEvent } from '../../server/database.ts';

interface ExecutionLogsViewProps {
  taskId?: string;
}

export const ExecutionLogsView: React.FC<ExecutionLogsViewProps> = ({ taskId }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const url = taskId ? `/api/tasks/${taskId}/events` : '/api/tasks/fake/events';
      const res = await fetch(`/api/tasks/${taskId || 'current'}/events`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [taskId]);

  const handleCopyLogs = () => {
    const text = events.map((e) => `[${e.timestamp}] [${e.severity.toUpperCase()}] [${e.type}] ${e.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = filterSeverity === 'all' 
    ? events 
    : events.filter((e) => e.severity === filterSeverity);

  return (
    <div className="border border-slate-800 bg-[#0B101D] rounded-xl overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#080C16] border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <ScrollText className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-white">Execution Audit Trail</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">{events.length} immutable events</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity filter */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px] font-mono">
            {['all', 'info', 'warning', 'security'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  filterSeverity === sev ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={fetchEvents}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors border border-transparent hover:border-slate-700"
            title="Refresh events"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCopyLogs}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>Copy Trail</span>
          </button>
        </div>
      </div>

      {/* Events Stream */}
      <div className="flex-1 overflow-auto p-4 space-y-2 font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
            <ScrollText className="h-8 w-8 mb-2 opacity-50" />
            <p>No audit events match the selected criteria.</p>
          </div>
        ) : (
          filtered.map((ev) => {
            const isSecurity = ev.severity === 'security';
            const isWarn = ev.severity === 'warning';
            const isCritical = ev.severity === 'critical';

            let badgeClass = 'text-blue-400 bg-blue-950/40 border-blue-800/40';
            if (isSecurity) badgeClass = 'text-cyan-300 bg-cyan-950/40 border-cyan-700/50';
            if (isWarn) badgeClass = 'text-amber-400 bg-amber-950/40 border-amber-800/40';
            if (isCritical) badgeClass = 'text-rose-400 bg-rose-950/40 border-rose-800/40';

            return (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800/70 hover:border-slate-700 transition-colors flex items-start gap-3"
              >
                <div className="pt-0.5 shrink-0">
                  {isSecurity ? (
                    <ShieldAlert className="h-4 w-4 text-cyan-400" />
                  ) : isWarn ? (
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${badgeClass}`}>
                      {ev.type}
                    </span>
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {ev.timestamp.replace('T', ' ').slice(0, 19)}
                    </span>
                    {ev.taskId && (
                      <span className="text-[10px] text-slate-400">Task: {ev.taskId}</span>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans text-xs">
                    {ev.message}
                  </p>
                  {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                    <div className="mt-1.5 p-1.5 rounded bg-black/40 text-[10px] text-slate-400 font-mono">
                      {JSON.stringify(ev.metadata)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
