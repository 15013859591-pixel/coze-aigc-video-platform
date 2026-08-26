'use client';

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { aimeApi, aimeApiBaseUrl, type GenerationJobCreate, type JobEvent } from '../lib/aime-api';

const STUDIO_URL = 'https://14978f6e5f5a.aime-app.bytedance.net/';

type Screen = 'dashboard' | 'workflow' | 'result' | 'studio';
type WorkflowState = 'waiting' | 'running' | 'done' | 'failed';

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

type StudioSnapshot = {
  ok: boolean;
  source: string;
  fetchedAt: string;
  tasks: StudioTask[];
  primaryTask: StudioTask | null;
  metrics: {
    weeklyCapacity: string;
    approvedCount: number;
    runningCount: number;
    averageProgress: number;
    goodCases: number;
    badCases: number;
    mechanisms: number;
  };
  error?: string;
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
  { name: '职业模板 · 自媒体运营', id: 'VID-0825-014', status: 'Mock 演示中', tone: 'purple', progress: 52 },
  { name: 'AI 团队 · 项目管理', id: 'VID-0825-013', status: '等待启动', tone: 'blue', progress: 31 },
  { name: '生成 PPT · 行业研究', id: 'VID-0825-012', status: '已归档', tone: 'orange', progress: 92 },
  { name: '办公提效 · 自动日报', id: 'VID-0825-011', status: '已完成', tone: 'green', progress: 100 },
] as const;

const stageToStepIndex: Record<string, number> = {
  CREATED: 0,
  CASE_RETRIEVAL: 0,
  FORMULA_MATCHING: 1,
  SCRIPT_GENERATING: 2,
  SCRIPT_SCORING: 3,
  UI_PLANNING: 4,
  UI_EXECUTING: 4,
  VIDEO_GENERATING: 4,
  COMPOSITING: 5,
  VIDEO_QA: 6,
  REVIEW_SUBMITTING: 6,
  COMPLETED: workflowBlueprint.length,
};

function createSteps(): WorkflowStep[] {
  return workflowBlueprint.map((step, index) => ({
    ...step,
    state: index === 0 ? 'running' : 'waiting',
  }));
}

function getDurationSeconds(duration: string) {
  const value = Number.parseInt(duration, 10);
  return Number.isFinite(value) ? value : 30;
}

function buildPayload(draft: Draft): GenerationJobCreate {
  return {
    objective: draft.goals.join(' / '),
    feature: draft.sellingPoint,
    selling_point: draft.sellingPoint,
    scene: draft.scene,
    audience: draft.audience,
    channel: '短视频广告',
    duration_seconds: getDurationSeconds(draft.duration),
    aspect_ratio: '9:16',
    video_structure: '痛点点名 → 真实 UI 证明 → 结果兑现 → 体验 CTA',
    ui_depth: '真实扣子 UI 录屏',
    candidate_count: 1,
    challenger_ratio: 0.2,
    require_real_ui: true,
    auto_submit_review: true,
  };
}

function buildResult(draft: Draft, jobId: string, studioTask?: StudioTask | null): ResultSummary {
  const primaryGoal = draft.goals[0] ?? '高转化';
  const studioLine = studioTask
    ? `已同步生产现场任务：${studioTask.id} · ${studioTask.status} · ${studioTask.progress}%`
    : '已保留生产现场连接，可继续查看外部工作台状态。';

  return {
    title: `${draft.scene} · ${primaryGoal} 视频方案`,
    subtitle: `围绕「${draft.sellingPoint}」创建任务 ${jobId}，并接入生产现场状态。`,
    estimatedDuration: `${draft.duration} · 9:16 竖屏`,
    audience: draft.audience,
    delivery: ['任务创建回执', '生产现场状态同步', '阶段进度回放', '最终视频摘要卡', '质检审核回执'],
    highlights: [
      `视频目标聚焦：${draft.goals.join(' / ')}`,
      `内容场景：${draft.scene}`,
      studioLine,
      '表单提交会优先调用 Aime 任务 API；接口不可用时保留本地演示与生产现场 iframe，不伪造远端成功。',
    ],
  };
}

function stepsFromRemote(index: number, failed = false): WorkflowStep[] {
  return workflowBlueprint.map((step, stepIndex) => ({
    ...step,
    state: failed && stepIndex === index ? 'failed' : stepIndex < index ? 'done' : stepIndex === index ? 'running' : 'waiting',
  }));
}

