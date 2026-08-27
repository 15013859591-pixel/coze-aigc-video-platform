export type SubmitTaskPayload = {
  videoTarget: string;
  sellingPointLevel1: string;
  sceneLevel1: string;
  sceneLevel2: string;
  targetAudience: string;
  videoDuration: string;
};

export type SubmitTaskResponse =
  | { success: true; taskId: string }
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
