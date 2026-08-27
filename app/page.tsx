'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listPendingTasks,
  submitTask,
  type QueueTask,
  type SubmitTaskPayload,
} from '../lib/task-queue-client';

const videoTargetOptions = ['高点击', '高付费', '高留存', '付费 × 次留双高'];

// 功能卖点一级标签 — 来源：飞书多维表格「爆款素材拆解」字段 fldNQk4gL7
const sellingPointLevel1Options = [
  '视频任务',
  '综合功能3.0',
  'Excel任务',
  '项目管理',
  '编程项目',
  '云设备',
  'PPT任务',
  '综合功能2.5',
  'AI团队',
  '主agent-拟人心智',
  '新建Agent',
  '技能商店',
  '写作任务',
  '日程管理',
  '综合功能',
  '设计任务',
];

// 素材场景一级标签 — 来源：飞书多维表格「爆款素材拆解」字段 fldSJFjLZp
const sceneLevel1Options = [
  'AI团队',
  '专业领域与科研',
  '交通出行',
  '内容创作与AI办公',
  '创业与商业变现',
  '办公/商务',
  '办公/理财',
  '办公/科技',
  '办公场景',
  '室内办公场景',
  '无场景',
  '泛生活与个人成长',
  '电商与广告营销',
  '电商办公',
  '网文与创作',
  '职场',
  '职场/专家办公场景',
  '职场/商务',
  '职场办公',
  '职场办公场景',
  '职场工作场景',
  '自媒体与内容创作',
  '虚拟背景演示',
];

// 素材场景二级标签 — 根据一级标签联动，来源：飞书多维表格记录中的实际配对
const sceneLevel2OptionsByL1: Record<string, string[]> = {
  AI团队: ['AI团队/多Agent协作'],
  专业领域与科研: ['代码与研发', '职场提效', '财务与合规', '金融与理财'],
  交通出行: ['高铁车厢'],
  内容创作与AI办公: ['Excel/数据报表分析'],
  创业与商业变现: ['一人公司', '个体户', '游戏开发', '电商'],
  '办公/商务': ['客户管理/协同办公'],
  '办公/理财': ['炒股复盘/自动化工具'],
  '办公/科技': ['多Agent协作界面'],
  办公场景: ['会议/项目管理', '工位'],
  室内办公场景: ['居家/工作室'],
  无场景: ['无场景'],
  泛生活与个人成长: ['个人提效', '个人求职'],
  电商与广告营销: ['AI团队/多Agent协作', '电商主图/广告设计', '自媒体内容运营'],
  电商办公: ['营销短视频创作'],
  网文与创作: ['自媒体'],
  职场: ['办公室内'],
  '职场/专家办公场景': ['AI开发实操演示'],
  '职场/商务': ['楼梯/办公室'],
  职场办公: ['个人提升', '办公室', '项目管理'],
  职场办公场景: ['个人提升', '职场办公场景', '自媒体'],
  职场工作场景: ['述职报告准备'],
  自媒体与内容创作: ['AI漫剧与短剧', '广告营销', '网文与创作', '职场提效', '自媒体'],
  虚拟背景演示: ['产品UI演示+矢量插画'],
};

// 全部二级标签（用于无对应关系时的兜底展示）
const allSceneLevel2Options = Array.from(
  new Set(Object.values(sceneLevel2OptionsByL1).flat()),
).sort();