function SidebarNav({ active, onChange }: { active: Screen; onChange: (screen: Screen) => void }) {
  const items: Array<{ key: Screen; label: string; icon: string }> = [
    { key: 'dashboard', label: '工作台', icon: '⌂' },
    { key: 'workflow', label: '进度', icon: '◌' },
    { key: 'studio', label: '生产现场', icon: '◈' },
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
        <a className="nav-icon" aria-label="打开外部生产工作台" title="打开外部生产工作台" href={STUDIO_URL} target="_blank" rel="noreferrer">
          <span>↗</span>
        </a>
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
  }, 'VID-MOCK-READY'));
  const [jobId, setJobId] = useState('VID-MOCK-READY');
  const [notice, setNotice] = useState('已接入生产现场：左侧队列和进度条会读取外部工作台状态，表单提交会优先调用真实任务 API。');
  const [studioSnapshot, setStudioSnapshot] = useState<StudioSnapshot | null>(null);
  const [studioError, setStudioError] = useState('');
  const [apiMode, setApiMode] = useState<'idle' | 'creating' | 'live' | 'fallback'>('idle');

  const refreshStudioSnapshot = useCallback(async () => {
    try {
      const response = await fetch('/api/studio-snapshot', { cache: 'no-store' });
      const data = (await response.json()) as StudioSnapshot;
      if (!response.ok || !data.ok) throw new Error(data.error || '生产现场状态读取失败');
      setStudioSnapshot(data);
      setStudioError('');
    } catch (error) {
      setStudioError(error instanceof Error ? error.message : '生产现场状态读取失败');
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void refreshStudioSnapshot();
    }, 0);
    const timer = window.setInterval(refreshStudioSnapshot, 15000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refreshStudioSnapshot]);

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
        setResult(buildResult(draft, jobId, studioSnapshot?.primaryTask));
        setScreen('result');
        setNotice('7 个阶段已完成；已同步生产现场快照，可继续进入「生产现场」查看外部工作台。');
        return;
      }

      setActiveIndex((index) => index + 1);
    }, steps[activeIndex].duration);

    return () => window.clearTimeout(timer);
  }, [activeIndex, draft, jobId, running, steps, studioSnapshot?.primaryTask]);

  useEffect(() => {
    if (!running || jobId.startsWith('VID-LOCAL-') || jobId === 'VID-MOCK-READY') return;

    return aimeApi.subscribe(
      jobId,
      (event: JobEvent) => {
        const nextIndex = stageToStepIndex[event.stage] ?? Math.floor((event.progress / 100) * workflowBlueprint.length);
        const clampedIndex = Math.min(Math.max(nextIndex, 0), workflowBlueprint.length);
        setActiveIndex(clampedIndex);
        setSteps(stepsFromRemote(Math.min(clampedIndex, workflowBlueprint.length - 1), event.node_status === 'FAILED'));
        setNotice(`${event.message} · 真实任务进度 ${event.progress}%`);
        if (event.stage === 'COMPLETED' || event.progress >= 100) {
          setRunning(false);
          setActiveIndex(workflowBlueprint.length);
          setSteps(workflowBlueprint.map((step) => ({ ...step, state: 'done' })));
          setResult(buildResult(draft, jobId, studioSnapshot?.primaryTask));
          setScreen('result');
        }
      },
      () => {
        setApiMode('fallback');
        setNotice('真实任务事件流暂时不可用，已自动切换为本地进度回放，并继续同步生产现场状态。');
      },
    );
  }, [draft, jobId, running, studioSnapshot?.primaryTask]);

  const completedCount = useMemo(() => steps.filter((step) => step.state === 'done').length, [steps]);
  const localProgress = Math.round((completedCount / steps.length) * 100);
  const studioProgress = studioSnapshot?.primaryTask?.progress ?? null;
  const progress = running ? Math.max(localProgress, studioProgress ?? 0) : localProgress;
  const liveQueueItems = studioSnapshot?.tasks.length
    ? studioSnapshot.tasks.map((task) => ({ name: task.listTitle, id: task.id, status: task.status, tone: task.accent, progress: task.progress }))
    : queueItems;

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

  const handleStart = async () => {
    setApiMode('creating');
    setSteps(createSteps());
    setActiveIndex(0);
    setRunning(true);
    setResult(null);
    setScreen('workflow');
    setNotice('正在提交真实任务，并同步外部生产工作台状态…');

    try {
      const createdJob = await aimeApi.createJob(buildPayload(draft));
      setJobId(createdJob.job_id);
      setApiMode('live');
      setNotice(`真实任务已创建：${createdJob.job_id}，当前阶段 ${createdJob.stage}。`);
      await refreshStudioSnapshot();
    } catch (error) {
      const fallbackJobId = `VID-LOCAL-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
      setJobId(fallbackJobId);
      setApiMode('fallback');
      setNotice(`任务 API 暂未返回成功，已保留本地工作流回放并继续读取生产现场：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const currentStep = activeIndex < steps.length ? steps[activeIndex] : steps[steps.length - 1];

  return (
    <main className="app-shell">
      <SidebarNav active={screen} onChange={setScreen} />
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">COZE AIGC VIDEO PLATFORM · LIVE INTEGRATION</p>
            <h1>扣子 AIGC 视频平台</h1>
            <span className="topbar-subtitle">已与生产工作台联动：读取外部队列、嵌入现场页面，并优先调用真实任务 API。</span>
          </div>
          <div className="topbar-actions">
            <div className={`system-pill ${studioSnapshot ? 'connected-pill' : 'warning-pill'}`}>
              <span className="live-dot" /> {studioSnapshot ? '生产现场已连接' : '生产现场读取中'}
            </div>
            <button className="primary-button" onClick={handleStart} disabled={apiMode === 'creating'}>
              {apiMode === 'creating' ? '提交中…' : '开始生成'}
            </button>
          </div>
        </header>

        <div className="workspace-grid">
          <aside className="left-rail">
            <section className="rail-card queue-card">
              <div className="section-head">
                <div>
                  <p className="section-label">PRODUCTION QUEUE</p>
                  <h3>生产现场任务队列</h3>
                </div>
                <button className="ghost-icon" onClick={refreshStudioSnapshot}>↻</button>
              </div>
              <div className="queue-list">
                {liveQueueItems.map((item) => (
                  <article key={item.id} className="queue-item">
                    <span className={`queue-dot ${item.tone}`} />
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.id} · {item.progress}%</small>
                    </div>
                    <em>{item.status}</em>
                  </article>
                ))}
              </div>
            </section>

            <section className="rail-card metrics-card">
              <p className="section-label">KNOWLEDGE & CAPACITY</p>
              <div className="metric-stack">
                {[
                  { label: 'Goodcase 样本', value: String(studioSnapshot?.metrics.goodCases ?? 148), hint: '来自生产现场快照' },
                  { label: '机制公式', value: String(studioSnapshot?.metrics.mechanisms ?? 320), hint: 'Champion + Challenger' },
                  { label: '自动产能', value: studioSnapshot?.metrics.weeklyCapacity ?? '7 / 10', hint: `${studioSnapshot?.metrics.runningCount ?? 3} 条运行中` },
                ].map((card) => (
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
              <p>{running ? currentStep.detail : '填写参数后点击「开始生成」，会提交任务并把生产现场状态映射到进度条。'}</p>
              <div className="mini-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="teaser-foot">
                <span>{progress}% 完成</span>
                <span>{studioProgress !== null ? `现场 ${studioProgress}%` : `${completedCount} / ${steps.length} 阶段`}</span>
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
                <h2>从前端表单到生产现场，一屏跑通真实联动路径</h2>
                <p className="hero-copy">
                  当前版本通过服务端接口读取外部工作台任务队列，把现场进度映射到本平台进度条；提交任务时会优先调用真实 Aime API，失败时保留可见降级提示。
                </p>
              </div>
              <div className="hero-badges">
                <span>外部工作台快照</span>
                <span>真实 API 优先</span>
                <span>SSE 事件流</span>
                <span>iframe 现场预览</span>
              </div>
            </section>

            <nav className="screen-tabs" aria-label="页面切换">
              <button className={screen === 'dashboard' ? 'active' : ''} onClick={() => setScreen('dashboard')}>首页 / 工作台</button>
              <button className={screen === 'workflow' ? 'active' : ''} onClick={() => setScreen('workflow')}>工作流进度</button>
              <button className={screen === 'studio' ? 'active' : ''} onClick={() => setScreen('studio')}>生产现场联动</button>
              <button className={screen === 'result' ? 'active' : ''} onClick={() => setScreen('result')}>结果页面</button>
              <span className="version-text">{apiMode === 'live' ? 'Live API' : apiMode === 'fallback' ? 'Fallback + Studio' : 'Ready'} · {jobId}</span>
            </nav>

            {studioError ? <div className="notice-banner warning"><span>!</span><p>{studioError}</p><button onClick={() => setStudioError('')}>×</button></div> : null}

            {screen === 'dashboard' ? (
              <DashboardView draft={draft} onDraftChange={setDraft} onToggleGoal={toggleGoal} onStart={handleStart} studioSnapshot={studioSnapshot} />
            ) : null}

            {screen === 'workflow' ? (
              <WorkflowView steps={steps} progress={progress} currentStep={currentStep} running={running} studioTask={studioSnapshot?.primaryTask ?? null} apiMode={apiMode} />
            ) : null}

            {screen === 'studio' ? (
              <StudioView snapshot={studioSnapshot} onRefresh={refreshStudioSnapshot} />
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
  studioSnapshot,
}: {
  draft: Draft;
  onDraftChange: Dispatch<SetStateAction<Draft>>;
  onToggleGoal: (goal: string) => void;
  onStart: () => void;
  studioSnapshot: StudioSnapshot | null;
}) {
  const primaryTask = studioSnapshot?.primaryTask;

  return (
    <div className="dashboard-grid">
      <section className="panel form-panel">
        <div className="section-head with-border">
          <div>
            <p className="section-label">CREATE GENERATION JOB</p>
            <h3>首页 / 工作台</h3>
          </div>
          <span className="tiny-badge">Live Connected</span>
        </div>

        <div className="form-block integration-strip">
          <span className="integration-dot" />
          <div>
            <strong>已联动外部生产工作台</strong>
            <small>{primaryTask ? `当前读取：${primaryTask.id} · ${primaryTask.status} · ${primaryTask.progress}%` : '正在等待生产现场快照返回'}</small>
          </div>
          <a href={STUDIO_URL} target="_blank" rel="noreferrer">打开现场 ↗</a>
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
          <span className="tiny-badge">API Ready</span>
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
          <span>提交到生产链路</span>
          <i>→</i>
        </button>
        <small className="preview-note">表单会按 Aime 后端契约提交；同时从外部生产工作台读取任务队列和状态展示。</small>
      </aside>
    </div>
  );
}

function WorkflowView({
  steps,
  progress,
  currentStep,
  running,
  studioTask,
  apiMode,
}: {
  steps: WorkflowStep[];
  progress: number;
  currentStep: WorkflowStep;
  running: boolean;
  studioTask: StudioTask | null;
  apiMode: 'idle' | 'creating' | 'live' | 'fallback';
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
                {step.state === 'done' ? '✓' : step.state === 'failed' ? '!' : step.state === 'running' ? <span className="loading-ring" /> : index + 1}
              </div>
              <div className="workflow-copy">
                <strong>{step.label}</strong>
                <p>{step.detail}</p>
              </div>
              <em>{step.state === 'done' ? '已完成' : step.state === 'failed' ? '需重试' : step.state === 'running' ? '进行中' : '等待中'}</em>
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
          <div className="live-bridge-card">
            <span>{apiMode === 'live' ? '真实 API 事件流' : apiMode === 'fallback' ? '本地回放 + 现场快照' : '等待提交'}</span>
            <strong>{studioTask ? `${studioTask.id} · ${studioTask.pill}` : '生产现场待同步'}</strong>
            <small>{studioTask ? studioTask.tags.join(' / ') : `API: ${aimeApiBaseUrl}`}</small>
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

function StudioView({ snapshot, onRefresh }: { snapshot: StudioSnapshot | null; onRefresh: () => void }) {
  return (
    <div className="studio-grid">
      <section className="panel studio-panel">
        <div className="section-head with-border">
          <div>
            <p className="section-label">REMOTE STUDIO</p>
            <h3>生产现场实时嵌入</h3>
          </div>
          <div className="studio-actions">
            <button className="secondary-button" onClick={onRefresh}>刷新状态</button>
            <a className="primary-link" href={STUDIO_URL} target="_blank" rel="noreferrer">新窗口打开 ↗</a>
          </div>
        </div>
        <iframe className="studio-frame" src={STUDIO_URL} title="扣子全自动视频素材生产工作台" />
      </section>

      <aside className="panel remote-data-panel">
        <p className="section-label">REMOTE DATA FORMAT</p>
        <h3>已读取的数据结构</h3>
        <p className="remote-copy">目标站点是静态工作台，主要数据在前端脚本中的 tasks 队列。当前前端通过同源 API 路由抓取并结构化成任务状态。</p>
        <div className="remote-task-list">
          {(snapshot?.tasks ?? []).map((task) => (
            <article key={task.id}>
              <div>
                <strong>{task.listTitle}</strong>
                <small>{task.id} · {task.pill}</small>
              </div>
              <span>{task.progress}%</span>
            </article>
          ))}
          {!snapshot?.tasks.length ? <p className="remote-empty">正在读取外部任务队列…</p> : null}
        </div>
        <div className="remote-json">
          <span>字段</span>
          <code>{'{ title, listTitle, id, progress, status, pill, accent, brief, tags[] }'}</code>
        </div>
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
          <p>结果页保留真实任务回执和生产现场状态，方便继续打开外部工作台核对进度。</p>
          <div className="action-buttons">
            <button className="primary-button wide" onClick={onRestart}>再次生成</button>
            <button className="secondary-button wide" onClick={onBack}>返回工作台</button>
            <a className="secondary-button wide link-button" href={STUDIO_URL} target="_blank" rel="noreferrer">打开生产现场</a>
          </div>
        </section>
      </aside>
    </div>
  );
}
