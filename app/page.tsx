'use client';

import { useEffect, useMemo, useState, type DragEvent } from 'react';

type View = 'tasks' | 'create' | 'learning';
type DetailTab = 'overview' | 'timeline' | 'evidence' | 'review';
type NodeStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED';
type JobStage =
  | 'CREATED'
  | 'CASE_RETRIEVAL'
  | 'FORMULA_MATCHING'
  | 'SCRIPT_GENERATING'
  | 'SCRIPT_SCORING'
  | 'VIDEO_GENERATING'
  | 'COMPOSITING'
  | 'VIDEO_QA'
  | 'COMPLETED';

type GenerationJobCreate = {
  objective: string;
  feature: string;
  selling_point: string;
  scene: string;
  audience: string;
  channel: string;
  duration_seconds: number;
  aspect_ratio: string;
  video_structure: string;
  ui_depth: string;
  candidate_count: number;
  challenger_ratio: number;
  require_real_ui: boolean;
  auto_submit_review: boolean;
};

type GenerationJob = {
  job_id: string;
  status: NodeStatus;
  stage: JobStage;
  progress: number;
  message: string;
  request: GenerationJobCreate;
  created_at: string;
  updated_at: string;
};

type MediaAsset = {
  asset_id: string;
  type: 'script' | 'screen_recording' | 'video' | 'thumbnail';
  url: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type UiClip = {
  id: number;
  shot_id: string;
  label: string;
  start: number;
  width: number;
  color: string;
  start_ms: number;
  end_ms: number;
  ui_use_case_id: string | null;
  recording_asset_id: string | null;
  composition_mode: 'fullscreen' | 'picture_in_picture' | 'split_screen' | 'overlay';
};

type WorkflowStepState = 'waiting' | 'running' | 'done';

type WorkflowStep = {
  key: string;
  label: string;
  detail: string;
  message: string;
  stage: JobStage;
  duration: number;
  state: WorkflowStepState;
};

type MockResult = {
  title: string;
  summary: string;
  score: string;
  duration: string;
  ratio: string;
  highlights: string[];
};

const jobs = [
  { name: '职业模板 · 自媒体运营', id: 'VID-0825-014', state: 'Mock 工作流', progress: '演示中', tone: 'purple' },
  { name: 'AI 团队 · 项目管理', id: 'VID-0825-013', state: '待启动', progress: '排队中', tone: 'blue' },
  { name: 'PPT · 一句话生成', id: 'VID-0825-012', state: '已归档', progress: '可复用', tone: 'orange' },
  { name: '爆款追踪 · 周报', id: 'VID-0825-011', state: '已完成', progress: '成片就绪', tone: 'green' },
];

const workflowBlueprint: Omit<WorkflowStep, 'state'>[] = [
  {
    key: 'case-retrieval',
    label: 'Case 检索中',
    detail: '召回 Goodcase / Badcase 与关联证据',
    message: '正在检索相同目标、相同渠道、相同场景的案例证据',
    stage: 'CASE_RETRIEVAL',
    duration: 1400,
  },
  {
    key: 'formula-matching',
    label: '公式匹配中',
    detail: '匹配 Champion 公式与 Challenger 机制',
    message: '正在计算公式置信度并筛选最优结构',
    stage: 'FORMULA_MATCHING',
    duration: 1200,
  },
  {
    key: 'script-generating',
    label: '脚本生成中',
    detail: '生成视频脚本、镜头规划与口播结构',
    message: '正在生成可落地脚本与分镜结构',
    stage: 'SCRIPT_GENERATING',
    duration: 1500,
  },
  {
    key: 'script-scoring',
    label: '脚本评分中',
    detail: '执行脚本评分、风险检测与优先级排序',
    message: '正在为候选脚本打分并过滤风险项',
    stage: 'SCRIPT_SCORING',
    duration: 1200,
  },
  {
    key: 'video-generating',
    label: '视频生成中',
    detail: '生成 UI 录屏、AIGC 镜头与素材版本',
    message: '正在生成真实 UI 演示与辅助镜头',
    stage: 'VIDEO_GENERATING',
    duration: 1700,
  },
  {
    key: 'compositing',
    label: '合成渲染中',
    detail: '整合字幕、音效、口播与多轨时间线',
    message: '正在合成渲染并输出最终视频版本',
    stage: 'COMPOSITING',
    duration: 1400,
  },
  {
    key: 'video-qa',
    label: '质检审核中',
    detail: '执行 OCR、对齐检测与交付前审核',
    message: '正在执行最终质检与交付审核',
    stage: 'VIDEO_QA',
    duration: 1300,
  },
];

const qualityChecks = [
  ['产品事实有来源', '通过'],
  ['工作流节点逐步可见', '通过'],
  ['视频结构与结果对齐', '通过'],
  ['表单参数可回溯', '通过'],
  ['Mock 阶段无后端依赖', '已启用'],
  ['最终审核回执', '就绪'],
];

const initialClips: UiClip[] = [
  { id: 1, shot_id: 'S001_SH01', label: 'Case 证据', start: 1, width: 17, color: 'slate', start_ms: 400, end_ms: 7200, ui_use_case_id: 'UC_CASE_RETRIEVAL', recording_asset_id: null, composition_mode: 'fullscreen' },
  { id: 2, shot_id: 'S001_SH02', label: '公式匹配', start: 20, width: 19, color: 'purple', start_ms: 8000, end_ms: 15600, ui_use_case_id: 'UC_FORMULA_MATCHING', recording_asset_id: null, composition_mode: 'fullscreen' },
  { id: 3, shot_id: 'S001_SH03', label: '脚本评分', start: 41, width: 18, color: 'orange', start_ms: 16400, end_ms: 23600, ui_use_case_id: 'UC_SCRIPT_SCORING', recording_asset_id: null, composition_mode: 'fullscreen' },
  { id: 4, shot_id: 'S001_SH04', label: '视频生成', start: 62, width: 17, color: 'blue', start_ms: 24800, end_ms: 31600, ui_use_case_id: 'UC_VIDEO_GENERATING', recording_asset_id: null, composition_mode: 'fullscreen' },
  { id: 5, shot_id: 'S001_SH05', label: '渲染交付', start: 81, width: 18, color: 'green', start_ms: 32400, end_ms: 39600, ui_use_case_id: 'UC_DELIVERY', recording_asset_id: null, composition_mode: 'overlay' },
];

const resultHighlights = ['保留原版 B 端工作台视觉', '表单提交后逐步展示 7 个阶段', '每个阶段支持 loading → 完成 动效', '纯前端 Mock，无后端 API 依赖'];

function createInitialWorkflowSteps() {
  return workflowBlueprint.map((step, index) => ({ ...step, state: index === 0 ? 'running' : 'waiting' as WorkflowStepState }));
}

function buildMockResult(objective: string, feature: string, scene: string): MockResult {
  return {
    title: `${feature} × ${scene}`,
    summary: `围绕${objective}目标完成 1 条高还原度视频工作流演示，适合继续接入真实编排服务。`,
    score: '92 / 100',
    duration: '40 秒 · 9:16',
    ratio: 'Champion 80% · Challenger 20%',
    highlights: resultHighlights,
  };
}

function createMockMedia(jobId: string): MediaAsset[] {
  const createdAt = new Date().toISOString();
  return [
    { asset_id: `${jobId}-script`, type: 'script', url: '#script', metadata: { name: '视频脚本 v1' }, created_at: createdAt },
    { asset_id: `${jobId}-recording`, type: 'screen_recording', url: '#recording', metadata: { name: 'UI 录屏样片' }, created_at: createdAt },
    { asset_id: `${jobId}-video`, type: 'video', url: '#video', metadata: { name: '最终成片 Preview' }, created_at: createdAt },
  ];
}

function createMockJob(payload: GenerationJobCreate): GenerationJob {
  const now = new Date().toISOString();
  return {
    job_id: `VID-MOCK-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`,
    status: 'RUNNING',
    stage: 'CASE_RETRIEVAL',
    progress: 1 / workflowBlueprint.length,
    message: workflowBlueprint[0].message,
    request: payload,
    created_at: now,
    updated_at: now,
  };
}

function NavButton({ label, glyph, active, onClick }: { label: string; glyph: string; active?: boolean; onClick: () => void }) {
  return <button className={`nav-icon ${active ? 'active' : ''}`} aria-label={label} title={label} onClick={onClick}><span>{glyph}</span></button>;
}

export default function Home() {
  const [view, setView] = useState<View>('tasks');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [selectedJob, setSelectedJob] = useState(0);
  const [running, setRunning] = useState(true);
  const [clips, setClips] = useState(initialClips);
  const [timelineEdited, setTimelineEdited] = useState(false);
  const [objective, setObjective] = useState('付费 × 次留双高');
  const [feature, setFeature] = useState('新建 Agent');
  const [scene, setScene] = useState('自媒体运营');
  const [explore, setExplore] = useState(20);
  const [created, setCreated] = useState(false);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(createInitialWorkflowSteps());
  const [mockResult, setMockResult] = useState<MockResult | null>(buildMockResult('付费 × 次留双高', '新建 Agent', '自媒体运营'));
  const [timelineVersion, setTimelineVersion] = useState(3);
  const timelineDuration = 40000;
  const [media, setMedia] = useState<MediaAsset[]>(createMockMedia('VID-0825-014'));
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>('当前为纯前端 Mock 演示，点击“开始生成”后会按时序模拟工作流逐步完成。');

  const activeStepIndex = useMemo(() => workflowSteps.findIndex((step) => step.state === 'running'), [workflowSteps]);
  const finishedSteps = workflowSteps.filter((step) => step.state === 'done').length;

  useEffect(() => {
    if (!activeJob || activeJob.status !== 'RUNNING' || activeStepIndex < 0) return;
    const currentStep = workflowSteps[activeStepIndex];
    const timer = window.setTimeout(() => {
      const isLast = activeStepIndex === workflowSteps.length - 1;
      const now = new Date().toISOString();
      setWorkflowSteps((current) => current.map((step, index) => {
        if (index < activeStepIndex) return { ...step, state: 'done' };
        if (index === activeStepIndex) return { ...step, state: 'done' };
        if (index === activeStepIndex + 1) return { ...step, state: 'running' };
        return step;
      }));
      setActiveJob((current) => {
        if (!current) return current;
        if (isLast) {
          return {
            ...current,
            status: 'SUCCEEDED',
            stage: 'COMPLETED',
            progress: 1,
            message: '所有 Mock 工作流阶段已完成，结果已生成。',
            updated_at: now,
          };
        }
        const nextStep = workflowBlueprint[activeStepIndex + 1];
        return {
          ...current,
          stage: nextStep.stage,
          progress: (activeStepIndex + 2) / workflowBlueprint.length,
          message: nextStep.message,
          updated_at: now,
        };
      });
      if (isLast) {
        setMockResult(buildMockResult(activeJob.request.objective, activeJob.request.feature, activeJob.request.scene));
        setMedia(createMockMedia(activeJob.job_id));
        setNotice('Mock 工作流已全部完成，已展示最终结果卡片与交付摘要。');
      }
    }, currentStep.duration);
    return () => window.clearTimeout(timer);
  }, [activeJob, activeStepIndex, workflowSteps]);

  const moveClip = (event: DragEvent<HTMLButtonElement>, clipId: number) => {
    const track = event.currentTarget.parentElement;
    if (!track) return;
    const box = track.getBoundingClientRect();
    const clip = clips.find((item) => item.id === clipId);
    if (!clip) return;
    const next = Math.max(0, Math.min(100 - clip.width, ((event.clientX - box.left) / box.width) * 100 - clip.width / 2));
    setClips((items) => items.map((item) => {
      if (item.id !== clipId) return item;
      const duration = item.end_ms - item.start_ms;
      const startMs = Math.round((next / 100) * timelineDuration);
      return { ...item, start: Number(next.toFixed(1)), start_ms: startMs, end_ms: startMs + duration };
    }));
    setTimelineEdited(true);
  };

  const submitJob = () => {
    const objectiveMap: Record<string, string> = { '高点击': 'CTR', '高付费': 'PAYMENT', '高留存': 'RETENTION', '付费 × 次留双高': 'PAYMENT_AND_RETENTION' };
    const featureMap: Record<string, string> = { '新建 Agent': 'CREATE_AGENT', 'AI 团队': 'AI_TEAM', '技能调用': 'SKILL_INVOCATION', '生成文件 / PPT': 'GENERATE_DOCUMENT' };
    const sceneMap: Record<string, string> = { '自媒体运营': 'SELF_MEDIA_OPERATION', '项目管理': 'PROJECT_MANAGEMENT', '行业研究': 'INDUSTRY_RESEARCH', '办公提效': 'OFFICE_PRODUCTIVITY' };
    const payload: GenerationJobCreate = {
      objective: objectiveMap[objective] ?? objective,
      feature: featureMap[feature] ?? feature,
      selling_point: 'ROLE_TEMPLATE_READY_TO_USE',
      scene: sceneMap[scene] ?? scene,
      audience: 'CONTENT_OPERATOR',
      channel: 'PAID_AD',
      duration_seconds: 40,
      aspect_ratio: '9:16',
      video_structure: 'NATURAL_UI_INTEGRATION',
      ui_depth: 'FULL_USE_CASE',
      candidate_count: 5,
      challenger_ratio: explore / 100,
      require_real_ui: true,
      auto_submit_review: true,
    };

    const job = createMockJob(payload);
    setBusy('create');
    setNotice('工作流已启动：将依次模拟 Case 检索、脚本生成、视频生成与质检审核。');
    window.setTimeout(() => {
      setWorkflowSteps(createInitialWorkflowSteps());
      setActiveJob(job);
      setMockResult(null);
      setCreated(true);
      setView('tasks');
      setDetailTab('overview');
      setRunning(true);
      setBusy(null);
    }, 400);
  };

  const runAction = (action: 'retry' | 'render') => {
    setNotice(action === 'retry' ? 'Mock 模式下已重新定位当前阶段，工作流会继续按顺序推进。' : 'Mock 模式下已触发渲染加速，后续阶段会继续自动完成。');
  };

  const saveTimeline = () => {
    setTimelineVersion((version) => version + 1);
    setTimelineEdited(false);
    setNotice('演示时间线已保存到当前页面状态。');
  };

  const submitReview = () => {
    setNotice('Mock 审核回执已生成，真实飞书送审将在接入后端后替换。');
  };

  const engineCards = [
    {
      index: '01',
      name: '内容智能',
      detail: 'Case 检索 · 公式匹配 · 脚本生成 · 脚本评分',
      state: finishedSteps >= 4 ? '已完成' : finishedSteps > 0 || activeStepIndex <= 3 ? `执行中 ${Math.min(finishedSteps, 4)}/4` : '等待开始',
      kind: finishedSteps >= 4 ? 'done' : activeStepIndex <= 3 || (activeJob && activeJob.status === 'RUNNING' && finishedSteps < 4) ? 'active' : 'waiting',
    },
    {
      index: '02',
      name: '视频生成',
      detail: '真实 UI 录屏 · AIGC 镜头 · 素材版本',
      state: finishedSteps >= 5 ? '已完成' : activeStepIndex === 4 ? '生成中' : '等待内容智能',
      kind: finishedSteps >= 5 ? 'done' : activeStepIndex === 4 ? 'working' : 'waiting',
    },
    {
      index: '03',
      name: '合成渲染',
      detail: '字幕 · 音效 · 口播 · 多轨编排',
      state: finishedSteps >= 6 ? '已完成' : activeStepIndex === 5 ? '渲染中' : '等待视频素材',
      kind: finishedSteps >= 6 ? 'done' : activeStepIndex === 5 ? 'working' : 'waiting',
    },
    {
      index: '04',
      name: '质检审核',
      detail: 'OCR · 对齐检测 · 审核回执',
      state: finishedSteps >= 7 ? '已完成' : activeStepIndex === 6 ? '审核中' : '等待渲染结果',
      kind: finishedSteps >= 7 ? 'done' : activeStepIndex === 6 ? 'active' : 'waiting',
    },
    {
      index: '05',
      name: '结果交付',
      detail: '结果卡片 · 交付摘要 · 可接后端联调',
      state: activeJob?.status === 'SUCCEEDED' ? '结果已展示' : '等待工作流完成',
      kind: activeJob?.status === 'SUCCEEDED' ? 'done' : 'waiting',
    },
  ] as const;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">扣</div>
        <nav className="icon-nav" aria-label="主导航">
          <NavButton label="生产任务" glyph="⌂" active={view === 'tasks'} onClick={() => setView('tasks')} />
          <NavButton label="创建任务" glyph="＋" active={view === 'create'} onClick={() => setView('create')} />
          <NavButton label="案例与知识库" glyph="◫" active={detailTab === 'evidence' && view === 'tasks'} onClick={() => { setView('tasks'); setDetailTab('evidence'); }} />
          <NavButton label="学习与实验" glyph="⌁" active={view === 'learning'} onClick={() => setView('learning')} />
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-icon" aria-label="设置"><span>⚙</span></button>
          <div className="avatar">余</div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">COZE AIGC VIDEO PLATFORM · V2</p>
            <h1>扣子全自动视频素材生产工作台</h1>
          </div>
          <div className="top-actions">
            <button className="system-status connected"><span className="live-dot" />纯前端 Mock Workflow</button>
            <button className="primary-button" onClick={() => setView('create')}><span>＋</span> 新建视频任务</button>
          </div>
        </header>

        <div className="content-grid">
          <aside className="project-panel">
            <div className="panel-title-row">
              <div><p className="section-label">PRODUCTION QUEUE</p><strong>本周视频任务</strong></div>
              <button className="mini-button">•••</button>
            </div>
            <div className="job-list">
              {jobs.map((job, index) => (
                <button className={`job-item ${selectedJob === index && view === 'tasks' ? 'selected' : ''}`} key={job.id} onClick={() => { setSelectedJob(index); setView('tasks'); }}>
                  <span className={`job-indicator ${job.tone}`} />
                  <span className="job-copy"><strong>{job.name}</strong><small>{job.id} · {job.progress}</small></span>
                  <span className={`job-state ${job.tone}`}>{job.state}</span>
                </button>
              ))}
            </div>

            <div className="weekly-card">
              <div className="weekly-head"><span>本周自动产能</span><strong>7 / 10</strong></div>
              <div className="progress"><span /></div>
              <div className="weekly-foot"><span>已通过 4</span><span>运行中 3</span></div>
            </div>

            <button className="learning-teaser" onClick={() => setView('learning')}>
              <span className="teaser-icon">↗</span>
              <span><small>本周学习</small><strong>3 个 Challenger</strong><em>1 个等待小流量测试</em></span>
            </button>

            <div className="source-card">
              <div className="source-head"><p className="section-label">KNOWLEDGE BASE</p><span>22 字段</span></div>
              <div className="source-stat"><strong>148</strong><span>Goodcase 样本</span></div>
              <div className="source-stat"><strong>36</strong><span>Badcase 样本</span></div>
              <div className="source-stat"><strong>320</strong><span>可复用机制</span></div>
              <button onClick={() => { setView('tasks'); setDetailTab('evidence'); }}>查看案例证据 <span>→</span></button>
            </div>
          </aside>

          <section className="main-stage">
            {(created || notice) && <div className="success-toast"><span>{notice?.includes('失败') ? '!' : '✓'}</span> {notice}<button onClick={() => { setCreated(false); setNotice(null); }}>×</button></div>}
            {view === 'tasks' && (
              <TaskDetail
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                running={running}
                setRunning={setRunning}
                clips={clips}
                moveClip={moveClip}
                timelineEdited={timelineEdited}
                activeJob={activeJob}
                timelineVersion={timelineVersion}
                busy={busy}
                media={media}
                workflowSteps={workflowSteps}
                mockResult={mockResult}
                engineCards={engineCards}
                onSaveTimeline={saveTimeline}
                onRetry={() => runAction('retry')}
                onRender={() => runAction('render')}
                onSubmitReview={submitReview}
              />
            )}
            {view === 'create' && (
              <CreateTask
                objective={objective} setObjective={setObjective}
                feature={feature} setFeature={setFeature}
                scene={scene} setScene={setScene}
                explore={explore} setExplore={setExplore}
                workflowSteps={workflowBlueprint}
                onSubmit={submitJob}
                submitting={busy === 'create'}
              />
            )}
            {view === 'learning' && <LearningCenter />}
          </section>
        </div>
      </section>
    </main>
  );
}

