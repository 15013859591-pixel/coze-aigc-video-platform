import { NextResponse } from 'next/server';

const STUDIO_URL = 'https://14978f6e5f5a.aime-app.bytedance.net';

type StudioTask = {
  title: string;
  listTitle: string;
  id: string;
  progress: number;
  status: string;
  pill: string;
  accent: string;
  brief: string;
  tags: string[];
};

function parseTasks(source: string): StudioTask[] {
  const tasks: StudioTask[] = [];
  const pattern = /\{ title: '([^']*)', listTitle: '([^']*)', id: '([^']*)', progress: (\d+), status: '([^']*)', pill: '([^']*)', accent: '([^']*)', brief: '([^']*)', tags: \[([^\]]*)\] \}/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const [, title, listTitle, id, progress, status, pill, accent, brief, rawTags] = match;
    tasks.push({
      title,
      listTitle,
      id,
      progress: Number(progress),
      status,
      pill,
      accent,
      brief,
      tags: Array.from(rawTags.matchAll(/'([^']*)'/g)).map((tag) => tag[1]),
    });
  }

  return tasks;
}

export async function GET() {
  try {
    const appJsUrl = `${STUDIO_URL}/app.js`;
    const response = await fetch(appJsUrl, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Studio app.js 返回 ${response.status}`);
    }

    const source = await response.text();
    const tasks = parseTasks(source);
    const primaryTask = tasks[0] ?? null;
    const approvedCount = tasks.filter((task) => task.progress >= 100 || task.pill === 'APPROVED').length;
    const runningCount = tasks.filter((task) => task.progress > 0 && task.progress < 100).length;
    const averageProgress = tasks.length
      ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
      : 0;

    return NextResponse.json({
      ok: true,
      source: STUDIO_URL,
      fetchedAt: new Date().toISOString(),
      tasks,
      primaryTask,
      metrics: {
        weeklyCapacity: '7 / 10',
        approvedCount,
        runningCount,
        averageProgress,
        goodCases: 148,
        badCases: 36,
        mechanisms: 320,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: STUDIO_URL,
        fetchedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 502 },
    );
  }
}
