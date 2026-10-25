/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { validateSafePath } from './security.ts';

const WORKSPACE_BASE_DIR = path.resolve(process.cwd(), '.omnipilot_workspaces');

export interface WorkspaceSession {
  sessionId: string;
  workspacePath: string;
  originalFixturePath: string;
  createdAt: string;
  activePatches: {
    filePath: string;
    originalContent: string;
    modifiedContent: string;
  }[];
}

const activeSessions = new Map<string, WorkspaceSession>();

export async function ensureBaseWorkspaceDir(): Promise<void> {
  if (!fsSync.existsSync(WORKSPACE_BASE_DIR)) {
    await fs.mkdir(WORKSPACE_BASE_DIR, { recursive: true });
  }
}

export async function createIsolatedWorkspace(fixtureName: string = 'data-kit-ts'): Promise<WorkspaceSession> {
  await ensureBaseWorkspaceDir();

  const sessionId = `ops_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const workspacePath = path.join(WORKSPACE_BASE_DIR, sessionId);
  const fixturePath = path.resolve(process.cwd(), 'fixtures', fixtureName);

  if (!fsSync.existsSync(fixturePath)) {
    throw new Error(`Fixture "${fixtureName}" not found at ${fixturePath}`);
  }

  // Recursive copy fixture into isolated workspace directory
  await copyDirectoryRecursive(fixturePath, workspacePath);

  const session: WorkspaceSession = {
    sessionId,
    workspacePath,
    originalFixturePath: fixturePath,
    createdAt: new Date().toISOString(),
    activePatches: [],
  };

  activeSessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): WorkspaceSession | undefined {
  return activeSessions.get(sessionId);
}

export async function listWorkspaceFiles(sessionId: string): Promise<{ path: string; size: number; isTest: boolean }[]> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const results: { path: string; size: number; isTest: boolean }[] = [];

  async function walk(currentDir: string, relativeDir: string = '') {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.join(relativeDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        const isTest = relPath.includes('test') || relPath.endsWith('.spec.ts') || relPath.endsWith('.test.mjs');
        results.push({ path: relPath, size: stats.size, isTest });
      }
    }
  }

  await walk(session.workspacePath);
  return results;
}

export async function readWorkspaceFile(sessionId: string, relativeFilePath: string): Promise<string> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const pathCheck = validateSafePath(session.workspacePath, relativeFilePath);
  if (!pathCheck.safe || !pathCheck.resolvedPath) {
    throw new Error(pathCheck.error || 'Invalid file path');
  }

  return await fs.readFile(pathCheck.resolvedPath, 'utf8');
}

export async function writeWorkspaceFile(sessionId: string, relativeFilePath: string, newContent: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const pathCheck = validateSafePath(session.workspacePath, relativeFilePath);
  if (!pathCheck.safe || !pathCheck.resolvedPath) {
    throw new Error(pathCheck.error || 'Invalid file path');
  }

  let originalContent = '';
  if (fsSync.existsSync(pathCheck.resolvedPath)) {
    originalContent = await fs.readFile(pathCheck.resolvedPath, 'utf8');
  }

  await fs.writeFile(pathCheck.resolvedPath, newContent, 'utf8');

  // Track patch history
  const existingPatchIdx = session.activePatches.findIndex((p) => p.filePath === relativeFilePath);
  if (existingPatchIdx >= 0) {
    session.activePatches[existingPatchIdx].modifiedContent = newContent;
  } else {
    session.activePatches.push({
      filePath: relativeFilePath,
      originalContent,
      modifiedContent: newContent,
    });
  }
}

export function generateUnifiedDiff(originalStr: string, modifiedStr: string, fileName: string): string {
  const originalLines = originalStr.split('\n');
  const modifiedLines = modifiedStr.split('\n');

  let diff = `--- a/${fileName}\n+++ b/${fileName}\n`;
  let hasDiff = false;

  // Simple line-by-line diff generator
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  for (let i = 0; i < maxLines; i++) {
    const oLine = originalLines[i];
    const mLine = modifiedLines[i];

    if (oLine !== mLine) {
      hasDiff = true;
      if (oLine !== undefined) {
        diff += `- ${oLine}\n`;
      }
      if (mLine !== undefined) {
        diff += `+ ${mLine}\n`;
      }
    } else {
      if (oLine !== undefined) {
        diff += `  ${oLine}\n`;
      }
    }
  }

  return hasDiff ? diff : '';
}

export async function getSessionDiff(sessionId: string): Promise<{ file: string; diff: string; linesAdded: number; linesRemoved: number }[]> {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const results: { file: string; diff: string; linesAdded: number; linesRemoved: number }[] = [];

  for (const patch of session.activePatches) {
    const diff = generateUnifiedDiff(patch.originalContent, patch.modifiedContent, patch.filePath);
    const linesAdded = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
    const linesRemoved = diff.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')).length;

    results.push({
      file: patch.filePath,
      diff,
      linesAdded,
      linesRemoved,
    });
  }

  return results;
}

export async function cleanupWorkspace(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (session && fsSync.existsSync(session.workspacePath)) {
    await fs.rm(session.workspacePath, { recursive: true, force: true });
    activeSessions.delete(sessionId);
  }
}

async function copyDirectoryRecursive(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
