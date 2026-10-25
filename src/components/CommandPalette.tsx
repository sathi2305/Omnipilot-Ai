/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Command,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  FileCode,
  FolderGit2,
  Layers,
  Activity,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Cpu,
  Sparkles,
  GitCompare,
  X
} from 'lucide-react';
import type { NavView } from './Sidebar.tsx';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Navigation' | 'Actions' | 'Engine' | 'Safety';
  icon: React.ReactNode;
  shortcut?: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: NavView) => void;
  onRunTest: () => void;
  onApplyRepair: () => void;
  onRunFullWorkflow: () => void;
  onResetWorkspace: () => void;
  onToggleApproval: () => void;
  onSetEngineMode: (mode: 'deterministic_offline' | 'gemini_enhanced') => void;
  engineMode: 'deterministic_offline' | 'gemini_enhanced';
  isHumanApproved: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onRunTest,
  onApplyRepair,
  onRunFullWorkflow,
  onResetWorkspace,
  onToggleApproval,
  onSetEngineMode,
  engineMode,
  isHumanApproved,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Overview Dashboard',
      description: 'System health, execution KPIs, and recent autonomous runs',
      category: 'Navigation',
      icon: <Layers className="h-4 w-4 text-cyan-400" />,
      run: () => { onNavigate('dashboard'); onClose(); },
    },
    {
      id: 'nav-runs',
      title: 'Go to Agent Runs & History',
      description: 'Search, filter, and inspect past autonomous development sessions',
      category: 'Navigation',
      icon: <Activity className="h-4 w-4 text-indigo-400" />,
      run: () => { onNavigate('runs'); onClose(); },
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects & Fixtures',
      description: 'Browse reproducible benchmarks and active workspace repositories',
      category: 'Navigation',
      icon: <FolderGit2 className="h-4 w-4 text-emerald-400" />,
      run: () => { onNavigate('projects'); onClose(); },
    },
    {
      id: 'nav-multiagent',
      title: 'Open Multi-Agent Studio',
      description: 'Inspect collaboration between Architect, QA, Debugger, and Reviewer',
      category: 'Navigation',
      icon: <Cpu className="h-4 w-4 text-purple-400" />,
      run: () => { onNavigate('multiagent'); onClose(); },
    },
    {
      id: 'nav-workflow',
      title: 'Open Workflow Canvas',
      description: 'Interactive visual node graph of the 7-stage engineering pipeline',
      category: 'Navigation',
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
      run: () => { onNavigate('workflow'); onClose(); },
    },
    {
      id: 'nav-health',
      title: 'Open Project Health Radar',
      description: 'Multi-dimensional quality radar and non-negotiable safety invariant checks',
      category: 'Navigation',
      icon: <Activity className="h-4 w-4 text-emerald-400" />,
      run: () => { onNavigate('health'); onClose(); },
    },
    {
      id: 'nav-terminal',
      title: 'Open Sandbox Runner & Terminal',
      description: 'Subprocess runner with telemetry and live test execution logs',
      category: 'Navigation',
      icon: <Terminal className="h-4 w-4 text-cyan-400" />,
      shortcut: 'Alt+T',
      run: () => { onNavigate('terminal'); onClose(); },
    },
    {
      id: 'nav-explorer',
      title: 'Open Repository Explorer',
      description: 'In-browser file system tree and source code viewer',
      category: 'Navigation',
      icon: <FileCode className="h-4 w-4 text-blue-400" />,
      shortcut: 'Alt+E',
      run: () => { onNavigate('explorer'); onClose(); },
    },
    {
      id: 'nav-diff',
      title: 'View Reviewable Code Changes',
      description: 'Unified diff of staged patches and AST modifications',
      category: 'Navigation',
      icon: <GitCompare className="h-4 w-4 text-amber-400" />,
      shortcut: 'Alt+D',
      run: () => { onNavigate('diff'); onClose(); },
    },

    // Actions
    {
      id: 'act-run-workflow',
      title: 'Run Full Autonomous Flow',
      description: 'Execute all 7 pipeline stages from intake to cryptographic attestation',
      category: 'Actions',
      icon: <Play className="h-4 w-4 text-blue-400" />,
      shortcut: 'Ctrl+Enter',
      run: () => { onRunFullWorkflow(); onClose(); },
    },
    {
      id: 'act-run-test',
      title: 'Execute Native Test Suite (node --test)',
      description: 'Run tests in isolated child process with CPU & peak RSS telemetry',
      category: 'Actions',
      icon: <Terminal className="h-4 w-4 text-emerald-400" />,
      shortcut: 'Alt+X',
      run: () => { onRunTest(); onClose(); },
    },
    {
      id: 'act-apply-repair',
      title: 'Trigger Bounded Self-Repair',
      description: 'Run deterministic AST repair engine within strict 2-attempt budget',
      category: 'Actions',
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
      run: () => { onApplyRepair(); onClose(); },
    },
    {
      id: 'act-toggle-approval',
      title: isHumanApproved ? 'Revoke Human Policy Approval' : 'Grant Human Policy Approval',
      description: 'Authorize agent to apply patches to the sandboxed repository',
      category: 'Safety',
      icon: <CheckCircle2 className="h-4 w-4 text-purple-400" />,
      shortcut: 'Alt+A',
      run: () => { onToggleApproval(); onClose(); },
    },
    {
      id: 'act-reset',
      title: 'Reset Workspace & Reload Baseline',
      description: 'Discard all patches and reset test environment to pristine initial state',
      category: 'Actions',
      icon: <RotateCcw className="h-4 w-4 text-rose-400" />,
      shortcut: 'Ctrl+R',
      run: () => { onResetWorkspace(); onClose(); },
    },

    // Engine & Safety
    {
      id: 'eng-offline',
      title: 'Select Offline Deterministic Engine',
      description: '100% offline rule-and-AST engine. 0 external API tokens needed',
      category: 'Engine',
      icon: <Cpu className="h-4 w-4 text-cyan-400" />,
      run: () => { onSetEngineMode('deterministic_offline'); onClose(); },
    },
    {
      id: 'eng-gemini',
      title: 'Select Gemini 2.5 Flash Engine',
      description: 'Server-proxied generative reasoning with strict secret sanitization',
      category: 'Engine',
      icon: <Sparkles className="h-4 w-4 text-indigo-400" />,
      run: () => { onSetEngineMode('gemini_enhanced'); onClose(); },
    },
    {
      id: 'nav-settings',
      title: 'View Safety & Sandbox Policies',
      description: 'Review command allowlist, memory ceilings, and path jail bounds',
      category: 'Safety',
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
      run: () => { onNavigate('settings'); onClose(); },
    },
  ], [
    onNavigate,
    onClose,
    onRunFullWorkflow,
    onRunTest,
    onApplyRepair,
    onToggleApproval,
    onResetWorkspace,
    onSetEngineMode,
    isHumanApproved,
  ]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].run();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-100">
      <div 
        className="w-full max-w-2xl bg-[#090D18] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#070B14]">
          <Search className="h-5 w-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search workbench views (e.g., 'runs', 'test', 'diff', 'repair')..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs font-mono">
              No matching commands found for "{query}"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.run()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600/30' : 'bg-slate-800/60'}`}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold tracking-tight truncate">{item.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
                        {item.shortcut}
                      </kbd>
                    )}
                    <ArrowRight className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2 border-t border-slate-800 bg-[#070B14] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="text-slate-400">↑↓</kbd> navigate</span>
            <span><kbd className="text-slate-400">↵</kbd> select</span>
            <span><kbd className="text-slate-400">esc</kbd> close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400">OmniPilot X</span> Command Center
          </div>
        </div>
      </div>
    </div>
  );
};
