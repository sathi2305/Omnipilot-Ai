/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    keys: ['Ctrl', 'K'],
    macKeys: ['⌘', 'K'],
    description: 'Open Global Command Palette (quick search, actions & views)',
  },
  {
    keys: ['Ctrl', 'Enter'],
    macKeys: ['⌘', 'Enter'],
    description: 'Advance to next workflow stage / execute primary stage action',
  },
  {
    keys: ['Ctrl', 'R'],
    macKeys: ['⌘', 'R'],
    altKeys: ['Alt', 'R'],
    description: 'Reset workspace session and reload pristine benchmark fixture',
  },
  {
    keys: ['Ctrl', 'A'],
    macKeys: ['⌘', 'A'],
    altKeys: ['Alt', 'A'],
    description: 'Toggle Human Approval Gate for staged file modifications',
  },
  {
    keys: ['1'],
    description: 'Switch to Tab 1: Task Intake & Repository Intelligence',
  },
  {
    keys: ['2'],
    description: 'Switch to Tab 2: DAG Plan & Policy Gate',
  },
  {
    keys: ['3'],
    description: 'Switch to Tab 3: Diff & Sandbox Subprocess Runner',
  },
  {
    keys: ['4'],
    description: 'Switch to Tab 4: Verifiable Evidence & Cryptographic Manifest',
  },
  {
    keys: ['?'],
    altKeys: ['Ctrl', '/'],
    description: 'Toggle this keyboard shortcuts cheat-sheet modal',
  },
  {
    keys: ['Esc'],
    description: 'Close active modal / blur focus',
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg border border-slate-800 bg-[#0B101D] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#080C16] border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Keyboard Shortcuts & Navigation
              </h3>
              <p className="text-[11px] text-slate-400">
                Power-user shortcuts for autonomous engineering workflow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-5 divide-y divide-slate-800/80 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-300 font-medium">
                {item.description}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <kbd className="px-2 py-1 text-[11px] font-mono font-semibold text-slate-200 bg-slate-900 border border-slate-700/80 rounded shadow-sm">
                      {k}
                    </kbd>
                    {kIdx < item.keys.length - 1 && (
                      <span className="text-slate-500 text-xs">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#080C16] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded">?</kbd> anywhere to open</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