const audienceOptions = ['内容运营 / 创作者', '团队管理者', '知识工作者', '增长负责人'];
const durationOptions = ['15 秒', '30 秒', '45 秒', '60 秒'];

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function Home() {
  const [form, setForm] = useState<SubmitTaskPayload>({
    videoTarget: videoTargetOptions[0],
    sellingPointLevel1: sellingPointLevel1Options[0],
    sceneLevel1: sceneLevel1Options[0],
    sceneLevel2: sceneLevel2OptionsByL1[sceneLevel1Options[0]]?.[0] ?? allSceneLevel2Options[0],
    targetAudience: audienceOptions[0],
    videoDuration: durationOptions[1],
  });
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sceneLevel2Options = useMemo(() => {
    return sceneLevel2OptionsByL1[form.sceneLevel1] ?? allSceneLevel2Options;
  }, [form.sceneLevel1]);

  const refreshTasks = async () => {
    setLoading(true);
    const result = await listPendingTasks();
    if (result.success) {
      setTasks(result.tasks);
    } else {
      setMessage(`读取队列失败：${result.error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshTasks();
  }, []);

  const onSubmit = async () => {
    setSubmitting(true);
    setMessage('正在提交任务…');

    const result = await submitTask(form);

    if (result.success) {
      setMessage(`任务已提交，任务ID: ${result.taskId}`);
      await refreshTasks();
    } else {
      setMessage(`提交失败：${result.error}`);
    }

    setSubmitting(false);
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24, display: 'grid', gap: 24 }}>
      <section>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>扣子广告素材视频自动化 · 任务提交</h1>
        <p style={{ color: '#666', marginBottom: 20 }}>
          页面只负责收集参数并写入 GitHub 仓库里的 JSON 队列文件。Aime 定时任务后续读取
          <code style={{ margin: '0 4px' }}>/api/pending-tasks</code>
          即可继续把任务写入飞书并执行生成链路。
        </p>
      </section>

      <section style={{ display: 'grid', gap: 14 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>视频目标</span>
          <select value={form.videoTarget} onChange={(e) => setForm((cur) => ({ ...cur, videoTarget: e.target.value }))}>
            {videoTargetOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>功能卖点一级标签</span>
          <select value={form.sellingPointLevel1} onChange={(e) => setForm((cur) => ({ ...cur, sellingPointLevel1: e.target.value }))}>
            {sellingPointLevel1Options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>素材场景一级标签</span>
            <select
              value={form.sceneLevel1}
              onChange={(e) => {
                const nextL1 = e.target.value;
                const nextL2 = sceneLevel2OptionsByL1[nextL1]?.[0] ?? allSceneLevel2Options[0];
                setForm((cur) => ({ ...cur, sceneLevel1: nextL1, sceneLevel2: nextL2 }));
              }}
            >
              {sceneLevel1Options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>场景二级标签</span>
            <select value={form.sceneLevel2} onChange={(e) => setForm((cur) => ({ ...cur, sceneLevel2: e.target.value }))}>
              {sceneLevel2Options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>目标人群</span>
            <select value={form.targetAudience} onChange={(e) => setForm((cur) => ({ ...cur, targetAudience: e.target.value }))}>
              {audienceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>视频时长</span>
            <select value={form.videoDuration} onChange={(e) => setForm((cur) => ({ ...cur, videoDuration: e.target.value }))}>
              {durationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          style={{ height: 40, borderRadius: 8, border: 0, background: '#111827', color: '#fff', cursor: 'pointer' }}
        >
          {submitting ? '提交中…' : '提交任务'}
        </button>

        {message ? <p style={{ margin: 0, color: '#2563eb' }}>{message}</p> : null}
      </section>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>待处理任务队列</h2>
          <button type="button" onClick={() => void refreshTasks()} style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '6px 12px' }}>
            刷新
          </button>
        </div>
        <p style={{ color: '#666', marginTop: 0 }}>
          这里展示的是 GitHub 仓库 <code>data/pending-tasks.json</code> 里的当前任务列表。
        </p>

        {loading ? <p>正在读取队列…</p> : null}
        {!loading && tasks.length === 0 ? <p>当前没有待处理任务。</p> : null}

        <div style={{ display: 'grid', gap: 12 }}>
          {tasks.map((task) => (
            <article key={task.taskId} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong>{task.taskId}</strong>
                <span>{task.status}</span>
              </div>
              <p style={{ color: '#666' }}>提交时间：{formatTimeLabel(task.submittedAt)}</p>
              <p style={{ margin: 0 }}>
                {task.videoGoal} / {task.featureTags} / {task.scenePrimary} / {task.sceneSecondary} / {task.audience} / {task.duration}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
