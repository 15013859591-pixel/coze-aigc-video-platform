import { NextResponse, type NextRequest } from 'next/server';
import {
  buildQueueTask,
  readTaskQueueFile,
  validatePayload,
  writeTaskQueueFile,
} from '../../../lib/github-task-queue';

export const runtime = 'nodejs';

type ApiResponse =
  | { success: true; taskId: string }
  | { success: false; error: string };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const payload = validatePayload(body);
    const { tasks, sha, path } = await readTaskQueueFile();
    const nextTask = buildQueueTask(payload);

    await writeTaskQueueFile({
      tasks: [...tasks, nextTask],
      sha,
      path,
      message: `chore(queue): append task ${nextTask.taskId}`,
    });

    return NextResponse.json<ApiResponse>({ success: true, taskId: nextTask.taskId });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
