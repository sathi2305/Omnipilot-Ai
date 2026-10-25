/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Search, Keyboard } from 'lucide-react';
import type { NavView } from './Sidebar.tsx';

interface HeaderProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  engineMode: 'deterministic_offline' | 'gemini_enhanced';
  setEngineMode: (mode: 'deterministic_offline' | 'gemini_enhanced') => void;
  onRunFullWorkflow: () => void;
  onReset: () => void;
  isRunningWorkflow: boolean;
  isVerified: boolean;
  hasPatches: boolean;
  onOpenShortcuts: () => void;
  onOpenCommandPalette: () => void;
  toggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  engineMode,
  setEngineMode,
  onRunFullWorkflow,
  onReset,
  isRunningWorkflow,
  isVerified,
  hasPatches,
  onOpenShortcuts,
  onOpenCommandPalette,
}) => {
  // Primary navigation items (4-5 single-line clean text items)
  const PRIMARY_NAV: { id: NavView; label: string; indicator?: string }[] = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'runs', label: 'Agent Runs' },
    { id: 'multiagent', label: 'Multi-Agent' },
    { id: 'workflow', label: 'Workflow DAG' },
    { id: 'diff', label: 'Code & Diffs', indicator: hasPatches ? 'DIFF' : undefined },
    { id: 'evidence', label: 'Evidence', indicator: isVerified ? 'VERIFIED' : undefined },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1A263D] bg-[#080B12]/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-6 px-4 md:px-6 w-full">
        {/* Zone 1: Brand Wordmark with subtle glowing AI Core emblem */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E172C] border border-cyan-500/30 shadow-inner group cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            {/* Orbital ring */}
            <div className="absolute inset-0 rounded-lg border border-cyan-400/20 animate-spin-orbit pointer-events-none" />
            <div className="h-3.5 w-3.5 rounded-sm bg-gradient-to-tr from-cyan-500 to-violet-500 shadow-sm shadow-cyan-500/50" />
          </div>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="text-left cursor-pointer focus:outline-none"
          >
            <span className="text-base font-bold tracking-tight text-[#F3F6FC] font-sans hover:text-cyan-300 transition-colors whitespace-nowrap">
              OmniPilot X
            </span>
          </button>
        </div>

        {/* Zone 2: 4-6 concise single-line nav links with clean active typography */}
        <nav className="hidden lg:flex items-center gap-1">
          {PRIMARY_NAV.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-cyan-300 bg-[#121B2F] border border-cyan-500/30'
                    : 'text-[#95A2B8] hover:text-[#F3F6FC] hover:bg-[#0E1524]'
                }`}
              >
                <span>{item.label}</span>
                {item.indicator && (
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                    item.indicator === 'VERIFIED'
                      ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                      : 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/40'
                  }`}>
                    {item.indicator}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Command Launcher, Mode Switch, and Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Command Search Button */}
          <button
            onClick={onOpenCommandPalette}
            title="Open Command Palette (Ctrl+K)"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[#95A2B8] hover:text-[#F3F6FC] rounded-md bg-[#0E1421] hover:bg-[#141C2B] transition-colors border border-[#1E293B] text-xs"
          >
            <Search className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-[11px]">Command</span>
            <kbd className="hidden sm:inline font-mono text-[10px] text-slate-400 bg-[#080B12] px-1 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Engine Selector Segmented Control */}
          <div className="hidden sm:flex items-center bg-[#0E1421] border border-[#1E293B] rounded-md p-0.5">
            <button
              onClick={() => setEngineMode('deterministic_offline')}
              title="100% deterministic offline engine. Zero external network dependencies."
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                engineMode === 'deterministic_offline'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                  : 'text-[#95A2B8] hover:text-[#F3F6FC]'
              }`}
            >
              Offline
            </button>
            <button
              onClick={() => setEngineMode('gemini_enhanced')}
              title="Enhanced agent reasoning via Gemini Flash proxy"
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                engineMode === 'gemini_enhanced'
                  ? 'bg-violet-950/80 text-violet-300 border border-violet-800/40'
                  : 'text-[#95A2B8] hover:text-[#F3F6FC]'
              }`}
            >
              Gemini
            </button>
          </div>

          {/* Keyboard Shortcuts Trigger */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts (Press ?)"
            className="p-1.5 text-[#95A2B8] hover:text-[#F3F6FC] rounded-md bg-[#0E1421] hover:bg-[#141C2B] transition-colors border border-[#1E293B]"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          {/* Replay/Reset */}
          <button
            onClick={onReset}
            disabled={isRunningWorkflow}
            title="Reset workspace (Ctrl+R)"
            className="p-1.5 text-[#95A2B8] hover:text-[#F3F6FC] rounded-md hover:bg-[#141C2B] transition-colors disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onRunFullWorkflow}
            disabled={isRunningWorkflow}
            title="Run Autonomous Engineering Workflow (Ctrl+Enter)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-md transition-all shadow-md shadow-cyan-950/50 disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {isRunningWorkflow ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>Run Flow</span>
                <kbd className="hidden md:inline font-mono text-[10px] bg-blue-900/60 text-cyan-200 px-1 rounded border border-cyan-400/30">
                  Ctrl+↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
