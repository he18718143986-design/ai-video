/* ------------------------------------------------------------------ */
/*  Shared types — used by both backend (src/) and frontend (ui/) */
/* ------------------------------------------------------------------ */

/* ---- Pipeline enums ---- */

export type PipelineStage =
  | 'CAPABILITY_ASSESSMENT'
  | 'STYLE_EXTRACTION'
  | 'RESEARCH'
  | 'NARRATIVE_MAP'
  | 'SCRIPT_GENERATION'
  | 'QA_REVIEW'
  | 'STORYBOARD'
  | 'REFERENCE_IMAGE'
  | 'KEYFRAME_GEN'
  | 'VIDEO_GEN'
  | 'TTS'
  | 'ASSEMBLY'
  | 'REFINEMENT';

export type ProcessStatus = 'pending' | 'processing' | 'completed' | 'error';

export type QualityTier = 'free' | 'balanced' | 'premium';

/* ---- Model override (per-task-type manual selection) ---- */

export interface ModelOverride {
  adapter: 'chat' | 'api';
  model?: string;
  provider?: string;
}

export type ModelOverrides = Partial<Record<string, ModelOverride>>;

/* ---- Log entry ---- */

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  stage?: PipelineStage;
}

/* ---- Scene (UI-safe subset) ---- */

export interface PipelineScene {
  id: string;
  number: number;
  narrative: string;
  visualPrompt: string;
  estimatedDuration: number;
  assetUrl?: string;
  assetType: 'image' | 'video' | 'placeholder';
  audioUrl?: string;
  referenceImageUrl?: string;
  status: 'pending' | 'generating' | 'done' | 'error' | 'pending_review';
  reviewStatus?: 'pending' | 'pending_review' | 'approved' | 'rejected';
  progressMessage?: string;
}

/* ---- Pipeline project (UI-safe view) ---- */

export interface PipelineProject {
  id: string;
  title: string;
  topic: string;
  qualityTier: QualityTier;
  createdAt: string;
  updatedAt: string;
  currentStage?: PipelineStage;
  stageStatus: Record<PipelineStage, ProcessStatus>;
  pauseAfterStages?: PipelineStage[];
  isPaused?: boolean;
  pausedAtStage?: PipelineStage;
  scenes?: PipelineScene[];
  scriptOutput?: { scriptText: string; [key: string]: any };
  /** QA review result (human or AI) */
  qaReviewResult?: {
    approved: boolean;
    feedback?: string;
    scores?: { accuracy: number; styleConsistency: number; engagement: number; overall: number };
    issues?: string[];
  };
  /** Reference style-anchor images */
  referenceImages?: string[];
  logs: LogEntry[];
  error?: string;
  finalVideoPath?: string;
  modelOverrides?: ModelOverrides;
}

/* ---- Pipeline events (SSE) ---- */

export type PipelineEvent =
  | { type: 'pipeline_created'; payload: { projectId: string } }
  | { type: 'pipeline_stage'; payload: { projectId: string; stage: PipelineStage; status: ProcessStatus; progress?: number } }
  | { type: 'pipeline_artifact'; payload: { projectId: string; stage: PipelineStage; artifactType: string; summary?: string } }
  | { type: 'pipeline_log'; payload: { projectId: string; entry: LogEntry } }
  | { type: 'pipeline_error'; payload: { projectId: string; stage: PipelineStage; error: string } }
  | { type: 'pipeline_complete'; payload: { projectId: string } }
  | { type: 'pipeline_paused'; payload: { projectId: string; stage: PipelineStage } }
  | { type: 'pipeline_resumed'; payload: { projectId: string; stage: PipelineStage } }
  | { type: 'pipeline_scene_review'; payload: { projectId: string; sceneId: string; status: string } }
  | { type: 'pipeline_assembly_progress'; payload: { projectId: string; percent: number; message: string } };
