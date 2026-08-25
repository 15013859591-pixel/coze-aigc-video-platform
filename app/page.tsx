'use client';

import { useState } from 'react';

type PipelineStep = {
  id: number;
  label: string;
  detail: string;
  status: 'done' | 'active' | 'waiting';
};

const pipeline: PipelineStep[] = [
  { id: 1, label: '数据洞察', detail: 'TOP 功能 / 场景', status: 'done' },
  { id: 2, label: '素材拆解', detail: '148 条样本', status: 'done' },
  { id: 3, label: '脚本生成', detail: '10 条候选', status: 'done' },
  { id: 4, label: '视频提示词', detail: '分镜已对齐', status: 'done' },
  { id: 5, label: 'UI 演示计划', detail: '4 个关键事件', status: 'active' },
  { id: 6, label: '自动录屏', detail: '等待执行', status: 'waiting' },
  { id: 7, label: '智能剪辑', detail: '等待素材', status: 'waiting' },
  { id: 8, label: '字幕与质检', detail: '等待成片', status: 'waiting' },
];

const eventRows = [
  { time: '06.2s', event: '创建项目', track: '全屏', tone: 'blue' },
  { time: '08.4s', event: '添加 3 个 Agent', track: '局部放大', tone: 'violet' },
  { time: '10.1s', event: '@Agent 分派任务', track: '画中画', tone: 'orange' },
  { time: '12.8s', event: '结果卡片返回', track: '结果定格', tone: 'green' },
];

