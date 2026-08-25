'use client';

import { useEffect, useMemo, useState } from 'react';

type Screen = 'dashboard' | 'workflow' | 'result';
type WorkflowState = 'waiting' | 'running' | 'done';

type WorkflowStep = {
  key: string;
  label: string;
  detail: string;
  duration: number;
  state: WorkflowState;
};

type Draft = {
  goals: string[];
  scene: string;
  sellingPoint: string;
  audience: string;
  duration: string;
};

type ResultSummary = {
  title: string;
  subtitle: string;
  estimatedDuration: string;
  audience: string;
  delivery: string[];
  highlights: string[];
};

const goalOptions = ['高点击', '高付费', '高留存', '付费 × 次留双高'];
const sceneOptions = ['自媒体运营', '项目管理', '行业研究', '办公提效'];
const audienceOptions = ['内容运营 / 创作者', '团队管理者', '知识工作者', '增长负责人'];
const durationOptions = ['15 秒', '30 秒', '45 秒', '60 秒'];

const workflowBlueprint: Omit<WorkflowStep, 'state'>[] = [
  { key: 'case-retrieval', label: 'Case 检索', detail: '召回相近目标与相近场景的优质案例证据。', duration: 1200 },
  { key: 'formula-matching', label: '公式匹配', detail: '匹配 Champion / Challenger 创意机制。', duration: 1000 },
  { key: 'script-generation', label: '脚本生成', detail: '生成脚本、分镜与 UI 展示节奏。', duration: 1300 },
  { key: 'script-scoring', label: '脚本评分', detail: '执行风险检测、质量评分与优先级排序。', duration: 900 },
  { key: 'video-generation', label: '视频生成', detail: '生成 AIGC 镜头与真实 UI 演示片段。', duration: 1400 },
  { key: 'compositing', label: '合成渲染', detail: '整合字幕、配乐、旁白与时间线。', duration: 1100 },
  { key: 'quality-review', label: '质检审核', detail: '执行交付前检查并生成最终摘要。', duration: 1000 },
];

const queueItems = [
  { name: '职业模板 · 自媒体运营', id: 'VID-0825-014', status: 'Mock 演示中', tone: 'purple' },
  { name: 'AI 团队 · 项目管理', id: 'VID-0825-013', status: '等待启动', tone: 'blue' },
  { name: '生成 PPT · 行业研究', id: 'VID-0825-012', status: '已归档', tone: 'orange' },
  { name: '办公提效 · 自动日报', id: 'VID-0825-011', status: '已完成', tone: 'green' },
] as const;

const insightCards = [
  { label: 'Goodcase 样本', value: '148', hint: '按目标 / 场景复用' },
  { label: '机制公式', value: '320', hint: 'Champion + Challenger' },
  { label: '自动产能', value: '7 / 10', hint: '本周已跑通 7 条' },
];

function createSteps(): WorkflowStep[] {
  return workflowBlueprint.map((step, index) => ({
    ...step,
    state: index === 0 ? 'running' : 'waiting',
  }));
}

function buildResult(draft: Draft): ResultSummary {
  const primaryGoal = draft.goals[0] ?? '高转化';
  return {
    title: `${draft.scene} · ${primaryGoal} 视频方案`,
    subtitle: `围绕「${draft.sellingPoint}」输出可继续接真实 API 的前端演示链路。`,
    estimatedDuration: `${draft.duration} · 9:16 竖屏`,
    audience: draft.audience,
    delivery: ['脚本摘要', '阶段进度回放', '最终视频摘要卡', '质检审核回执'],
    highlights: [
      `视频目标聚焦：${draft.goals.join(' / ')}`,
      `内容场景：${draft.scene}`,
      '保留 Codex 原版的紧凑工作台布局，并升级为更细腻的暗色视觉。',
      '当前为纯前端 Mock 工作流，可无缝替换为真实事件流。',
    ],
  };
}

