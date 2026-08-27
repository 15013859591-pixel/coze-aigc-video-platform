import { NextResponse, type NextRequest } from 'next/server';
import { readTaskQueueFile, writeTaskQueueFile } from '../../../lib/github-task-queue';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { taskId?: string };
    const taskId = body.taskId?.trim();

    if (!taskId) {
      return NextResponse.json({ success: false, error: 'taskId 不能为空' }, { status: 400 });
    }

    const { tasks, sha, path } = await readTaskQueueFile();
    const remaining = tasks.filter((task) => task.taskId !== taskId);

    if (remaining.length === tasks.length) {
      return NextResponse.json({ success: false, error: '未找到对应任务' }, { status: 404 });
    }

    await writeTaskQueueFile({
      tasks: remaining,
      sha,
      path,
      message: `chore(queue): remove task ${taskId}`,
    });

    return NextResponse.json({ success: true, taskId });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
