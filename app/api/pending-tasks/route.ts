import { NextResponse } from 'next/server';
import { readTaskQueueFile } from '../../../lib/github-task-queue';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { tasks, branch, repo, path } = await readTaskQueueFile();
    return NextResponse.json({
      success: true,
      tasks,
      meta: {
        repo,
        branch,
        path,
        count: tasks.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
