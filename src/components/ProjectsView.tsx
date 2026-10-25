/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FolderGit2, 
  Search, 
  Filter, 
  ArrowRight, 
  FileCode, 
  CheckCircle2, 
  Terminal, 
  Sparkles, 
  Layers,
  ArrowUpDown
} from 'lucide-react';
import type { ProjectRecord } from '../../server/database.ts';

interface ProjectsViewProps {
  projects: ProjectRecord[];
  onSelectProject: (project: ProjectRecord) => void;
  onExploreProject: (project: ProjectRecord) => void;
  onCreateProject?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSelectProject,
  onExploreProject,
  onCreateProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'language'>('name');

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesQuery = 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.fixtureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.framework.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesLanguage = 
          languageFilter === 'all' || 
          p.language.toLowerCase() === languageFilter.toLowerCase();

        return matchesQuery && matchesLanguage;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'language') return a.language.localeCompare(b.language);
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [projects, searchQuery, languageFilter, sortBy]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.language));
    return Array.from(set);
  }, [projects]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="border border-slate-800 bg-[#0B101D] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono mb-1">
              <FolderGit2 className="h-3.5 w-3.5" />
              <span>Registered Target Codebases</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Workspace Fixtures</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Projects & Repositories
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or configure target codebases for autonomous software engineering tasks.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-[#070B14] border border-slate-800 text-slate-300">
              Total: <span className="text-cyan-400 font-bold tabular-nums">{projects.length}</span> targets
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="border border-slate-800 bg-[#0B101D] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by name, description, framework, or fixture..."
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

          {/* Language Filter */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Language:</span>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-mono cursor-pointer"
            >
              <option value="all" className="bg-[#0B101D]">All Languages</option>
              {languages.map((l) => (
                <option key={l} value={l} className="bg-[#0B101D]">{l}</option>
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
              <option value="name" className="bg-[#0B101D]">Name (A-Z)</option>
              <option value="language" className="bg-[#0B101D]">Language</option>
              <option value="newest" className="bg-[#0B101D]">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full border border-slate-800 bg-[#0B101D] rounded-xl p-12 text-center text-slate-500 text-xs">
            <FolderGit2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">No projects match the current query</p>
            <p className="text-[11px] text-slate-400 mt-1">Try resetting the search terms or language filter.</p>
          </div>
        ) : (
          filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="border border-slate-800 bg-[#0B101D] rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-cyan-400 border border-blue-500/30">
                      <FileCode className="h-4 w-4" />
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {proj.name}
                    </h3>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-cyan-300 border border-blue-800/40">
                    {proj.language}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {proj.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-400">Fixture: </span>
                    <span className="text-slate-300">{proj.fixtureName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Framework: </span>
                    <span className="text-slate-300">{proj.framework}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono">
                <button
                  onClick={() => onExploreProject(proj)}
                  className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>Explore Files</span>
                </button>

                <button
                  onClick={() => onSelectProject(proj)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded transition-colors shadow-sm"
                >
                  <span>Launch Task</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
