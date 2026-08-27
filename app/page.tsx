'use client';

import { useMemo, useState } from 'react';
import { submitTask, type SubmitTaskPayload } from '../lib/task-queue-client';

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

export default function Home() {
  const [form, setForm] = useState<SubmitTaskPayload>({
    videoTarget: videoTargetOptions[0],
    sellingPointLevel1: sellingPointLevel1Options[0],
    sceneLevel1: sceneLevel1Options[0],
    sceneLevel2: sceneLevel2OptionsByL1[sceneLevel1Options[0]]?.[0] ?? '默认',
    targetAudience: audienceOptions[0],
    videoDuration: durationOptions[1],
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const sceneLevel2Options = useMemo(() => {
    return sceneLevel2OptionsByL1[form.sceneLevel1] ?? ['默认'];
  }, [form.sceneLevel1]);

  const onSubmit = async () => {
    setSubmitting(true);
    setMessage('正在提交任务…');

    const result = await submitTask(form);

    if (result.success) {
      setMessage(`任务已提交，任务ID: ${result.taskId}`);
    } else {
      setMessage(`提交失败：${result.error}`);
    }

    setSubmitting(false);
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>扣子广告素材视频自动化 · 任务提交</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        这里提交的任务会写入飞书多维表格「任务队列」。前端不会暴露任何飞书 token。
      </p>

      <div style={{ display: 'grid', gap: 14 }}>
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
              onChange={(e) =>
                setForm((cur) => ({
                  ...cur,
                  sceneLevel1: e.target.value,
                  sceneLevel2: (sceneLevel2OptionsByL1[e.target.value] ?? ['默认'])[0]!,
                }))
              }
            >
              {sceneLevel1Options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span>素材场景二级标签</span>
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
          onClick={() => void onSubmit()}
          disabled={submitting}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #111',
            background: submitting ? '#ddd' : '#111',
            color: submitting ? '#111' : '#fff',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {submitting ? '提交中…' : '提交任务到飞书队列'}
        </button>

        {message ? (
          <div style={{ padding: 12, borderRadius: 10, background: '#f5f5f5', border: '1px solid #eee' }}>{message}</div>
        ) : null}
      </div>

      <hr style={{ margin: '28px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <p style={{ color: '#888', fontSize: 12 }}>
        说明：任务状态字段会写入「待执行 / 执行中 / 已完成 / 生成失败」中的「待执行」。
      </p>
    </main>
  );
}
