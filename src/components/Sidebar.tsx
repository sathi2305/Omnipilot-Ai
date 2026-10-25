/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  FolderGit2, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  PlusCircle, 
  FileCode, 
  GitBranch, 
  GitCompare, 
  Terminal, 
  ScrollText, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

export type NavView = 
  | 'dashboard' 
  | 'runs'
  | 'projects'
  | 'multiagent'
  | 'workflow'
  | 'health'
  | 'intake' 
  | 'explorer' 
  | 'plan' 
  | 'diff' 
  | 'terminal' 
  | 'logs' 
  | 'evidence' 
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
  activeTaskId?: string;
  isVerified?: boolean;
  hasPatches?: boolean;
  approvalNeeded?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  activeTaskId,
  isVerified,
  hasPatches,
  approvalNeeded,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const NAV_SECTIONS: {
    title: string;
    items: {
      id: NavView;
      label: string;
      icon: React.ReactNode;
      badge?: string;
      badgeType?: 'info' | 'warning' | 'success' | 'accent';
    }[];
  }[] = [
    {
      title: 'Command Center',
      items: [
        { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
        { id: 'runs', label: 'Agent Runs', icon: <Activity className="h-4 w-4" /> },
        { id: 'projects', label: 'Projects & Fixtures', icon: <FolderGit2 className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Agent Intelligence',
      items: [
        { id: 'multiagent', label: 'Multi-Agent Studio', icon: <Cpu className="h-4 w-4" />, badge: '8 Roles', badgeType: 'accent' },
        { id: 'workflow', label: 'Workflow Canvas', icon: <Sparkles className="h-4 w-4" />, badge: '7 Stages', badgeType: 'info' },
        { id: 'health', label: 'Health & Invariants', icon: <ShieldCheck className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Execution & Code',
      items: [
        { id: 'intake', label: 'Task Intake & Specs', icon: <PlusCircle className="h-4 w-4" /> },
        { id: 'explorer', label: 'Repository Explorer', icon: <FileCode className="h-4 w-4" /> },
        { 
          id: 'plan', 
          label: 'Plan & Policy Gate', 
          icon: <GitBranch className="h-4 w-4" />,
          badge: approvalNeeded ? 'Approval' : undefined,
          badgeType: 'warning'
        },
        { 
          id: 'diff', 
          label: 'Code Changes', 
          icon: <GitCompare className="h-4 w-4" />,
          badge: hasPatches ? 'Diff' : undefined,
          badgeType: 'info'
        },
        { id: 'terminal', label: 'Sandbox Runner', icon: <Terminal className="h-4 w-4" /> },
        { id: 'logs', label: 'Execution Audit Logs', icon: <ScrollText className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Attestation & Safety',
      items: [
        { 
          id: 'evidence', 
          label: 'Evidence & Reports', 
          icon: <ShieldCheck className="h-4 w-4" />,
          badge: isVerified ? 'Verified' : undefined,
          badgeType: 'success'
        },
        { id: 'settings', label: 'Safety & Policies', icon: <Sliders className="h-4 w-4" /> },
      ],
    },
  ];

  return (
    <aside 
      className={`border-r border-[#162032] bg-[#070B12] flex flex-col shrink-0 select-none transition-all duration-200 relative ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Header / Brand with Collapse Toggle */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-[#162032]">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-7 w-7 rounded-md bg-[#0F172A] border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-[#F3F6FC] block truncate">
                OmniPilot X
              </span>
              <span className="text-[10px] text-[#64748B] block truncate font-mono">
                AI Software Engineer
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1 rounded-md text-[#95A2B8] hover:text-[#F3F6FC] hover:bg-[#141C2B] transition-colors ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2.5 pb-1 text-[10px] font-mono font-medium text-[#64748B] uppercase tracking-wider">
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-md text-xs font-medium transition-all group cursor-pointer ${
                    isCollapsed ? 'justify-center p-2.5' : 'justify-between px-2.5 py-1.5'
                  } ${
                    isActive
                      ? 'bg-[#121B2F] text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-[#95A2B8] hover:text-[#F3F6FC] hover:bg-[#0E1524] border border-transparent'
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isCollapsed ? '' : 'truncate'}`}>
                    <span className={isActive ? 'text-cyan-400' : 'text-[#64748B] group-hover:text-[#95A2B8]'}>
                      {item.icon}
                    </span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span 
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                        item.badgeType === 'success'
                          ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                          : item.badgeType === 'warning'
                          ? 'text-amber-300 bg-amber-950/60 border border-amber-800/40'
                          : item.badgeType === 'accent'
                          ? 'text-violet-300 bg-violet-950/60 border border-violet-800/40'
                          : 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/40'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Environment Invariants Footer */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-[#162032] bg-[#05080E] text-[11px] font-mono text-[#95A2B8] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">Isolation:</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              POSIX Jail
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">Repair Ceiling:</span>
            <span className="text-[#F3F6FC] tabular-nums">$\le$ 2 cycles</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#64748B]">Destructive Git:</span>
            <span className="text-rose-400">Blocked</span>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-[#162032] bg-[#05080E] flex justify-center" title="POSIX Sandboxed">
          <Shield className="h-4 w-4 text-emerald-400" />
        </div>
      )}
    </aside>
  );
};