function SidebarNav({ active, onChange }: { active: Screen; onChange: (screen: Screen) => void }) {
  const items: Array<{ key: Screen; label: string; icon: string }> = [
    { key: 'dashboard', label: '工作台', icon: '⌂' },
    { key: 'workflow', label: '进度', icon: '◌' },
    { key: 'result', label: '结果', icon: '✦' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand-mark">扣</div>
      <div className="sidebar-group">
        {items.map((item) => (
          <button
            key={item.key}
            className={`nav-icon ${active === item.key ? 'active' : ''}`}
            onClick={() => onChange(item.key)}
            aria-label={item.label}
            title={item.label}
          >
            <span>{item.icon}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="nav-icon" aria-label="设置" title="设置">
          <span>⚙</span>
        </button>
        <div className="avatar">吴</div>
      </div>
    </aside>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [draft, setDraft] = useState<Draft>({
    goals: ['付费 × 次留双高'],
    scene: sceneOptions[0],
    sellingPoint: '职业模板开箱即用，复杂任务一键交付',
    audience: audienceOptions[0],
    duration: durationOptions[1],
  });
  const [steps, setSteps] = useState<WorkflowStep[]>(createSteps());
  const [activeIndex, setActiveIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ResultSummary | null>(buildResult({
    goals: ['付费 × 次留双高'],
    scene: sceneOptions[0],
    sellingPoint: '职业模板开箱即用，复杂任务一键交付',
    audience: audienceOptions[0],
    duration: durationOptions[1],
  }));
  const [jobId, setJobId] = useState('VID-MOCK-READY');
  const [notice, setNotice] = useState('当前版本为纯前端 Mock，可直接用于验证 UI 与流程体验。');

  useEffect(() => {
    if (!running) return;
    if (activeIndex >= steps.length) return;

    const timer = window.setTimeout(() => {
      setSteps((current) =>
        current.map((step, index) => {
          if (index < activeIndex + 1) return { ...step, state: 'done' };
          if (index === activeIndex + 1) return { ...step, state: 'running' };
          return step;
        }),
      );

      if (activeIndex === steps.length - 1) {
        setRunning(false);
        setActiveIndex(steps.length);
        setResult(buildResult(draft));
        setScreen('result');
        setNotice('7 个阶段已全部完成，最终摘要与交付信息已生成。');
        return;
      }

      setActiveIndex((index) => index + 1);
    }, steps[activeIndex].duration);

    return () => window.clearTimeout(timer);
  }, [activeIndex, draft, running, steps]);

  const completedCount = useMemo(() => steps.filter((step) => step.state === 'done').length, [steps]);
  const progress = Math.round((completedCount / steps.length) * 100);

  const toggleGoal = (goal: string) => {
    setDraft((current) => {
      const exists = current.goals.includes(goal);
      if (exists && current.goals.length === 1) return current;
      return {
        ...current,
        goals: exists ? current.goals.filter((item) => item !== goal) : [...current.goals, goal],
      };
    });
  };

  const handleStart = () => {
    const nextJobId = `VID-MOCK-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
    setJobId(nextJobId);
    setSteps(createSteps());
    setActiveIndex(0);
    setRunning(true);
    setResult(null);
    setScreen('workflow');
    setNotice('Mock 工作流已启动：系统将自动推进 7 个阶段并展示完成动画。');
  };

  const currentStep = activeIndex < steps.length ? steps[activeIndex] : steps[steps.length - 1];

  return (
    <main className="app-shell">
      <SidebarNav active={screen} onChange={setScreen} />
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">COZE AIGC VIDEO PLATFORM · FRONTEND MOCK</p>
            <h1>扣子 AIGC 视频平台</h1>
            <span className="topbar-subtitle">基于 Codex 原版风格重做的暗色高质感工作台</span>
          </div>
          <div className="topbar-actions">
            <div className="system-pill">
              <span className="live-dot" /> 纯前端 Mock Workflow
            </div>
            <button className="primary-button" onClick={handleStart}>开始生成</button>
          </div>
        </header>

        <div className="workspace-grid">
          <aside className="left-rail">
            <section className="rail-card queue-card">
              <div className="section-head">
                <div>
                  <p className="section-label">PRODUCTION QUEUE</p>
                  <h3>本周任务队列</h3>
                </div>
                <button className="ghost-icon">•••</button>
              </div>
              <div className="queue-list">
                {queueItems.map((item) => (
                  <article key={item.id} className="queue-item">
                    <span className={`queue-dot ${item.tone}`} />
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.id}</small>
                    </div>
                    <em>{item.status}</em>
                  </article>
                ))}
              </div>
            </section>

            <section className="rail-card metrics-card">
              <p className="section-label">KNOWLEDGE & CAPACITY</p>
              <div className="metric-stack">
                {insightCards.map((card) => (
                  <article key={card.label} className="metric-item">
                    <div>
                      <strong>{card.value}</strong>
                      <span>{card.label}</span>
                    </div>
                    <small>{card.hint}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className="rail-card teaser-card">
              <p className="section-label">WORKFLOW STATUS</p>
              <h3>{running ? '工作流正在自动推进' : '等待新任务启动'}</h3>
              <p>{running ? currentStep.detail : '填写参数后点击「开始生成」，即可查看 7 段动画式流程演示。'}</p>
              <div className="mini-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="teaser-foot">
                <span>{progress}% 完成</span>
                <span>{completedCount} / {steps.length} 阶段</span>
              </div>
            </section>
          </aside>

          <section className="main-stage">
            {notice ? (
              <div className="notice-banner">
                <span>✓</span>
                <p>{notice}</p>
                <button onClick={() => setNotice('')}>×</button>
              </div>
            ) : null}

            <section className="hero-panel">
              <div>
                <p className="section-label">AIGC VIDEO STUDIO</p>
                <h2>从目标设定到结果摘要，一屏跑通完整视频工作流</h2>
                <p className="hero-copy">
                  保留原版紧凑信息密度、紫色品牌识别与 B 端工作台气质，同时升级为更细腻的渐变暗色系统、流畅动效与清晰的前端 Mock 路径。
                </p>
              </div>
              <div className="hero-badges">
                <span>暗色渐变</span>
                <span>响应式布局</span>
                <span>7 段自动推进</span>
                <span>无后端依赖</span>
              </div>
            </section>

            <nav className="screen-tabs" aria-label="页面切换">
              <button className={screen === 'dashboard' ? 'active' : ''} onClick={() => setScreen('dashboard')}>首页 / 工作台</button>
              <button className={screen === 'workflow' ? 'active' : ''} onClick={() => setScreen('workflow')}>工作流进度</button>
              <button className={screen === 'result' ? 'active' : ''} onClick={() => setScreen('result')}>结果页面</button>
              <span className="version-text">Mock Workflow · {jobId}</span>
            </nav>

            {screen === 'dashboard' ? (
              <DashboardView draft={draft} onDraftChange={setDraft} onToggleGoal={toggleGoal} onStart={handleStart} />
            ) : null}

            {screen === 'workflow' ? (
              <WorkflowView steps={steps} progress={progress} currentStep={currentStep} running={running} />
            ) : null}

            {screen === 'result' ? (
              <ResultView result={result} onRestart={handleStart} onBack={() => setScreen('dashboard')} />
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function DashboardView({
  draft,
  onDraftChange,
  onToggleGoal,
  onStart,
}: {
  draft: Draft;
  onDraftChange: React.Dispatch<React.SetStateAction<Draft>>;
  onToggleGoal: (goal: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="dashboard-grid">
      <section className="panel form-panel">
        <div className="section-head with-border">
          <div>
            <p className="section-label">CREATE GENERATION JOB</p>
            <h3>首页 / 工作台</h3>
          </div>
          <span className="tiny-badge">完整可用表单</span>
        </div>

        <div className="form-block">
          <div className="form-title">
            <span>01</span>
            <div>
              <strong>视频目标选择</strong>
              <small>支持多选，影响案例召回、公式权重与最终结果摘要。</small>
            </div>
          </div>
          <div className="goal-grid">
            {goalOptions.map((goal) => {
              const selected = draft.goals.includes(goal);
              return (
                <button key={goal} className={`goal-card ${selected ? 'selected' : ''}`} onClick={() => onToggleGoal(goal)}>
                  <span>{goal}</span>
                  <i>{selected ? '✓' : '+'}</i>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-block two-column">
          <label className="field-card">
            <span>场景选择</span>
            <select value={draft.scene} onChange={(event) => onDraftChange((current) => ({ ...current, scene: event.target.value }))}>
              {sceneOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="field-card">
            <span>目标用户群体</span>
            <select value={draft.audience} onChange={(event) => onDraftChange((current) => ({ ...current, audience: event.target.value }))}>
              {audienceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-block two-column">
          <label className="field-card field-card-large">
            <span>功能卖点填写</span>
            <textarea
              value={draft.sellingPoint}
              onChange={(event) => onDraftChange((current) => ({ ...current, sellingPoint: event.target.value }))}
              rows={5}
              placeholder="例如：职业模板开箱即用、真实 UI 演示、复杂任务自动执行"
            />
          </label>

          <div className="stack-card">
            <label className="field-card compact">
              <span>视频时长选择</span>
              <div className="duration-chips">
                {durationOptions.map((option) => (
                  <button
                    key={option}
                    className={draft.duration === option ? 'selected' : ''}
                    onClick={() => onDraftChange((current) => ({ ...current, duration: option }))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </label>

            <div className="summary-card">
              <p className="section-label">JOB SNAPSHOT</p>
              <h4>{draft.scene} · {draft.duration}</h4>
              <ul>
                <li>{draft.goals.join(' / ')}</li>
                <li>{draft.audience}</li>
                <li>{draft.sellingPoint}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <aside className="panel preview-panel">
        <div className="section-head with-border">
          <div>
            <p className="section-label">PREVIEW & ACTION</p>
            <h3>任务预览</h3>
          </div>
          <span className="tiny-badge">Mock Ready</span>
        </div>

        <div className="preview-hero">
          <span className="preview-kicker">AIGC VIDEO</span>
          <strong>{draft.scene}</strong>
          <p>{draft.sellingPoint}</p>
        </div>

        <div className="preview-list">
          {workflowBlueprint.map((step, index) => (
            <article key={step.key}>
              <span>{index + 1}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.detail}</small>
              </div>
            </article>
          ))}
        </div>

        <button className="start-button" onClick={onStart}>
          <span>开始生成</span>
          <i>→</i>
        </button>
        <small className="preview-note">当前版本会自动按时序推进，无需任何后端即可完整验证流程。</small>
      </aside>
    </div>
  );
}

function WorkflowView({
  steps,
  progress,
  currentStep,
  running,
}: {
  steps: WorkflowStep[];
  progress: number;
  currentStep: WorkflowStep;
  running: boolean;
}) {
  return (
    <div className="workflow-grid">
      <section className="panel workflow-panel">
        <div className="section-head with-border">
          <div>
            <p className="section-label">SEVEN-STAGE WORKFLOW</p>
            <h3>工作流进度页面</h3>
          </div>
          <span className="tiny-badge">{progress}% 完成</span>
        </div>

        <div className="workflow-list">
          {steps.map((step, index) => (
            <article key={step.key} className={`workflow-item ${step.state}`}>
              <div className="workflow-icon">
                {step.state === 'done' ? '✓' : step.state === 'running' ? <span className="loading-ring" /> : index + 1}
              </div>
              <div className="workflow-copy">
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
              </div>
              <em>{step.state === 'done' ? '已完成' : step.state === 'running' ? '进行中' : '等待中'}</em>
            </article>
          ))}
        </div>
      </section>

      <aside className="workflow-side">
        <section className="panel status-panel glow-panel">
          <p className="section-label">LIVE STATUS</p>
          <h3>{running ? currentStep.label : '工作流完成'}</h3>
          <p>{running ? currentStep.detail : '7 个阶段都已完成，系统已生成最终摘要与交付信息。'}</p>
          <div className="ring-progress">
            <div className="ring-core">{progress}%</div>
          </div>
        </section>

        <section className="panel timeline-panel">
          <p className="section-label">STAGE TIMELINE</p>
          <div className="timeline-track">
            {steps.map((step) => (
              <div key={step.key} className={`timeline-segment ${step.state}`}>
                <span />
                <small>{step.label}</small>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function ResultView({
  result,
  onRestart,
  onBack,
}: {
  result: ResultSummary | null;
  onRestart: () => void;
  onBack: () => void;
}) {
  if (!result) {
    return (
      <section className="panel result-panel loading-result">
        <span className="loading-ring large" />
        <p>结果生成中，工作流完成后会自动展示摘要信息。</p>
      </section>
    );
  }

  return (
    <div className="result-grid">
      <section className="panel result-panel glow-panel">
        <div className="result-hero">
          <span className="result-kicker">DELIVERY SUMMARY</span>
          <h3>{result.title}</h3>
          <p>{result.subtitle}</p>
        </div>

        <div className="result-stats">
          <article>
            <span>视频规格</span>
            <strong>{result.estimatedDuration}</strong>
          </article>
          <article>
            <span>目标用户</span>
            <strong>{result.audience}</strong>
          </article>
          <article>
            <span>交付物数量</span>
            <strong>{result.delivery.length} 项</strong>
          </article>
        </div>

        <div className="result-columns">
          <div>
            <p className="section-label">HIGHLIGHTS</p>
            <ul className="result-list">
              {result.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="section-label">DELIVERABLES</p>
            <ul className="result-list soft">
              {result.delivery.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <aside className="result-side">
        <section className="panel action-panel">
          <p className="section-label">NEXT ACTION</p>
          <h3>结果页面</h3>
          <p>当前结果来自 Mock 时序推进，后续可直接替换为真实 API 返回数据。</p>
          <div className="action-buttons">
            <button className="primary-button wide" onClick={onRestart}>再次生成</button>
            <button className="secondary-button wide" onClick={onBack}>返回工作台</button>
          </div>
        </section>
      </aside>
    </div>
  );
}
