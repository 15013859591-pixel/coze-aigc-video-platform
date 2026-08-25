export type NodeStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type JobStage =
  | 'CREATED'
  | 'CASE_RETRIEVAL'
  | 'FORMULA_MATCHING'
  | 'SCRIPT_GENERATING'
  | 'SCRIPT_SCORING'
  | 'UI_PLANNING'
  | 'UI_EXECUTING'
  | 'VIDEO_GENERATING'
  | 'COMPOSITING'
  | 'VIDEO_QA'
  | 'REVIEW_SUBMITTING'
  | 'COMPLETED';

export interface GenerationJobCreate {
  objective: string;
  feature: string;
  selling_point: string;
  scene: string;
  audience: string;
  channel: string;
  duration_seconds: number;
  aspect_ratio: string;
  video_structure: string;
  ui_depth: string;
  candidate_count: number;
  challenger_ratio: number;
  require_real_ui: boolean;
  auto_submit_review: boolean;
}

export interface GenerationJob {
  job_id: string;
  status: NodeStatus;
  stage: JobStage;
  progress: number;
  message: string;
  request: GenerationJobCreate;
  created_at: string;
  updated_at: string;
}

export interface JobEvent {
  event_id: string;
  job_id: string;
  stage: JobStage;
  node_status: NodeStatus;
  progress: number;
  message: string;
  occurred_at: string;
}

export interface TimelineClip {
  shot_id: string;
  start_ms: number;
  end_ms: number;
  ui_use_case_id: string | null;
  recording_asset_id: string | null;
  composition_mode: 'fullscreen' | 'picture_in_picture' | 'split_screen' | 'overlay';
}

export interface Timeline {
  job_id: string;
  version: number;
  duration_ms: number;
  clips: TimelineClip[];
  updated_at: string;
}

export interface ActionResponse {
  job_id: string;
  accepted: boolean;
  stage: JobStage;
  status: NodeStatus;
  message: string;
}

export interface MediaAsset {
  asset_id: string;
  type: 'script' | 'voiceover' | 'screen_recording' | 'video' | 'thumbnail';
  url: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ReviewSubmissionResponse {
  job_id: string;
  submission_id: string;
  status: 'SUBMITTED' | 'MOCK_SUBMITTED';
  message: string;
  submitted_at: string;
}

export const DEFAULT_AIME_API_BASE_URL =
  'https://swing-legitimate-losses-functioning.trycloudflare.com';

const configuredBaseUrl = (
  process.env.NEXT_PUBLIC_AIME_API_BASE_URL || DEFAULT_AIME_API_BASE_URL
).replace(/\/$/, '');

export const aimeApiBaseUrl = configuredBaseUrl;
export const isAimeApiConfigured = Boolean(configuredBaseUrl);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!configuredBaseUrl) throw new Error('尚未配置 NEXT_PUBLIC_AIME_API_BASE_URL');
  const response = await fetch(`${configuredBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json() as { detail?: string };
      detail = body.detail ?? detail;
    } catch {
      // Keep the HTTP status when the response body is not JSON.
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export const aimeApi = {
  createJob: (payload: GenerationJobCreate) => request<GenerationJob>('/v1/generation-jobs', { method: 'POST', body: JSON.stringify(payload) }),
  getJob: (jobId: string) => request<GenerationJob>(`/v1/generation-jobs/${jobId}`),
  getTimeline: (jobId: string) => request<Timeline>(`/v1/generation-jobs/${jobId}/timeline`),
  updateTimeline: (jobId: string, baseVersion: number, clips: TimelineClip[]) => request<Timeline>(`/v1/generation-jobs/${jobId}/timeline`, {
    method: 'PATCH',
    body: JSON.stringify({ base_version: baseVersion, clips }),
  }),
  retry: (jobId: string) => request<ActionResponse>(`/v1/generation-jobs/${jobId}/actions/retry`, { method: 'POST' }),
  render: (jobId: string) => request<ActionResponse>(`/v1/generation-jobs/${jobId}/actions/render`, { method: 'POST' }),
  getMedia: async (jobId: string) => {
    const response = await request<{ job_id: string; items: MediaAsset[] }>(`/v1/generation-jobs/${jobId}/media`);
    return response.items;
  },
  submitReview: (jobId: string, reviewer: string, notes: string) => request<ReviewSubmissionResponse>(`/v1/generation-jobs/${jobId}/review-submissions`, {
    method: 'POST',
    body: JSON.stringify({ reviewer, notes, submit_to_feishu: false }),
  }),
  subscribe(jobId: string, onEvent: (event: JobEvent) => void, onError: () => void) {
    if (!configuredBaseUrl) return () => undefined;
    const source = new EventSource(`${configuredBaseUrl}/v1/generation-jobs/${jobId}/events`);
    source.addEventListener('progress', (message) => onEvent(JSON.parse((message as MessageEvent).data) as JobEvent));
    source.onerror = () => {
      source.close();
      onError();
    };
    return () => source.close();
  },
};
