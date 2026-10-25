/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AcceptanceCriterion {
  id: string;
  description: string;
  verified: boolean;
}

export interface TaskIntake {
  id: string;
  title: string;
  description: string;
  targetFixture: string;
  acceptanceCriteria: AcceptanceCriterion[];
  constraints: string[];
  allowedCommands: string[];
  preventDestructiveGit: boolean;
  isolationMode: 'worktree_jail' | 'process_sandbox';
}

export interface SecurityAuditResult {
  passed: boolean;
  isClean?: boolean;
  timestamp: string;
  checks: {
    rule: string;
    passed: boolean;
    details: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
  secretsSanitizedCount: number;
  injectionThreatsDetected: number;
}

export interface RepositoryHealth {
  score: number; // 0 - 100 based on deterministic rules
  totalFiles: number;
  linesOfCode: number;
  testFileCount: number;
  hasLockfile: boolean;
  hasTypeChecking: boolean;
  hasLinting: boolean;
  identifiedRisks: string[];
}

export interface PlanStep {
  id: string;
  order: number;
  phase: 'intake' | 'inspect' | 'plan' | 'patch' | 'test' | 'diagnose' | 'repair' | 'verify';
  title: string;
  description: string;
  targetFiles: string[];
  estimatedRisk: RiskLevel;
  requiresHumanApproval: boolean;
  status: 'pending' | 'approved' | 'running' | 'completed' | 'failed' | 'skipped';
  outputSummary?: string;
}

export interface SystemResourceMetrics {
  timestamp: string;
  cpuPercent: number;
  memoryRssMb: number;
  memoryHeapUsedMb: number;
  memoryHeapTotalMb: number;
  systemTotalMemMb: number;
  systemFreeMemMb: number;
  activeProcesses: number;
  sandboxMemoryLimitMb: number;
}

export interface SubprocessExecutionResult {
  id?: string;
  timestamp?: string;
  executedAt?: string;
  attemptNumber?: number; // 0 = initial, 1 = repair 1, 2 = repair 2
  command: string;
  args?: string[];
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  status?: 'passed' | 'failed' | 'timeout' | 'blocked_by_policy';
  timedOut?: boolean;
  resourceOverhead?: {
    peakMemoryMb: number;
    cpuUserMs: number;
    cpuSystemMs: number;
    memoryLimitMb: number;
  };
  telemetry?: {
    userCpuMicros?: number;
    sysCpuMicros?: number;
    memoryRssMb?: number;
    peakMemoryMb?: number;
  };
}

export interface DiagnosticTriage {
  id?: string;
  timestamp?: string;
  failureCategory?: 'assertion_mismatch' | 'edge_case_defect' | 'type_error' | 'runtime_crash' | 'timeout';
  failingTestName?: string;
  sourceFile?: string;
  errorSnippet?: string;
  rootCauseAnalysis?: string;
  proposedPatchStrategy?: string;
  repairAttempt?: number;
  targetFile?: string;
  failureType?: string;
  suggestedFix?: string;
  confidence?: number;
}

export interface PatchRecord {
  id: string;
  timestamp?: string;
  fileModified: string;
  unifiedDiff?: string;
  patchDiff?: string;
  explanation?: string;
  linesAdded?: number;
  linesRemoved?: number;
  repairAttempt?: number;
  appliedBy?: 'deterministic_engine' | 'gemini_proxy';
  appliedAt?: string;
  verifiedByTest?: boolean;
}

export interface EvidenceReport {
  id: string;
  taskId: string;
  taskTitle: string;
  generatedAt: string;
  finalStatus: 'VERIFIED_SUCCESS' | 'REPAIR_LIMIT_EXCEEDED' | 'REJECTED_BY_POLICY';
  totalDurationMs: number;
  repairAttemptsUsed: number;
  maxRepairLimit: number;
  patches: PatchRecord[];
  executionRuns: SubprocessExecutionResult[];
  diagnosticHistory: DiagnosticTriage[];
  acceptanceCriteria: AcceptanceCriterion[];
  manifestHash: string; // SHA-256 integrity checksum
  manifestSha256?: string; // Alias for manifestHash
  environmentMetadata: {
    nodeVersion: string;
    platform: string;
    reproducibilityTag: string;
    engineMode: 'deterministic_offline' | 'gemini_enhanced';
  };
}

export interface FixtureInfo {
  id: string;
  name: string;
  description: string;
  type: string;
  files: string[];
  defaultTaskTitle: string;
  defaultTaskDescription: string;
  failingTestFile: string;
  expectedFixFile: string;
}
