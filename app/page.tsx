'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  listPendingTasks,
  submitTask,
  type QueueTask,
  type SubmitTaskPayload,
} from '../lib/task-queue-client';

const videoTargetOptions = ['高点击', '高付费', '高留存', '付费 × 次留双高'];
const sellingPointLevel1Options = ['模板开箱即用', '真实 UI 演示', '自动化工作流', '一键生成视频素材'];
const sceneLevel1Options = ['自媒体运营', '项目管理', '行业研究', '办公提效'];
const sceneLevel2OptionsByL1: Record<string, string[]> = {
  自媒体运营: ['爆款拆解', '账号起盘', '选题策划', '脚本分镜'],
  项目管理: ['需求评审', '周报自动化', '会议纪要', '里程碑跟踪'],
  行业研究: ['竞品分析', '报告生成', '数据整理', '洞察提炼'],
  办公提效: ['表格处理', '文档写作', '邮件总结', '知识库整理'],
};
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
    sceneLevel2: sceneLevel2OptionsByL1[sceneLevel1Options[0]]?.[0] ?? '默认',
    targetAudience: audienceOptions[0],
    videoDuration: durationOptions[1],
  });
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sceneLevel2Options = useMemo(() => {
    return sceneLevel2OptionsByL1[form.sceneLevel1] ?? ['默认'];
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
            <span>场景一级标签</span>
            <select
              value={form.sceneLevel1}
              onChange={(e) => {
                const nextL1 = e.target.value;
                const nextL2 = sceneLevel2OptionsByL1[nextL1]?.[0] ?? '默认';
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
