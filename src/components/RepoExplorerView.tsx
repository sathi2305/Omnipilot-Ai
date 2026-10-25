/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  FolderTree, 
  Save, 
  RotateCcw, 
  Check, 
  FilePlus, 
  Lock, 
  Eye, 
  Edit3 
} from 'lucide-react';

interface RepoExplorerViewProps {
  sessionId: string;
  taskId?: string;
  files: { path: string; size: number; isTest: boolean }[];
  onFileSaved?: () => void;
}

export const RepoExplorerView: React.FC<RepoExplorerViewProps> = ({
  sessionId,
  taskId,
  files,
  onFileSaved,
}) => {
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.path || 'src/collection.mjs');
  const [fileContent, setFileContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0].path);
    }
  }, [files]);

  useEffect(() => {
    if (!selectedFile || !sessionId) return;
    const fetchContent = async () => {
      try {
        const url = taskId 
          ? `/api/tasks/${taskId}/file-content?path=${encodeURIComponent(selectedFile)}`
          : `/api/tasks/fake/file-content?path=${encodeURIComponent(selectedFile)}`;
        
        // Use readWorkspaceFile endpoint via task or direct fetch
        const res = await fetch(`/api/tasks/${taskId || 'current'}/file-content?path=${encodeURIComponent(selectedFile)}`);
        if (res.ok) {
          const data = await res.json();
          setFileContent(data.content);
          setOriginalContent(data.content);
        }
      } catch (err) {
        console.error('Failed to load file content:', err);
      }
    };

    fetchContent();
  }, [selectedFile, sessionId, taskId]);

  const handleSave = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId || 'current'}/file-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: fileContent }),
      });
      if (res.ok) {
        setOriginalContent(fileContent);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        if (onFileSaved) onFileSaved();
      }
    } catch (err) {
      console.error('Failed to save file content:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = () => {
    setFileContent(originalContent);
  };

  const isDirty = fileContent !== originalContent;
  const lines = fileContent.split('\n');

  return (
    <div className="border border-slate-800 bg-[#0B101D] rounded-xl overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Explorer Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#080C16] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <FolderTree className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-white">Repository Explorer</span>
            <span className="text-slate-600">/</span>
            <span className="text-cyan-300 font-mono">{selectedFile}</span>
            {isDirty && (
              <span className="h-2 w-2 rounded-full bg-amber-400" title="Unsaved modifications" />
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-2.5 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${
              isEditing ? 'bg-blue-600/30 text-cyan-300 border border-blue-500/40' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            {isEditing ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{isEditing ? 'Editor Active' : 'View Mode'}</span>
          </button>

          {isDirty && (
            <button
              onClick={handleRevert}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded transition-colors"
            >
              Revert
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saveSuccess ? (
              <>
                <Check className="h-3 w-3 text-emerald-300" />
                <span>Saved</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="h-3 w-3" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split: File Tree (Left) vs Code Editor (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File Tree Rail */}
        <div className="w-64 border-r border-slate-800 bg-[#070B14] p-3 overflow-y-auto space-y-1 shrink-0">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1">
            Workspace Files ({files.length})
          </div>

          {files.map((file) => {
            const isSelected = file.path === selectedFile;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-all text-left ${
                  isSelected
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/30 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className={`h-3.5 w-3.5 shrink-0 ${file.isTest ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="truncate">{file.path}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                  {Math.round(file.size / 102.4) / 10}k
                </span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 px-2 space-y-1 font-mono">
            <div>• Read/Write Sandboxed</div>
            <div>• Path Traversal Guarded</div>
          </div>
        </div>

        {/* Right: Code Viewer / Editor */}
        <div className="flex-1 flex flex-col bg-[#05080F] overflow-hidden">
          {isEditing ? (
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full h-full p-4 font-mono text-xs text-slate-200 bg-transparent focus:outline-none resize-none leading-relaxed selection:bg-cyan-900/60"
              spellCheck={false}
            />
          ) : (
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed divide-y divide-slate-900/30">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-4 hover:bg-slate-900/40 py-0.5">
                  <span className="w-8 text-[11px] text-slate-400 select-none text-right shrink-0 tabular-nums font-mono">
                    {idx + 1}
                  </span>
                  <pre className="m-0 font-mono text-slate-300 whitespace-pre overflow-x-auto flex-1">
                    {line || ' '}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Editor Status Bar */}
          <div className="h-7 px-4 bg-[#080C16] border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-3">
              <span>Lines: {lines.length}</span>
              <span>·</span>
              <span>Encoding: UTF-8</span>
              <span>·</span>
              <span className={isDirty ? 'text-amber-400' : 'text-slate-400'}>
                {isDirty ? 'Modified' : 'Clean'}
              </span>
            </div>
            <div>
              <span>Language: {selectedFile.endsWith('.ts') ? 'TypeScript' : selectedFile.endsWith('.mjs') || selectedFile.endsWith('.js') ? 'JavaScript' : selectedFile.endsWith('.json') ? 'JSON' : 'Markdown'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
