export type SubmitTaskPayload = {
  videoTarget: string;
  sellingPointLevel1: string;
  sceneLevel1: string;
  sceneLevel2: string;
  targetAudience: string;
  videoDuration: string;
};

export type QueueTask = {
  taskId: string;
  submittedAt: string;
  status: '待执行';
  videoGoal: string;
  featureTags: string;
  scenePrimary: string;
  sceneSecondary: string;
  audience: string;
  duration: string;
};

export type SubmitTaskResponse =
  | { success: true; taskId: string }
  | { success: false; error: string };

export type PendingTasksResponse =
  | {
      success: true;
      tasks: QueueTask[];
      meta: { repo: string; branch: string; path: string; count: number };
    }
  | { success: false; error: string };

export async function submitTask(payload: SubmitTaskPayload): Promise<SubmitTaskResponse> {
  const response = await fetch('/api/submit-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as SubmitTaskResponse;

  if (!response.ok) {
    return {
      success: false,
      error: (data as { error?: string }).error ?? `请求失败（HTTP ${response.status}）`,
    };
  }

  return data;
}

export async function listPendingTasks(): Promise<PendingTasksResponse> {
  const response = await fetch('/api/pending-tasks', {
    method: 'GET',
    cache: 'no-store',
  });

  const data = (await response.json()) as PendingTasksResponse;

  if (!response.ok) {
    return {
      success: false,
      error: (data as { error?: string }).error ?? `请求失败（HTTP ${response.status}）`,
    };
  }

  return data;
}
