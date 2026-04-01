import type { PipelineEvent } from '../../shared/types';

export type ProviderId = string;
export type ChatMode = 'new' | 'continue';

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  builtin: boolean;
}

export interface Account {
  id: string;
  provider: ProviderId;
  label: string;
  profileDir: string;
  quotaExhausted: boolean;
  quotaResetAt?: string;
}

export interface ModelOption {
  id: string;
  label: string;
  selectSteps?: string[];
}

export interface TaskItem {
  id: string;
  question: string;
  preferredProvider?: ProviderId;
  preferredModel?: string;
  attachments?: string[];
  status: 'pending' | 'running' | 'done' | 'failed';
  answer?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  accountId?: string;
}

export interface WorkbenchState {
  accounts: Account[];
  tasks: TaskItem[];
  isRunning: boolean;
  chatMode: ChatMode;
  providers: ProviderInfo[];
  detectedModels: Partial<Record<ProviderId, ModelOption[]>>;
  currentTaskId?: string;
  activeAccountId?: string;
  /** Account IDs that currently have a login browser open. */
  loginOpenAccountIds: string[];
}

export type WorkbenchEvent =
  | { type: 'state'; payload: WorkbenchState }
  | { type: 'task_started'; payload: { taskId: string; accountId: string } }
  | { type: 'task_done'; payload: { taskId: string; answer: string } }
  | { type: 'task_failed'; payload: { taskId: string; error: string } }
  | { type: 'quota_exhausted'; payload: { accountId: string } }
  | { type: 'account_switched'; payload: { fromAccountId: string; toAccountId: string } }
  | { type: 'login_browser_opened'; payload: { accountId: string } }
  | { type: 'login_browser_closed'; payload: { accountId: string } }
  | { type: 'stopped'; payload: Record<string, never> }
  // Pipeline events (re-use PipelineEvent union members)
  | PipelineEvent;

/* ---- Pipeline types (single source of truth: shared/types.ts) ---- */

export type {
  PipelineStage,
  ProcessStatus,
  QualityTier,
  ModelOverride,
  ModelOverrides,
  LogEntry as PipelineLogEntry,
  PipelineScene,
  PipelineProject,
  PipelineEvent,
} from '../../shared/types';

/* ---- Settings types ---- */

export interface EnvironmentStatus {
  ffmpegAvailable: boolean;
  edgeTtsAvailable: boolean;
  playwrightAvailable: boolean;
  nodeVersion: string;
  platform: string;
  dataDir: string;
}

export interface TTSSettings {
  voice?: string;
  rate?: string;
  pitch?: string;
}

export interface VideoProviderConfig {
  url: string;
  promptInput: string;
  imageUploadTrigger?: string;
  generateButton: string;
  progressIndicator?: string;
  videoResult: string;
  downloadButton?: string;
  maxWaitMs?: number;
  profileDir: string;
}
