/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  Cpu, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  Zap,
  Gauge
} from 'lucide-react';
import type { SubprocessExecutionResult, SystemResourceMetrics } from '../types.ts';

interface ExecutionTerminalProps {
  lastExecution: SubprocessExecutionResult | null;
  executionHistory: SubprocessExecutionResult[];
  onRunTest: () => void;
  isRunning: boolean;
}

export const ExecutionTerminal: React.FC<ExecutionTerminalProps> = ({
  lastExecution,
  executionHistory,
  onRunTest,
  isRunning,
}) => {
  const [selectedRunIndex, setSelectedRunIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<SystemResourceMetrics | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([4, 6, 8, 5, 12, 10, 7, 9]);

  // If executions exist, allow selecting between runs
  const currentRun = executionHistory[selectedRunIndex] || lastExecution;

  // Poll system resource metrics
  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/system/metrics');
        if (res.ok) {
          const data: SystemResourceMetrics = await res.json();
          if (isMounted) {
            setMetrics(data);
            setCpuHistory((prev) => [...prev.slice(-15), data.cpuPercent]);
          }
        }
      } catch (err) {
        // Silent recovery on dev server restart
      }
    };

    fetchMetrics();
    // Poll faster (400ms) when running tests, otherwise 1200ms
    const interval = setInterval(fetchMetrics, isRunning ? 400 : 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isRunning]);

  const handleCopyLogs = () => {
    if (!currentRun) return;
    const overheadText = currentRun.resourceOverhead
      ? `\nResource Overhead: Peak Memory ${currentRun.resourceOverhead.peakMemoryMb}MB, CPU User ${currentRun.resourceOverhead.cpuUserMs}ms, CPU Sys ${currentRun.resourceOverhead.cpuSystemMs}ms`
      : '';
    const text = `Command: ${currentRun.command}\nExit Code: ${currentRun.exitCode}\nDuration: ${currentRun.durationMs}ms${overheadText}\n\nSTDOUT:\n${currentRun.stdout}\n\nSTDERR:\n${currentRun.stderr}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cpuPercent = metrics ? metrics.cpuPercent : 0;
  const memoryRssMb = metrics ? metrics.memoryRssMb : 0;
  const memoryHeapUsedMb = metrics ? metrics.memoryHeapUsedMb : 0;
  const sandboxLimitMb = metrics ? metrics.sandboxMemoryLimitMb : 512;
  const memoryUsagePercent = Math.min(100, Math.round((memoryRssMb / sandboxLimitMb) * 100));

  return (
    <div className="border border-slate-800 bg-[#0B101D] rounded-lg overflow-hidden flex flex-col h-full min-h-[480px]">
      {/* Terminal Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#080C16] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
            <span>subprocess: sandboxed child_process</span>
          </div>
        </div>

        {/* History Selectors & Actions */}
        <div className="flex items-center gap-2">
          {executionHistory.length > 1 && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px] font-mono">
              {executionHistory.map((run, idx) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunIndex(idx)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    selectedRunIndex === idx
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Run #{idx + 1} ({run.exitCode === 0 ? 'PASS' : 'FAIL'})
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleCopyLogs}
            disabled={!currentRun}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors border border-transparent hover:border-slate-700 disabled:opacity-40"
            title="Copy raw terminal logs & resource overhead"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={onRunTest}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Play className="h-3 w-3 fill-current" />
            )}
            <span>Run Test</span>
          </button>
        </div>
      </div>

      {/* Real-Time System Resource Monitor HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-2.5 bg-[#070B14] border-b border-slate-800 text-xs">
        {/* Metric 1: CPU Load */}
        <div className="p-2 rounded bg-[#090E1A] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-blue-400" />
              <span>Real-Time CPU Load</span>
            </span>
            <span className="font-mono font-semibold tabular-nums text-slate-200">
              {cpuPercent.toFixed(1)}%
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  cpuPercent > 80 
                    ? 'bg-rose-500' 
                    : cpuPercent > 50 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(4, cpuPercent)}%` }}
              />
            </div>
            {/* Spark mini history bars */}
            <div className="flex items-end gap-0.5 h-3">
              {cpuHistory.slice(-8).map((val, idx) => (
                <div
                  key={idx}
                  className="w-1 bg-blue-500/60 rounded-xs"
                  style={{ height: `${Math.max(20, Math.min(100, val * 1.5))}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Metric 2: Memory Footprint & Sandbox Cap */}
        <div className="p-2 rounded bg-[#090E1A] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-purple-400" />
              <span>Memory RSS / Sandbox Cap</span>
            </span>
            <span className="font-mono font-semibold tabular-nums text-slate-200">
              {memoryRssMb} MB
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
              <span>Heap: {memoryHeapUsedMb} MB</span>
              <span>Cap: {sandboxLimitMb} MB</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  memoryUsagePercent > 80 
                    ? 'bg-rose-500' 
                    : memoryUsagePercent > 50 
                    ? 'bg-amber-400' 
                    : 'bg-purple-400'
                }`}
                style={{ width: `${Math.max(3, memoryUsagePercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Subprocess Overhead & Security Isolation */}
        <div className="p-2 rounded bg-[#090E1A] border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Test Runner Overhead</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isRunning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
            }`}>
              {isRunning ? 'PROBING...' : 'ISOLATED'}
            </span>
          </div>

          <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            {currentRun?.resourceOverhead ? (
              <>
                <span>Peak: {currentRun.resourceOverhead.peakMemoryMb} MB</span>
                <span>User: {currentRun.resourceOverhead.cpuUserMs}ms</span>
                <span>Sys: {currentRun.resourceOverhead.cpuSystemMs}ms</span>
              </>
            ) : (
              <span className="text-slate-500">
                {isRunning ? 'Sampling subprocess telemetry...' : 'Ready for execution'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Execution Telemetry Header */}
      {currentRun && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 py-2 bg-[#090D18] border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div>
            <span className="text-slate-500">Command: </span>
            <span className="text-slate-200 font-semibold">{currentRun.command}</span>
          </div>
          <div>
            <span className="text-slate-500">Exit Code: </span>
            <span className={`font-semibold ${currentRun.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentRun.exitCode} ({(currentRun.status || (currentRun.exitCode === 0 ? 'passed' : 'failed')).toUpperCase()})
            </span>
          </div>
          <div>
            <span className="text-slate-500">Duration: </span>
            <span className="text-slate-200 tabular-nums">{currentRun.durationMs}ms</span>
          </div>
          <div>
            <span className="text-slate-500">Attempt: </span>
            <span className="text-slate-200 tabular-nums">{currentRun.attemptNumber} of 2</span>
          </div>
        </div>
      )}

      {/* Terminal Output Area */}
      <div className="flex-1 p-4 font-mono text-xs overflow-auto space-y-1 bg-[#060A12] leading-relaxed">
        {!currentRun ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
            <Terminal className="h-8 w-8 mb-2 opacity-50" />
            <p>Subprocess sandbox ready.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Click &quot;Run Test&quot; or execute the autonomous workflow to stream child_process output.
            </p>
          </div>
        ) : (
          <>
            {currentRun.stdout && (
              <div className="text-slate-300 whitespace-pre-wrap">
                {currentRun.stdout}
              </div>
            )}
            {currentRun.stderr && (
              <div className="text-rose-400 whitespace-pre-wrap mt-2 p-2 bg-rose-950/20 border border-rose-900/30 rounded">
                {currentRun.stderr}
              </div>
            )}
            <div className="pt-2 text-slate-500 text-[11px] border-t border-slate-900 mt-2 flex items-center justify-between">
              <span>--- Process exited with code {currentRun.exitCode} in {currentRun.durationMs}ms ---</span>
              {currentRun.resourceOverhead && (
                <span className="text-slate-400 font-mono">
                  Overhead: {currentRun.resourceOverhead.peakMemoryMb}MB Peak RSS · {currentRun.resourceOverhead.cpuUserMs + currentRun.resourceOverhead.cpuSystemMs}ms CPU Time
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