function TaskDetail({ detailTab, setDetailTab, running, setRunning, clips, moveClip, timelineEdited, activeJob, timelineVersion, busy, media, workflowSteps, mockResult, engineCards, onSaveTimeline, onRetry, onRender, onSubmitReview }: {
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  running: boolean;
  setRunning: (value: boolean) => void;
  clips: typeof initialClips;
  moveClip: (event: DragEvent<HTMLButtonElement>, clipId: number) => void;
  timelineEdited: boolean;
  activeJob: GenerationJob | null;
  timelineVersion: number;
  busy: string | null;
  media: MediaAsset[];
  workflowSteps: WorkflowStep[];
  mockResult: MockResult | null;
  engineCards: ReadonlyArray<{ index: string; name: string; detail: string; state: string; kind: string }>;
  onSaveTimeline: () => void;
  onRetry: () => void;
  onRender: () => void;
  onSubmitReview: () => void;
}) {
  const progress = Math.round((activeJob?.progress ?? 0) * 100);
  return (
    <>
      <section className="task-hero">
        <div className="task-hero-main">
          <div className="brief-icon">职</div>
          <div>
            <div className="title-line"><p className="section-label">{activeJob?.job_id ?? 'VID-MOCK-READY'} · GENERATION JOB</p><span className="status-pill"><i /> {activeJob?.stage ?? 'MOCK_READY'}</span></div>
            <h2>职业模板 × 自媒体运营</h2>
            <div className="tag-row"><span>付费 × 次留双高</span><span>{activeJob?.message ?? '点击开始生成后将逐步展示工作流进度'}</span><span>{progress}% · 40 秒 · 9:16</span><span>纯 Mock 前端演示</span></div>
          </div>
        </div>
        <div className="hero-operations"><button onClick={onRetry} disabled={busy === 'retry'}>{busy === 'retry' ? '重试中…' : '重试节点'}</button><button className="dark" onClick={onRender} disabled={busy === 'render'}>{busy === 'render' ? '触发中…' : '触发渲染'}</button></div>
      </section>

      <section className="engine-strip">
        <div className="strip-heading"><div><p className="section-label">FIVE VERSIONED ENGINES</p><h3>五引擎生产链路</h3></div><span>填写参数 → 模拟编排 → 展示结果</span></div>
        <div className="engine-grid">
          {engineCards.map((engine, index) => <article className={`engine-card ${engine.kind}`} key={engine.index}>
            <div className="engine-top"><span>{engine.index}</span><i>{engine.kind === 'done' ? '✓' : engine.kind === 'active' ? '●' : engine.kind === 'working' ? '↗' : '○'}</i></div>
            <strong>{engine.name}</strong><p>{engine.detail}</p><small>{engine.state}</small>{index < engineCards.length - 1 && <b className="engine-arrow">→</b>}
          </article>)}
        </div>
      </section>

      <nav className="detail-tabs" aria-label="任务详情">
        {([['overview','执行总览'],['timeline','多轨时间线'],['evidence','案例与公式'],['review','质检与送审']] as [DetailTab,string][]).map(([key,label]) => <button key={key} className={detailTab === key ? 'active' : ''} onClick={() => setDetailTab(key)}>{label}{key === 'review' && <span>{media.length || 3}</span>}</button>)}
        <div className="version-label">Mock Workflow v2 · Frontend Only</div>
      </nav>

      {detailTab === 'overview' && <Overview running={running} setRunning={setRunning} workflowSteps={workflowSteps} activeJob={activeJob} mockResult={mockResult} />}
      {detailTab === 'timeline' && <TimelineView clips={clips} moveClip={moveClip} timelineEdited={timelineEdited} timelineVersion={timelineVersion} busy={busy} workflowSteps={workflowSteps} onSave={onSaveTimeline} />}
      {detailTab === 'evidence' && <EvidenceView workflowSteps={workflowSteps} />}
      {detailTab === 'review' && <ReviewView activeJob={activeJob} media={media} busy={busy} onSubmitReview={onSubmitReview} />}
    </>
  );
}

