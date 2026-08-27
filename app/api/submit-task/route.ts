import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const FEISHU_AUTH_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';

type FeishuTenantTokenResponse = {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
};

type FeishuBitableCreateRecordResponse = {
  code: number;
  msg: string;
  data?: unknown;
};

type SubmitTaskPayload = {
  videoTarget: string;
  sellingPointLevel1: string;
  sceneLevel1: string;
  sceneLevel2: string;
  targetAudience: string;
  videoDuration: string;
};

type ApiResponse =
  | { success: true; taskId: string }
  | { success: false; error: string };

let cachedTenantToken: { token: string; expiresAtMs: number } | null = null;

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatYYMMDD(date: Date) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  return `${yy}${mm}${dd}`;
}

function generateTaskId(now: Date) {
  const random = crypto.randomInt(0, 10000);
  return `GEN-${formatYYMMDD(now)}-${String(random).padStart(4, '0')}`;
}

async function getTenantAccessToken(): Promise<string> {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('缺少服务端环境变量：FEISHU_APP_ID / FEISHU_APP_SECRET');
  }

  const now = Date.now();
  if (cachedTenantToken && cachedTenantToken.expiresAtMs - 60_000 > now) {
    return cachedTenantToken.token;
  }

  const response = await fetch(FEISHU_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    cache: 'no-store',
  });

  const data = (await response.json()) as FeishuTenantTokenResponse;

  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取 tenant_access_token 失败：${data.msg || `HTTP ${response.status}`}`);
  }

  const expiresInSec = Number(data.expire ?? 0);
  cachedTenantToken = {
    token: data.tenant_access_token,
    expiresAtMs: Date.now() + Math.max(expiresInSec, 0) * 1000,
  };

  return data.tenant_access_token;
}

async function createBitableRecord(payload: SubmitTaskPayload, taskId: string, submittedAt: Date) {
  const appToken = process.env.FEISHU_APP_TOKEN;
  if (!appToken) throw new Error('缺少服务端环境变量：FEISHU_APP_TOKEN');

  const tableId = 'tblYFCgknpkU2AMA';
  const tenantToken = await getTenantAccessToken();

  const fields = {
    '任务ID': taskId,
    '提交时间': submittedAt.toISOString(),
    '任务状态': '待执行',
    '视频目标': payload.videoTarget,
    '功能卖点一级标签': payload.sellingPointLevel1,
    '素材场景一级标签': payload.sceneLevel1,
    '素材场景二级标签': payload.sceneLevel2,
    '目标人群': payload.targetAudience,
    '视频时长': payload.videoDuration,
  };

  const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(appToken)}/tables/${encodeURIComponent(tableId)}/records`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tenantToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ fields }),
    cache: 'no-store',
  });

  const data = (await response.json()) as FeishuBitableCreateRecordResponse;

  if (!response.ok || data.code !== 0) {
    throw new Error(`写入飞书多维表格失败：${data.msg || `HTTP ${response.status}`}`);
  }

  return data;
}

function validatePayload(body: unknown): SubmitTaskPayload {
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
    const v = value[key];
    if (typeof v !== 'string' || !v.trim()) {
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const payload = validatePayload(body);

    const submittedAt = new Date();
    const taskId = generateTaskId(submittedAt);

    await createBitableRecord(payload, taskId, submittedAt);

    return NextResponse.json<ApiResponse>({ success: true, taskId });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
