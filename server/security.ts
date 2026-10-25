/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

// Command Allowlist: strict list of permissible commands and arguments
export const ALLOWED_COMMAND_PATTERNS = [
  /^npm (test|run test|run lint|run build)$/,
  /^node --test( [a-zA-Z0-9_\-\.\/]+)?$/,
  /^npx vitest run( [a-zA-Z0-9_\-\.\/]+)?$/,
  /^git (status|diff|log -n \d+)$/,
  /^echo '[^']*'$/,
];

// Sensitive environment variable patterns to strip from child process execution
const SENSITIVE_ENV_KEYS = [
  'GEMINI_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'GITHUB_TOKEN',
  'GH_TOKEN',
  'NPM_TOKEN',
  'SECRET',
  'PRIVATE_KEY',
  'PASSWORD',
  'SSH_AUTH_SOCK',
];

// Prompt injection & malicious intent patterns in repository comments or task text
const PROMPT_INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/i,
  /disregard system policy/i,
  /bypass (security|safety) (checks|controls)/i,
  /send .* to http[s]?:\/\//i,
  /curl\s+-X\s+POST/i,
  /wget\s+/i,
  /rm\s+-rf\s+[\/~]/i,
  /cat\s+\/etc\/passwd/i,
  /export\s+GEMINI_API_KEY/i,
];

export function sanitizeEnvironment(env: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const sanitized: NodeJS.ProcessEnv = {
    PATH: env.PATH,
    NODE_ENV: 'test',
    HOME: env.HOME,
    TMPDIR: env.TMPDIR,
    LANG: 'en_US.UTF-8',
  };

  for (const [key, value] of Object.entries(env)) {
    const isSensitive = SENSITIVE_ENV_KEYS.some((sensitive) =>
      key.toUpperCase().includes(sensitive)
    );
    if (!isSensitive && !sanitized[key]) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function validateCommand(commandStr: string): { allowed: boolean; reason?: string } {
  const trimmed = commandStr.trim();
  
  // Check for command chaining and shell injections
  if (/([;&|`]|&&|\|\||\$\()/.test(trimmed)) {
    return {
      allowed: false,
      reason: 'Command chaining, pipes, and shell subshells are strictly prohibited for sandbox safety.',
    };
  }

  const matches = ALLOWED_COMMAND_PATTERNS.some((pattern) => pattern.test(trimmed));
  if (!matches) {
    return {
      allowed: false,
      reason: `Command "${trimmed}" is not in the allowlist. Only safe test runners and git audit commands are permitted.`,
    };
  }

  return { allowed: true };
}

export function validateSafePath(workspaceRoot: string, targetRelativePath: string): { safe: boolean; resolvedPath?: string; error?: string } {
  const normalizedRoot = path.resolve(workspaceRoot);
  const resolved = path.resolve(normalizedRoot, targetRelativePath);

  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    return {
      safe: false,
      error: `Path traversal attempt detected. Target path "${targetRelativePath}" escapes the workspace boundary.`,
    };
  }

  // Prevent accessing hidden sensitive files
  const baseName = path.basename(resolved);
  if (baseName.startsWith('.env') || baseName === '.git-credentials' || baseName === 'id_rsa') {
    return {
      safe: false,
      error: `Access to sensitive file "${baseName}" is blocked by system safety policy.`,
    };
  }

  return { safe: true, resolvedPath: resolved };
}

export function auditTextForThreats(content: string): { threatsFound: string[] } {
  const threats: string[] = [];
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      threats.push(`Detected suspicious pattern matching: ${pattern.toString()}`);
    }
  }
  return { threatsFound: threats };
}
