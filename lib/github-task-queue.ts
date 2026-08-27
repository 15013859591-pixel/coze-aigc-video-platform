import crypto from 'node:crypto';

export const runtime = 'nodejs';

const DEFAULT_BRANCH = 'codex/frontend-api-integration';
const DEFAULT_QUEUE_PATH = 'data/pending-tasks.json';
const GITHUB_API_BASE = 'https://api.github.com';

export type TaskQueueItem = {
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

export type SubmitTaskPayload = {
  videoTarget: string;
  sellingPointLevel1: string;
  sceneLevel1: string;
  sceneLevel2: string;
  targetAudience: string;
  videoDuration: string;
};

type GithubContentResponse = {
  sha: string;
  content?: string;
};

function getGithubConfig() {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const branch = process.env.GITHUB_BRANCH?.trim() || DEFAULT_BRANCH;

  if (!token) throw new Error('缺少服务端环境变量：GITHUB_TOKEN');
  if (!repo) throw new Error('缺少服务端环境变量：GITHUB_REPO');

  return { token, repo, branch };
}

function buildContentsUrl(path: string, branch: string, repo: string) {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${GITHUB_API_BASE}/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
}

function decodeGithubContent(content: string | undefined) {
  if (!content) return '[]';
  return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8');
}

function encodeGithubContent(content: string) {
  return Buffer.from(content, 'utf8').toString('base64');
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatYYMMDD(date: Date) {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = pad2(date.getUTCMonth() + 1);
  const dd = pad2(date.getUTCDate());
  return `${yy}${mm}${dd}`;
}

function randomSuffix() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

export function generateTaskId(now = new Date()) {
  return `GEN-${formatYYMMDD(now)}-${randomSuffix()}`;
}

export function validatePayload(body: unknown): SubmitTaskPayload {
  if (!body || typeof body !== 'object') throw new Error('请求体不能为空');
  const value = body as Partial<SubmitTaskPayload>;

  const requiredKeys: Array<keyof SubmitTaskPayload> = [
    'videoTarget',
    'sellingPointLevel1',
    'sceneLevel1',
    'sceneLevel2',
    'targetAudience',
    'videoDuration',
  ];

  for (const key of requiredKeys) {
    const current = value[key];
    if (typeof current !== 'string' || !current.trim()) {
      throw new Error(`字段 ${key} 不能为空`);
    }
  }

  return {
    videoTarget: value.videoTarget!.trim(),
    sellingPointLevel1: value.sellingPointLevel1!.trim(),
    sceneLevel1: value.sceneLevel1!.trim(),
    sceneLevel2: value.sceneLevel2!.trim(),
    targetAudience: value.targetAudience!.trim(),
    videoDuration: value.videoDuration!.trim(),
  };
}

export async function readTaskQueueFile(path = DEFAULT_QUEUE_PATH) {
  const { token, repo, branch } = getGithubConfig();
  const response = await fetch(buildContentsUrl(path, branch, repo), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`读取 GitHub 队列文件失败（HTTP ${response.status}）`);
  }

  const payload = (await response.json()) as GithubContentResponse;
  const text = decodeGithubContent(payload.content);
  const tasks = JSON.parse(text) as TaskQueueItem[];

  if (!Array.isArray(tasks)) {
    throw new Error('pending-tasks.json 不是数组格式');
  }

  return { sha: payload.sha, tasks, branch, repo, path };
}

export async function writeTaskQueueFile(options: {
  tasks: TaskQueueItem[];
  sha: string;
  message: string;
  path?: string;
}) {
  const { token, repo, branch } = getGithubConfig();
  const path = options.path || DEFAULT_QUEUE_PATH;
  const response = await fetch(`${GITHUB_API_BASE}/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({
      message: options.message,
      content: encodeGithubContent(`${JSON.stringify(options.tasks, null, 2)}\n`),
      sha: options.sha,
      branch,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`写入 GitHub 队列文件失败（HTTP ${response.status}）：${text}`);
  }
}

export function buildQueueTask(payload: SubmitTaskPayload, submittedAt = new Date()): TaskQueueItem {
  return {
    taskId: generateTaskId(submittedAt),
    submittedAt: submittedAt.toISOString(),
    status: '待执行',
    videoGoal: payload.videoTarget,
    featureTags: payload.sellingPointLevel1,
    scenePrimary: payload.sceneLevel1,
    sceneSecondary: payload.sceneLevel2,
    audience: payload.targetAudience,
    duration: payload.videoDuration,
  };
}