const jobs = [
  { name: 'AI 团队 · 项目管理', id: 'VID-0825-014', state: '录屏规划中', color: 'purple' },
  { name: '自媒体 · 爆款追踪', id: 'VID-0825-013', state: '质检通过', color: 'green' },
  { name: 'PPT · 一句话生成', id: 'VID-0825-012', state: '剪辑中 72%', color: 'orange' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'library'>('pipeline');
  const [layout, setLayout] = useState<'画中画' | '分屏' | '全屏'>('画中画');
  const [running, setRunning] = useState(false);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">A</div>
        <nav className="icon-nav" aria-label="主导航">
          <button className="nav-icon active" aria-label="生产工作台"><span>⌂</span></button>
          <button className="nav-icon" aria-label="任务列表"><span>▦</span></button>
          <button className="nav-icon" aria-label="素材库"><span>◫</span></button>
          <button className="nav-icon" aria-label="数据洞察"><span>⌁</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-icon" aria-label="设置"><span>⚙</span></button>
          <div className="avatar">余</div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">AIME CREATIVE LAB</p>
            <h1>全自动视频生产台</h1>
          </div>
          <div className="top-actions">
            <button className="ghost-button"><span className="live-dot" />系统正常</button>
            <button className="primary-button" onClick={() => setRunning(true)}>
              <span>＋</span> 新建视频任务
            </button>
          </div>
        </header>

        <div className="content-grid">
          <aside className="project-panel">
            <div className="panel-title-row">
              <div>
                <p className="section-label">本周任务</p>
                <strong>视频项目</strong>
              </div>
              <button className="mini-button">•••</button>
            </div>

            <div className="job-list">
              {jobs.map((job, index) => (
                <button className={`job-item ${index === 0 ? 'selected' : ''}`} key={job.id}>
                  <span className={`job-indicator ${job.color}`} />
                  <span className="job-copy">
                    <strong>{job.name}</strong>
                    <small>{job.id}</small>
                  </span>
                  <span className="job-state">{job.state}</span>
                </button>
              ))}
            </div>

            <div className="weekly-card">
              <div className="weekly-head">
                <span>本周产能</span>
                <strong>12 / 20</strong>
              </div>
              <div className="progress"><span /></div>
              <div className="weekly-foot"><span>已完成 9</span><span>生成中 3</span></div>
            </div>

            <div className="source-card">
              <p className="section-label">知识库状态</p>
              <div className="source-stat"><strong>148</strong><span>爆款样本</span></div>
              <div className="source-stat"><strong>36</strong><span>Bad case</span></div>
              <div className="source-stat"><strong>320</strong><span>可复用公式</span></div>
              <button>查看知识库 <span>→</span></button>
            </div>
          </aside>

          <section className="main-stage">
            <div className="brief-card">
              <div className="brief-main">
                <div className="brief-icon"><span>✦</span></div>
                <div>
                  <p className="section-label">当前生成目标</p>
                  <h2>AI 团队 · 项目管理</h2>
                  <div className="tag-row">
                    <span>付费 × 次留双高</span>
                    <span>40 秒</span>
                    <span>结构 A · 自然融入</span>
                  </div>
                </div>
              </div>
              <div className="score-block">
                <div className="score-ring"><strong>92</strong><span>/ 100</span></div>
                <div><strong>高潜脚本</strong><small>预测优于 86% 历史素材</small></div>
              </div>
            </div>

            <div className="tab-row">
              <button className={activeTab === 'pipeline' ? 'active' : ''} onClick={() => setActiveTab('pipeline')}>生产流水线</button>
              <button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>脚本与素材原子</button>
              <span className="last-save">刚刚自动保存</span>
            </div>

            {activeTab === 'pipeline' ? (
              <>
                <div className="pipeline-card">
                  <div className="pipeline-head">
                    <div>
                      <p className="section-label">END-TO-END WORKFLOW</p>
                      <h3>从爆款数据到可投放成片</h3>
                    </div>
                    <div className="pipeline-status"><span /> 正在生成 UI 演示计划</div>
                  </div>
                  <div className="pipeline-track">
                    {pipeline.map((step, index) => (
                      <div className={`pipeline-step ${step.status}`} key={step.id}>
                        <div className="step-line">
                          <span className="step-number">{step.status === 'done' ? '✓' : step.id}</span>
                          {index < pipeline.length - 1 && <i />}
                        </div>
                        <strong>{step.label}</strong>
                        <small>{step.detail}</small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="studio-grid">
                  <section className="capture-card">
                    <div className="card-head">
                      <div>
                        <p className="section-label">UI CAPTURE PLAN</p>
                        <h3>UI 演示轨道</h3>
                      </div>
                      <span className="capability-id">multi_agent_demo_v3</span>
                    </div>

                    <div className="preview-window">
                      <div className="browser-bar">
                        <div className="traffic"><span /><span /><span /></div>
                        <div className="address">扣子 · AI 团队项目</div>
                        <span className="secure">● REC</span>
                      </div>
                      <div className="fake-product">
                        <div className="fake-nav">
                          <b>扣子</b>
                          <span className="fake-pill" />
                          <span className="fake-pill short" />
                          <span className="fake-pill" />
                        </div>
                        <div className="fake-canvas">
                          <div className="fake-title"><span /><span /></div>
                          <div className="agent-row">
                            <div className="agent-card violet"><i>数</i><b>数据分析</b><small>任务执行中</small></div>
                            <div className="connector">→</div>
                            <div className="agent-card orange"><i>策</i><b>创意策划</b><small>等待输入</small></div>
                            <div className="connector">→</div>
                            <div className="agent-card blue"><i>设</i><b>视觉设计</b><small>等待输入</small></div>
                          </div>
                          <div className="prompt-box"><span>@数据分析Agent 分析发布会数据并同步给策划</span><b>↑</b></div>
                          <div className="focus-frame"><span>08.4s · 重点区域</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="timeline">
                      <div className="timeline-label"><span>00:00</span><span>00:10</span><span>00:20</span><span>00:30</span><span>00:40</span></div>
                      <div className="track-row"><b>口播</b><div className="audio-wave">{Array.from({ length: 42 }).map((_, i) => <i key={i} style={{ height: `${6 + ((i * 11) % 18)}px` }} />)}</div></div>
                      <div className="track-row"><b>UI</b><div className="clip blue-clip">创建项目</div><div className="clip violet-clip">添加 Agent</div><div className="clip orange-clip">任务分派</div><div className="clip green-clip">结果返回</div></div>
                      <div className="playhead"><span>10.1s</span></div>
                    </div>
                  </section>

                  <aside className="event-card">
                    <div className="card-head compact">
                      <div><p className="section-label">EVENT LOG</p><h3>关键事件</h3></div>
                      <span className="event-count">4</span>
                    </div>
                    <div className="event-list">
                      {eventRows.map((row) => (
                        <div className="event-row" key={row.time}>
                          <span className={`event-dot ${row.tone}`} />
                          <div><strong>{row.event}</strong><small>{row.time} · {row.track}</small></div>
                          <span className="event-ok">✓</span>
                        </div>
                      ))}
                    </div>
                    <div className="layout-control">
                      <p>UI 画面布局</p>
                      <div>{(['画中画', '分屏', '全屏'] as const).map((item) => <button className={layout === item ? 'active' : ''} onClick={() => setLayout(item)} key={item}>{item}</button>)}</div>
                    </div>
                    <button className={`run-button ${running ? 'running' : ''}`} onClick={() => setRunning(!running)}>
                      <span>{running ? '■' : '▶'}</span>
                      <span><strong>{running ? '录屏任务执行中' : '执行自动录屏'}</strong><small>{running ? '已完成 2 / 4 个事件' : '预计耗时 2 分 40 秒'}</small></span>
                    </button>
                    <p className="safety-note"><span>✓</span> 已启用演示账号与隐私遮罩</p>
                  </aside>
                </div>
              </>
            ) : (
              <div className="library-view">
                <div className="library-heading"><div><p className="section-label">RUNTIME KNOWLEDGE</p><h3>脚本依据与素材原子</h3></div><button>查看完整 Prompt</button></div>
                <div className="formula-cards">
                  <article><span>01</span><p>前三秒钩子</p><strong>反常识结果 + 明确人群 + 时间压力</strong><small>“一个人怎么同时管好 3 个 AI 员工？”</small></article>
                  <article><span>02</span><p>核心痛点</p><strong>协作链路长，信息反复同步</strong><small>命中 27 条双高样本中的高频痛点</small></article>
                  <article><span>03</span><p>功能证明</p><strong>真实 UI 连续闭环演示</strong><small>创建 → 分工 → 执行 → 结果回传</small></article>
                  <article><span>04</span><p>转化收口</p><strong>收益量化 + 低门槛行动</strong><small>“把重复沟通交给 AI 团队，现在就试试”</small></article>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