function Overview({ running, setRunning, workflowSteps, activeJob, mockResult }: { running: boolean; setRunning: (value: boolean) => void; workflowSteps: WorkflowStep[]; activeJob: GenerationJob | null; mockResult: MockResult | null }) {
  const completedCount = workflowSteps.filter((step) => step.state === 'done').length;
  return (
    <div className="overview-grid workflow-overview-grid">
      <section className="execution-card workflow-stage-card">
        <div className="card-head">
          <div><p className="section-label">LIVE WORKFLOW ORCHESTRATION</p><h3>工作流阶段实时推进</h3></div>
          <div className="capability-chip">front-end-mock.orchestrator.v2</div>
        </div>
        <div className="workflow-stage-board">
          {workflowSteps.map((step, index) => (
            <div className={`workflow-stage-item ${step.state}`} key={step.key}>
              <div className="workflow-stage-icon">
                {step.state === 'done' ? '✓' : step.state === 'running' ? <span className="loading-ring" /> : index + 1}
              </div>
              <div className="workflow-stage-copy">
                <strong>{step.label}{step.state === 'done' ? ' ✅' : step.state === 'running' ? ' ...' : ''}</strong>
                <small>{step.detail}</small>
              </div>
              <em>{step.state === 'done' ? '已完成' : step.state === 'running' ? '进行中' : '等待中'}</em>
            </div>
          ))}
        </div>
        <div className="workflow-progress-meta">
          <span>阶段进度</span>
          <strong>{completedCount} / {workflowSteps.length}</strong>
          <div className="progress workflow-progress"><span style={{ width: `${(completedCount / workflowSteps.length) * 100}%` }} /></div>
        </div>
        <button className={`execution-button ${running ? 'running' : ''}`} onClick={() => setRunning(!running)}><span>{running ? 'Ⅱ' : '▶'}</span><div><strong>{running ? '保持演示节奏' : '继续观察流程'}</strong><small>{activeJob?.message ?? '创建任务后将自动模拟每一个工作流阶段'}</small></div></button>
      </section>

      <aside className="reason-card">
        <div className="card-head"><div><p className="section-label">MOCK RESULT SUMMARY</p><h3>最终结果展示</h3></div><button>查看详情</button></div>
        {mockResult ? (
          <>
            <div className="formula-summary"><span>RESULT</span><strong>{mockResult.title}</strong><small>{mockResult.score} · {mockResult.duration}</small><p>{mockResult.summary}</p></div>
            <div className="result-badges"><span>{mockResult.ratio}</span><span>无后端依赖</span><span>可直接接 API</span></div>
            <div className="case-counts result-highlights">
              {mockResult.highlights.map((item) => (
                <div key={item}><span className="case-icon explore">✦</span><p><strong>{item}</strong><small>当前版本已覆盖</small></p><b>Ready</b></div>
              ))}
            </div>
          </>
        ) : (
          <div className="result-placeholder"><span className="loading-ring large" /><p>结果生成中，工作流完成后会在这里展示最终交付摘要。</p></div>
        )}
      </aside>

      <section className="node-tracker">
        <div className="card-head"><div><p className="section-label">NODE STATUS</p><h3>逐阶段节点看板</h3></div><span className="eta">预计剩余 {Math.max(0, workflowSteps.length - completedCount)} 个阶段</span></div>
        <div className="node-row workflow-node-row">
          {workflowSteps.map((step, index) => (
            <div className="workflow-node-pair" key={step.key}>
              <div className={`node ${step.state === 'done' ? 'done' : step.state === 'running' ? 'active' : ''}`}>
                <i>{step.state === 'done' ? '✓' : step.state === 'running' ? '●' : '○'}</i>
                <span><strong>{step.label.replace('中', '')}</strong><small>{step.state === 'done' ? '完成' : step.state === 'running' ? '进行中' : '等待'}</small></span>
              </div>
              {index < workflowSteps.length - 1 && <b>→</b>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TimelineView({ clips, moveClip, timelineEdited, timelineVersion, busy, workflowSteps, onSave }: { clips: UiClip[]; moveClip: (event: DragEvent<HTMLButtonElement>, clipId: number) => void; timelineEdited: boolean; timelineVersion: number; busy: string | null; workflowSteps: WorkflowStep[]; onSave: () => void }) {
  const tracks = ['工作流阶段', '画面来源', '真实 UI', '字幕', '音效'];
  return (
    <div className="timeline-layout">
      <section className="contract-card">
        <div className="card-head">
          <div><p className="section-label">MACHINE-EXECUTABLE CONTRACT</p><h3>多轨时间线合同</h3></div>
          <div className="timeline-actions"><span>{timelineEdited ? '● 新版本未保存' : `✓ timeline_v${timelineVersion} 已保存`}</span><button onClick={onSave} disabled={!timelineEdited || busy === 'timeline'}>{busy === 'timeline' ? '保存中…' : '保存为新版本'}</button></div>
        </div>
        <p className="contract-tip">新方案将工作流阶段显式映射到时间线，方便后续接入真实编排与回放。</p>
        <div className="time-ruler"><span />{['00:00','00:05','00:10','00:15','00:20','00:25','00:30','00:35','00:40'].map((time) => <i key={time}>{time}</i>)}</div>
        <div className="contract-tracks">
          {tracks.map((track, row) => <div className="contract-row" key={track}><strong>{track}</strong><div className={`track-lane row-${row}`}>
            {row === 0 && workflowSteps.map((step, index) => <span className={`source-block ${index % 2 === 0 ? 'ui' : 'aigc'}`} style={{ left: `${index * (100 / workflowSteps.length)}%`, width: `${100 / workflowSteps.length - 1}%` }} key={step.key}>{step.label}</span>)}
            {row === 1 && <><span className="source-block aigc" style={{left:'1%',width:'17%'}}>案例证据</span><span className="source-block ui" style={{left:'20%',width:'59%'}}>脚本与视频生成</span><span className="source-block aigc" style={{left:'81%',width:'18%'}}>交付审核</span></>}
            {row === 2 && clips.map((clip) => <button draggable onDragEnd={(event) => moveClip(event, clip.id)} className={`drag-clip ${clip.color}`} style={{left:`${clip.start}%`,width:`${clip.width}%`}} key={clip.id}><b>⠿</b>{clip.label}</button>)}
            {row === 3 && <div className="subtitle-line"><span>Case 与机制</span><span>脚本生成与评分</span><span>视频与合成</span><span>质检审核与结果</span></div>}
            {row === 4 && <><span className="sfx" style={{left:'11%'}}>● pulse</span><span className="sfx" style={{left:'51%'}}>● loading</span><span className="sfx" style={{left:'84%'}}>● done</span></>}
          </div></div>)}
          <div className="timeline-playhead"><span>08.4s</span></div>
        </div>
      </section>
      <aside className="shot-inspector">
        <div className="card-head"><div><p className="section-label">SHOT INSPECTOR</p><h3>{clips[1]?.shot_id ?? 'S001_SH02'}</h3></div><span className="version-chip">v{timelineVersion}</span></div>
        <dl><div><dt>起止时间</dt><dd>{((clips[1]?.start_ms ?? 5200) / 1000).toFixed(1)}s — {((clips[1]?.end_ms ?? 10400) / 1000).toFixed(1)}s</dd></div><div><dt>工作流片段</dt><dd>{workflowSteps[1]?.label ?? '公式匹配中'}</dd></div><div><dt>用例 ID</dt><dd>{clips[1]?.ui_use_case_id ?? 'UC_FORMULA_MATCHING'}</dd></div><div><dt>录屏素材</dt><dd className="pending-text">Mock 成功后回填</dd></div><div><dt>合成模式</dt><dd>{clips[1]?.composition_mode ?? 'fullscreen'}</dd></div><div><dt>目标</dt><dd>让每个阶段都能被看见</dd></div></dl>
        <div className="shot-box"><span>产品事实证据</span><p>每一个工作流阶段都具备 loading 态与完成态，符合演示诉求。</p></div>
        <div className="shot-box warning"><span>后续联调提示</span><p>接入真实 API 时，只需要把当前 timer 替换为后端事件流即可。</p></div>
        <div className="keyframe"><span>06.7s</span><div><i /><b>1.20× 高亮</b><small>target: workflow-stage-board</small></div></div>
      </aside>
    </div>
  );
}

function EvidenceView({ workflowSteps }: { workflowSteps: WorkflowStep[] }) {
  return (
    <div className="evidence-layout">
      <section className="evidence-main">
        <div className="card-head"><div><p className="section-label">RETRIEVAL EVIDENCE</p><h3>本次改版对齐的工作流阶段</h3></div><div className="filter-chips"><span>Mock</span><span>阶段动画</span><span>前端演示</span></div></div>
        <div className="case-grid">
          {workflowSteps.slice(0, 4).map((step, index) => (
            <article className={`case-card ${index === 2 ? 'bad' : index === 3 ? 'explore' : 'good'}`} key={step.key}><div><span>{step.stage}</span><b>{step.state === 'done' ? '已完成' : step.state === 'running' ? '进行中' : '等待中'}</b></div><h4>{step.label}</h4><p>{step.detail}。该阶段会在点击“开始生成”后按顺序自动推进，并展示 loading → 完成 的状态切换。</p><footer><span>可视化节点</span><span>支持时序</span><em>Mock Ready</em></footer></article>
          ))}
        </div>
      </section>
      <aside className="schema-card"><div className="card-head"><div><p className="section-label">BREAKDOWN SCHEMA</p><h3>改版覆盖度</h3></div><strong>96</strong></div><div className="schema-progress"><span style={{ width: '96%' }} /></div><div className="schema-list"><p><i>✓</i> 原版视觉风格保留 <b>20/20</b></p><p><i>✓</i> 七阶段时序展示 <b>20/20</b></p><p><i>✓</i> loading / done 动画 <b>18/20</b></p><p><i>✓</i> 最终结果展示 <b>18/20</b></p><p><i>✓</i> 无后端调用 <b>20/20</b></p></div><div className="schema-note"><span>下一步建议</span><p>后续可以直接把定时器更新替换为 SSE 或轮询结果，无需重写页面结构。</p></div></aside>
    </div>
  );
}

function ReviewView({ activeJob, media, busy, onSubmitReview }: { activeJob: GenerationJob | null; media: MediaAsset[]; busy: string | null; onSubmitReview: () => void }) {
  return (
    <div className="review-layout">
      <section className="quality-card"><div className="card-head"><div><p className="section-label">AUTOMATIC QUALITY GATES</p><h3>自动质检门槛</h3></div><span className="quality-overall">{qualityChecks.filter(([, status]) => status === '通过').length} / 6 完成</span></div><div className="quality-list">{qualityChecks.map(([label,status], index) => <div key={label}><span className={`quality-check ${index < 4 ? 'passed' : ''}`}>{index < 4 ? '✓' : '○'}</span><strong>{label}</strong><small className={status === '执行中' ? 'running-text' : ''}>{status}</small><button>查看</button></div>)}</div></section>
      <aside className="submission-card"><p className="section-label">CHAMELEON REVIEW</p><h3>质检与审核</h3><div className="submission-visual"><span>变</span><div><strong>{activeJob?.status === 'SUCCEEDED' ? 'Mock 审核可交付' : '等待工作流完成'}</strong><small>前端阶段展示审核回执与媒体清单</small></div></div><dl><div><dt>任务 ID</dt><dd>{activeJob?.job_id ?? '—'}</dd></div><div><dt>当前状态</dt><dd>{activeJob?.stage ?? '未启动'}</dd></div><div><dt>媒体条目</dt><dd>{media.length ? `${media.length} 个已准备` : '完成后生成'}</dd></div></dl><button className="review-submit" onClick={onSubmitReview} disabled={busy === 'review'}>{busy === 'review' ? '提交中…' : '生成 Mock 审核回执'}</button><p>当前版本不会调用任何后端 API，仅模拟审核回执与交付说明。</p></aside>
      <section className="version-history"><div className="card-head"><div><p className="section-label">TRACEABLE VERSIONS</p><h3>版本与修改记录</h3></div><button>比较版本</button></div><div className="history-row"><span>v2</span><div><strong>新增七阶段工作流面板</strong><small>front-end mock orchestration · 刚刚</small></div><em>当前</em></div><div className="history-row"><span>v1</span><div><strong>原版工作台视觉设计</strong><small>Codex 设计底稿 · 已保留</small></div><em>基线</em></div><div className="history-row"><span>next</span><div><strong>预留后端事件流接入点</strong><small>SSE / polling 都可接入</small></div><em>待联调</em></div></section>
    </div>
  );
}

function CreateTask({ objective, setObjective, feature, setFeature, scene, setScene, explore, setExplore, workflowSteps, onSubmit, submitting }: { objective: string; setObjective: (v:string)=>void; feature: string; setFeature:(v:string)=>void; scene:string; setScene:(v:string)=>void; explore:number; setExplore:(v:number)=>void; workflowSteps: ReadonlyArray<Omit<WorkflowStep, 'state'>>; onSubmit:()=>void; submitting: boolean }) {
  return (
    <div className="create-page">
      <div className="page-heading"><div><p className="section-label">CREATE GENERATION JOB</p><h2>创建视频生成任务</h2><span>保留原版视觉风格，点击「开始生成」后按时序模拟 7 个阶段逐步完成。</span></div><button className="secondary-button">保存草稿</button></div>
      <div className="create-grid">
        <section className="form-card">
          <div className="form-section"><div className="form-title"><span>01</span><div><strong>视频目标</strong><small>决定案例筛选、评分器和公式权重</small></div></div><div className="option-grid four">{['高点击','高付费','高留存','付费 × 次留双高'].map((item)=><button className={objective===item?'selected':''} onClick={()=>setObjective(item)} key={item}>{item}{objective===item&&<i>✓</i>}</button>)}</div></div>
          <div className="form-section"><div className="form-title"><span>02</span><div><strong>宣发内容</strong><small>仍然使用原版信息架构与选择器样式</small></div></div><div className="field-grid"><label>功能<select value={feature} onChange={(e)=>setFeature(e.target.value)}><option>新建 Agent</option><option>AI 团队</option><option>技能调用</option><option>生成文件 / PPT</option></select></label><label>核心卖点<select><option>职业模板开箱即用</option><option>多 Agent 协同</option><option>复杂任务自动执行</option></select></label><label>应用场景<select value={scene} onChange={(e)=>setScene(e.target.value)}><option>自媒体运营</option><option>项目管理</option><option>行业研究</option><option>办公提效</option></select></label><label>目标人群<select><option>内容运营 / 创作者</option><option>团队管理者</option><option>知识工作者</option></select></label></div></div>
          <div className="form-section"><div className="form-title"><span>03</span><div><strong>视频规格</strong><small>Mock 结果会基于这些参数生成摘要卡片</small></div></div><div className="field-grid three"><label>渠道<select><option>常规投放</option><option>直播切片</option><option>商品素材</option></select></label><label>视频时长<select><option>40 秒</option><option>30 秒</option><option>45 秒</option><option>60 秒</option></select></label><label>画幅<select><option>9:16 竖屏</option><option>16:9 横屏</option><option>1:1 方形</option></select></label><label>视频结构<select><option>自然融入型</option><option>故事 + UI 证明</option><option>功能强演示型</option></select></label><label>真实 UI 深度<select><option>深度展示 · 完整用例</option><option>标准展示 · 关键节点</option><option>轻展示 · 结果证明</option></select></label><label>每次生成<select><option>5 条</option><option>8 条</option><option>10 条</option></select></label></div></div>
          <div className="form-section"><div className="form-title"><span>04</span><div><strong>探索与边界</strong><small>线上 Champion 保持稳定，留出小部分探索新机制</small></div></div><div className="explore-control"><div><span>Challenger 探索比例</span><strong>{explore}%</strong></div><input type="range" min="0" max="40" step="5" value={explore} onChange={(e)=>setExplore(Number(e.target.value))}/><p><span style={{width:`${100-explore}%`}}>Champion {100-explore}%</span><i style={{width:`${explore}%`}}>Challenger {explore}%</i></p></div><div className="boundary-row"><label><input type="checkbox" defaultChecked/> 必须使用真实扣子 UI</label><label><input type="checkbox" defaultChecked/> 工作流阶段逐步可见</label><label><input type="checkbox" defaultChecked/> 纯前端 Mock</label></div></div>
        </section>
        <aside className="job-preview"><p className="section-label">JOB PREVIEW</p><h3>任务预览</h3><div className="preview-summary"><span>目标</span><strong>{objective}</strong></div><div className="preview-summary"><span>功能 × 场景</span><strong>{feature} × {scene}</strong></div><div className="preview-summary"><span>运行模式</span><strong>纯前端 Mock Workflow</strong></div><div className="preview-flow">{workflowSteps.map((item,index)=><div key={item.key}><span>{index+1}</span><p><strong>{item.label}</strong><small>{item.detail}</small></p></div>)}</div><div className="estimate"><div><span>预计耗时</span><strong>9–11 秒演示</strong></div><div><span>输出</span><strong>阶段看板 + 结果卡片</strong></div></div><button className="submit-job" onClick={onSubmit} disabled={submitting}>{submitting ? '正在启动 Mock 工作流…' : '开始生成'} <span>→</span></button><small className="submit-note">当前不会触发后端 API，后续接真实服务时可直接替换为事件流。</small></aside>
      </div>
    </div>
  );
}

function LearningCenter() {
  return (
    <div className="learning-page">
      <div className="page-heading"><div><p className="section-label">LEARNING & EXPERIMENTS</p><h2>每周学习与实验中心</h2><span>AI 只能创建 Challenger；经过历史回放、人工抽查和小流量 A/B 后才能晋级。</span></div><button className="secondary-button"><span className="live-dot" />下次运行：周三 10:00</button></div>
      <div className="learning-stats"><article><span>本周新增素材</span><strong>27</strong><small>重复 / 同创意族 11</small></article><article><span>成熟指标快照</span><strong>84</strong><small>待观察 19</small></article><article><span>公式候选</span><strong>3</strong><small>通过历史回放 1</small></article><article><span>在线实验</span><strong>1</strong><small>预计 3 天后成熟</small></article></div>
      <div className="learning-grid">
        <section className="strategy-arena"><div className="card-head"><div><p className="section-label">CHAMPION VS CHALLENGER</p><h3>策略竞技场</h3></div><button>查看全部实验</button></div><div className="duel"><article className="champion"><div><span>CHAMPION</span><em>线上 v12</em></div><h4>职业模板开箱证明公式</h4><p>痛点点名 → 模板选择 → 技能证据 → 真实任务 → 结果兑现</p><dl><div><dt>历史样本</dt><dd>42</dd></div><div><dt>付费提升</dt><dd>+14.8%</dd></div><div><dt>置信度</dt><dd>0.86</dd></div></dl></article><div className="versus">VS</div><article className="challenger"><div><span>CHALLENGER</span><em>候选 v13</em></div><h4>结果前置 + 倒叙 UI 证明</h4><p>先展示成果 → 回放模板创建 → 技能解释 → 体验 CTA</p><dl><div><dt>回放得分</dt><dd>91</dd></div><div><dt>探索配额</dt><dd>20%</dd></div><div><dt>当前状态</dt><dd>人工抽查</dd></div></dl></article></div><div className="experiment-bar"><span style={{width:'80%'}}>Champion 80%</span><i style={{width:'20%'}}>Challenger 20%</i></div></section>
        <aside className="weekly-pipeline"><div className="card-head"><div><p className="section-label">WEEKLY PIPELINE</p><h3>本周自动学习</h3></div><span>周三触发</span></div>{['指标抓取与创意族去重','22 字段增量拆解','重新标注 Good / Bad / 待观察','挖掘公式与失效条件','生成 Challenger 与历史回放','小流量测试 / 晋级 / 回滚'].map((item,index)=><div className={`weekly-step ${index<4?'done':index===4?'active':''}`} key={item}><span>{index<4?'✓':index+1}</span><div><strong>{item}</strong><small>{index<4?'已完成':index===4?'运行中 · 1/3 通过':'等待指标成熟'}</small></div></div>)}</aside>
        <section className="candidate-table"><div className="card-head"><div><p className="section-label">CANDIDATE FORMULAS</p><h3>本周新发现的公式候选</h3></div><span>支持数与失效条件同时记录</span></div><div className="table-head"><span>候选机制</span><span>适用条件</span><span>支持</span><span>回放分</span><span>状态</span></div><div className="table-row"><strong>结果前置 + 倒叙 UI 证明</strong><span>高点击 · 新建 Agent</span><span>8</span><span>91</span><em className="reviewing">人工抽查</em></div><div className="table-row"><strong>技能数量量化 + 任务兑现</strong><span>高付费 · 自媒体</span><span>5</span><span>84</span><em>研究候选</em></div><div className="table-row"><strong>三段 Agent 接力状态切换</strong><span>留存 · AI 团队</span><span>4</span><span>88</span><em>历史回放</em></div></section>
      </div>
    </div>
  );
}
