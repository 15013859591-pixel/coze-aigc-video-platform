'use client';

import { useState, type DragEvent } from 'react';

type View = 'tasks' | 'create' | 'learning';
type DetailTab = 'overview' | 'timeline' | 'evidence' | 'review';

const jobs = [
  { name: '职业模板 · 自媒体运营', id: 'VID-0825-014', state: 'UI 执行中', progress: '52%', tone: 'purple' },
  { name: 'AI 团队 · 项目管理', id: 'VID-0825-013', state: '脚本质检', progress: '31%', tone: 'blue' },
  { name: 'PPT · 一句话生成', id: 'VID-0825-012', state: '变色龙审核', progress: '92%', tone: 'orange' },
  { name: '爆款追踪 · 周报', id: 'VID-0825-011', state: '已通过', progress: '100%', tone: 'green' },
];

const engines = [
  { index: '01', name: '内容智能', detail: '案例检索 · 公式选择 · 脚本合同', state: '已完成', kind: 'done' },
  { index: '02', name: 'UI 用例执行', detail: '真实操作 · 断言 · 自动录屏', state: '执行中 3/7', kind: 'active' },
  { index: '03', name: 'AIGC 画面', detail: '真人场景 · B-roll · 非 UI 镜头', state: '并行生成', kind: 'working' },
  { index: '04', name: '确定性渲染', detail: 'TTS · 字幕 · 音效 · 剪辑', state: '等待素材', kind: 'waiting' },
  { index: '05', name: '学习与实验', detail: '质检 · 送审 · 指标回流', state: '等待成片', kind: 'waiting' },
];

const uiSteps = [
  { label: '打开新建 Agent', meta: '断言：新建 Agent 弹窗', state: 'done' },
  { label: '选择职业模板', meta: '断言：模板列表可见', state: 'done' },
  { label: '自媒体运营达人', meta: '断言：至少 2 项技能可见', state: 'active' },
  { label: '创建并进入对话', meta: '等待执行', state: 'waiting' },
  { label: '发送真实内容任务', meta: '等待执行', state: 'waiting' },
  { label: '等待并滚动结果', meta: '等待执行', state: 'waiting' },
];

const qualityChecks = [
  ['产品事实有来源', '通过'],
  ['UI 版本与结果完整', '执行中'],
  ['口播 / UI / 字幕对齐', '等待'],
  ['OCR 可读与遮挡检测', '等待'],
  ['隐私与内部数据脱敏', '已启用'],
  ['变色龙送审', '待提交'],
];

const initialClips = [
  { id: 1, label: '痛点钩子', start: 1, width: 17, color: 'slate' },
  { id: 2, label: '选择模板', start: 20, width: 19, color: 'purple' },
  { id: 3, label: '包含技能', start: 41, width: 18, color: 'orange' },
  { id: 4, label: '输入任务', start: 62, width: 17, color: 'blue' },
  { id: 5, label: '结果证明', start: 81, width: 18, color: 'green' },
];

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

  const moveClip = (event: DragEvent<HTMLButtonElement>, clipId: number) => {
    const track = event.currentTarget.parentElement;
    if (!track) return;
    const box = track.getBoundingClientRect();
    const clip = clips.find((item) => item.id === clipId);
    if (!clip) return;
    const next = Math.max(0, Math.min(100 - clip.width, ((event.clientX - box.left) / box.width) * 100 - clip.width / 2));
    setClips((items) => items.map((item) => item.id === clipId ? { ...item, start: Number(next.toFixed(1)) } : item));
    setTimelineEdited(true);
  };

  const submitJob = () => {
    setCreated(true);
    setView('tasks');
    setDetailTab('overview');
    setRunning(true);
  };

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
            <button className="system-status"><span className="live-dot" />5 个引擎正常</button>
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
            {created && <div className="success-toast"><span>✓</span> 新任务已创建，系统正在检索案例并生成多候选脚本。<button onClick={() => setCreated(false)}>×</button></div>}
            {view === 'tasks' && (
              <TaskDetail
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                running={running}
                setRunning={setRunning}
                clips={clips}
                moveClip={moveClip}
                timelineEdited={timelineEdited}
                setTimelineEdited={setTimelineEdited}
              />
            )}
            {view === 'create' && (
              <CreateTask
                objective={objective} setObjective={setObjective}
                feature={feature} setFeature={setFeature}
                scene={scene} setScene={setScene}
                explore={explore} setExplore={setExplore}
                onSubmit={submitJob}
              />
            )}
            {view === 'learning' && <LearningCenter />}
          </section>
        </div>
      </section>
    </main>
  );
}

function TaskDetail({ detailTab, setDetailTab, running, setRunning, clips, moveClip, timelineEdited, setTimelineEdited }: {
  detailTab: DetailTab;
  setDetailTab: (tab: DetailTab) => void;
  running: boolean;
  setRunning: (value: boolean) => void;
  clips: typeof initialClips;
  moveClip: (event: DragEvent<HTMLButtonElement>, clipId: number) => void;
  timelineEdited: boolean;
  setTimelineEdited: (value: boolean) => void;
}) {
  return (
    <>
      <section className="task-hero">
        <div className="task-hero-main">
          <div className="brief-icon">职</div>
          <div>
            <div className="title-line"><p className="section-label">VID-0825-014 · GENERATION JOB</p><span className="status-pill"><i /> UI_EXECUTING</span></div>
            <h2>职业模板 × 自媒体运营</h2>
            <div className="tag-row"><span>付费 × 次留双高</span><span>高付费素材</span><span>40 秒 · 9:16</span><span>真实 UI 深度展示</span></div>
          </div>
        </div>
        <div className="hero-score"><div className="score-ring"><strong>92</strong><span>/100</span></div><div><strong>脚本质量</strong><small>6 Goodcase · 3 Badcase</small><em>Champion 公式 v12</em></div></div>
      </section>

      <section className="engine-strip">
        <div className="strip-heading"><div><p className="section-label">FIVE VERSIONED ENGINES</p><h3>五引擎生产链路</h3></div><span>质量门槛贯穿全链路</span></div>
        <div className="engine-grid">
          {engines.map((engine, index) => <article className={`engine-card ${engine.kind}`} key={engine.index}>
            <div className="engine-top"><span>{engine.index}</span><i>{engine.kind === 'done' ? '✓' : engine.kind === 'active' ? '●' : engine.kind === 'working' ? '↗' : '○'}</i></div>
            <strong>{engine.name}</strong><p>{engine.detail}</p><small>{engine.state}</small>{index < engines.length - 1 && <b className="engine-arrow">→</b>}
          </article>)}
        </div>
      </section>

      <nav className="detail-tabs" aria-label="任务详情">
        {([['overview','执行总览'],['timeline','多轨时间线'],['evidence','案例与公式'],['review','质检与送审']] as [DetailTab,string][]).map(([key,label]) => <button key={key} className={detailTab === key ? 'active' : ''} onClick={() => setDetailTab(key)}>{label}{key === 'review' && <span>3</span>}</button>)}
        <div className="version-label">策略集合 v12.4 · 产品事实 v28</div>
      </nav>

      {detailTab === 'overview' && <Overview running={running} setRunning={setRunning} />}
      {detailTab === 'timeline' && <TimelineView clips={clips} moveClip={moveClip} timelineEdited={timelineEdited} setTimelineEdited={setTimelineEdited} />}
      {detailTab === 'evidence' && <EvidenceView />}
      {detailTab === 'review' && <ReviewView />}
    </>
  );
}

function Overview({ running, setRunning }: { running: boolean; setRunning: (value: boolean) => void }) {
  return (
    <div className="overview-grid">
      <section className="execution-card">
        <div className="card-head">
          <div><p className="section-label">LIVE UI EXECUTION</p><h3>扣子 UI 自动执行现场</h3></div>
          <div className="capability-chip">coze.agent.create_from_role_template.v1</div>
        </div>
        <div className="execution-body">
          <div className="mock-browser">
            <div className="browser-bar"><div className="traffic"><i /><i /><i /></div><span>扣子 · 选择职业模板</span><b>● REC 1080P</b></div>
            <div className="coze-screen">
              <aside><strong>扣子</strong><i /><i /><i /><i /></aside>
              <div className="template-screen">
                <div className="template-title"><span>选择职业模板</span><small>根据你的工作场景选择合适的 Agent</small></div>
                <div className="template-list"><div><i>运</i><span><b>运营增长</b><small>适合内容与增长场景</small></span></div><div className="selected"><i>媒</i><span><b>自媒体运营达人</b><small>爆款洞察 · 多平台创作</small></span></div><div><i>研</i><span><b>行业研究员</b><small>研究分析与报告生成</small></span></div></div>
                <div className="template-detail"><div className="detail-hero"><i>媒</i><span><b>自媒体运营达人</b><small>你的全栈内容增长搭档</small></span></div><p>包含技能</p><div className="skill-pills"><span>小红书文案创作</span><span>全网热搜榜</span><span>多平台违禁词</span><span>公众号文案创作</span></div><button>下一步</button></div>
                <div className="capture-focus"><span>里程碑 03 · 技能区域已捕获</span></div>
              </div>
            </div>
          </div>
          <div className="step-console">
            <div className="console-head"><span>执行步骤</span><small>3 / 6</small></div>
            {uiSteps.map((step, index) => <div className={`console-step ${step.state}`} key={step.label}><span>{step.state === 'done' ? '✓' : index + 1}</span><div><strong>{step.label}</strong><small>{step.meta}</small></div>{step.state === 'active' && <i>执行中</i>}</div>)}
            <button className={`execution-button ${running ? 'running' : ''}`} onClick={() => setRunning(!running)}><span>{running ? 'Ⅱ' : '▶'}</span><div><strong>{running ? '暂停当前执行' : '继续执行用例'}</strong><small>失败自动重定位 2 次</small></div></button>
          </div>
        </div>
        <div className="execution-footer"><span><i className="green-dot" />DOM 语义定位</span><span>沙盒账号</span><span>隐私遮罩已开启</span><span>步骤日志实时保存</span></div>
      </section>

      <aside className="reason-card">
        <div className="card-head"><div><p className="section-label">GENERATION RATIONALE</p><h3>生成依据</h3></div><button>查看详情</button></div>
        <div className="formula-summary"><span>Champion</span><strong>职业模板开箱证明公式</strong><small>formula_v12 · 置信度 0.86</small><p>痛点点名 → 模板选择 → 技能证据 → 真实任务 → 结果兑现 → 体验 CTA</p></div>
        <div className="case-counts"><div><span className="case-icon good">G</span><p><strong>6 条 Goodcase</strong><small>同目标 · 同渠道 · 同场景</small></p><b>40%</b></div><div><span className="case-icon adjacent">↗</span><p><strong>3 条相邻案例</strong><small>同功能 · 迁移场景</small></p><b>20%</b></div><div><span className="case-icon bad">B</span><p><strong>3 条 Badcase</strong><small>禁止模式与边界</small></p><b>20%</b></div><div><span className="case-icon explore">✦</span><p><strong>2 条探索机制</strong><small>低频新结构</small></p><b>20%</b></div></div>
        <div className="reason-note"><span>为什么这样生成</span><p>双高目标要求“钩子、真实证据、长期使用链和唯一 CTA”同时成立；关键 UI 默认全屏，避免证据不可读。</p></div>
      </aside>

      <section className="node-tracker">
        <div className="card-head"><div><p className="section-label">NODE STATUS</p><h3>任务节点与可重试状态</h3></div><span className="eta">预计剩余 11 分钟</span></div>
        <div className="node-row"><div className="node done"><i>✓</i><span><strong>RETRIEVING</strong><small>案例与公式检索</small></span></div><b>→</b><div className="node done"><i>✓</i><span><strong>SCRIPT_QA</strong><small>脚本 92 分</small></span></div><b>→</b><div className="node active"><i>●</i><span><strong>UI_EXECUTING</strong><small>第 3 / 6 步</small></span></div><b>→</b><div className="node working"><i>↗</i><span><strong>AIGC_GENERATING</strong><small>4 / 7 镜头</small></span></div><b>→</b><div className="node"><i>○</i><span><strong>COMPOSITING</strong><small>等待媒体</small></span></div><b>→</b><div className="node"><i>○</i><span><strong>REVIEWING</strong><small>变色龙</small></span></div></div>
      </section>
    </div>
  );
}

function TimelineView({ clips, moveClip, timelineEdited, setTimelineEdited }: { clips: typeof initialClips; moveClip: (event: DragEvent<HTMLButtonElement>, clipId: number) => void; timelineEdited: boolean; setTimelineEdited: (value: boolean) => void }) {
  const tracks = ['口播 / TTS', '画面来源', '真实 UI', '字幕', '音效'];
  return (
    <div className="timeline-layout">
      <section className="contract-card">
        <div className="card-head">
          <div><p className="section-label">MACHINE-EXECUTABLE CONTRACT</p><h3>多轨时间线合同</h3></div>
          <div className="timeline-actions"><span>{timelineEdited ? '● 新版本未保存' : '✓ timeline_v3 已保存'}</span><button onClick={() => setTimelineEdited(false)} disabled={!timelineEdited}>保存为新版本</button></div>
        </div>
        <p className="contract-tip">拖动 UI 片段可以调整开始时间；正式系统会保存为新版本并触发对应渲染节点重跑。</p>
        <div className="time-ruler"><span />{['00:00','00:05','00:10','00:15','00:20','00:25','00:30','00:35','00:40'].map((time) => <i key={time}>{time}</i>)}</div>
        <div className="contract-tracks">
          {tracks.map((track, row) => <div className="contract-row" key={track}><strong>{track}</strong><div className={`track-lane row-${row}`}>
            {row === 0 && <div className="waveform">{Array.from({length: 80}).map((_, index) => <i key={index} style={{height: `${5 + ((index * 13) % 18)}px`}} />)}</div>}
            {row === 1 && <><span className="source-block aigc" style={{left:'1%',width:'17%'}}>AIGC 痛点</span><span className="source-block ui" style={{left:'20%',width:'59%'}}>真实扣子 UI 录屏</span><span className="source-block aigc" style={{left:'81%',width:'18%'}}>CTA 场景</span></>}
            {row === 2 && clips.map((clip) => <button draggable onDragEnd={(event) => moveClip(event, clip.id)} className={`drag-clip ${clip.color}`} style={{left:`${clip.start}%`,width:`${clip.width}%`}} key={clip.id}><b>⠿</b>{clip.label}</button>)}
            {row === 3 && <div className="subtitle-line"><span>做内容最浪费时间的</span><span>不是写，而是每次从零搭流程</span><span>直接选职业模板</span><span>让扣子替你跑完整链路</span></div>}
            {row === 4 && <><span className="sfx" style={{left:'22%'}}>● click</span><span className="sfx" style={{left:'43%'}}>● reveal</span><span className="sfx" style={{left:'84%'}}>● rise</span></>}
          </div></div>)}
          <div className="timeline-playhead"><span>08.4s</span></div>
        </div>
      </section>
      <aside className="shot-inspector">
        <div className="card-head"><div><p className="section-label">SHOT INSPECTOR</p><h3>S001_SH03</h3></div><span className="version-chip">v3</span></div>
        <dl><div><dt>起止时间</dt><dd>05.2s — 10.4s</dd></div><div><dt>画面来源</dt><dd>real_ui_recording</dd></div><div><dt>用例 ID</dt><dd>UC_CREATE_AGENT_TEMPLATE</dd></div><div><dt>录屏素材</dt><dd className="pending-text">执行后回填</dd></div><div><dt>合成模式</dt><dd>fullscreen</dd></div><div><dt>裁切目标</dt><dd>active_panel</dd></div></dl>
        <div className="shot-box"><span>产品事实证据</span><p>页面可见“自媒体运营达人”及至少两项包含技能。</p></div>
        <div className="shot-box warning"><span>失败降级</span><p>UI 执行失败时使用版本化模板列表录屏，不允许让视频模型伪造界面。</p></div>
        <div className="keyframe"><span>06.7s</span><div><i /><b>1.35× 放大</b><small>target: selected_template</small></div></div>
      </aside>
    </div>
  );
}

function EvidenceView() {
  return (
    <div className="evidence-layout">
      <section className="evidence-main">
        <div className="card-head"><div><p className="section-label">RETRIEVAL EVIDENCE</p><h3>本次检索的案例与机制</h3></div><div className="filter-chips"><span>同目标</span><span>同渠道</span><span>自媒体</span></div></div>
        <div className="case-grid">
          <article className="case-card good"><div><span>GOODCASE · GC-128</span><b>质量分 94</b></div><h4>先展示技能，再用真实任务兑现</h4><p>模板技能清单在 7.2s 进入全屏，随后立即输入任务，结果证据与承诺一致。</p><footer><span>付费 +18%</span><span>次留 +11%</span><em>支持公式 v12</em></footer></article>
          <article className="case-card good"><div><span>GOODCASE · GC-097</span><b>质量分 91</b></div><h4>人群痛点与 UI 操作一一对应</h4><p>开头点名内容运营的重复劳动，UI 连续展示选择、输入和结果，没有空泛口播。</p><footer><span>CTR +13%</span><span>完播 +8%</span><em>相邻机制</em></footer></article>
          <article className="case-card bad"><div><span>BADCASE · BC-036</span><b>质量分 67</b></div><h4>关键 UI 缩成画中画，证据不可读</h4><p>失败发生在 08.4s：技能名称过小，用户无法确认卖点。反事实修法：改为全屏并放大。</p><footer><span>付费 -9%</span><span>3s 留存正常</span><em>禁止模式</em></footer></article>
          <article className="case-card explore"><div><span>EXPLORE · EX-014</span><b>待验证</b></div><h4>先亮结果，再回放模板创建过程</h4><p>采用结果前置与倒叙 UI 证明，可能提升点击，但需要验证是否影响长期信任。</p><footer><span>探索配额</span><span>样本不足</span><em>Challenger</em></footer></article>
        </div>
      </section>
      <aside className="schema-card"><div className="card-head"><div><p className="section-label">BREAKDOWN SCHEMA</p><h3>22 字段拆解质量</h3></div><strong>92</strong></div><div className="schema-progress"><span /></div><div className="schema-list"><p><i>✓</i> 事实与时间码证据 <b>20/20</b></p><p><i>✓</i> 逐镜覆盖完整度 <b>14/15</b></p><p><i>✓</i> 转场与剪辑逻辑 <b>9/10</b></p><p><i>✓</i> 功能与结果证据 <b>12/12</b></p><p><i>✓</i> 标签与字段一致 <b>5/5</b></p></div><div className="schema-note"><span>字段补强</span><p>已包含「分镜分析」和「分镜转化分析」，从 00:00 连续覆盖片尾。</p></div></aside>
    </div>
  );
}

function ReviewView() {
  return (
    <div className="review-layout">
      <section className="quality-card"><div className="card-head"><div><p className="section-label">AUTOMATIC QUALITY GATES</p><h3>自动质检门槛</h3></div><span className="quality-overall">3 / 6 完成</span></div><div className="quality-list">{qualityChecks.map(([label,status], index) => <div key={label}><span className={`quality-check ${index < 3 ? 'passed' : ''}`}>{index < 3 ? '✓' : '○'}</span><strong>{label}</strong><small className={status === '执行中' ? 'running-text' : ''}>{status}</small><button>查看</button></div>)}</div></section>
      <aside className="submission-card"><p className="section-label">CHAMELEON REVIEW</p><h3>变色龙送审</h3><div className="submission-visual"><span>变</span><div><strong>等待视频质检通过</strong><small>通过后自动提交并保存回执</small></div></div><dl><div><dt>送审版本</dt><dd>render_v4</dd></div><div><dt>当前状态</dt><dd>REVIEW_SUBMITTING</dd></div><div><dt>驳回处理</dt><dd>定位节点后局部重跑</dd></div></dl><button disabled>提交变色龙审核</button><p>接口不可用时进入 NEEDS_HUMAN，不伪造送审成功。</p></aside>
      <section className="version-history"><div className="card-head"><div><p className="section-label">TRACEABLE VERSIONS</p><h3>版本与修改记录</h3></div><button>比较版本</button></div><div className="history-row"><span>v4</span><div><strong>自动修复字幕安全区</strong><small>edit_policy_v7 · 5 分钟前</small></div><em>当前</em></div><div className="history-row"><span>v3</span><div><strong>人工将关键 UI 改为全屏</strong><small>修改人：余 · 12 分钟前</small></div><em>已保留</em></div><div className="history-row"><span>v2</span><div><strong>UI 用例重规划：补充包含技能断言</strong><small>ui_planner_v5 · 18 分钟前</small></div><em>已保留</em></div></section>
    </div>
  );
}

function CreateTask({ objective, setObjective, feature, setFeature, scene, setScene, explore, setExplore, onSubmit }: { objective: string; setObjective: (v:string)=>void; feature: string; setFeature:(v:string)=>void; scene:string; setScene:(v:string)=>void; explore:number; setExplore:(v:number)=>void; onSubmit:()=>void }) {
  return (
    <div className="create-page">
      <div className="page-heading"><div><p className="section-label">CREATE GENERATION JOB</p><h2>创建视频生成任务</h2><span>只选择业务目标，系统自动检索案例、编译 Prompt 并生成完整多轨合同。</span></div><button className="secondary-button">保存草稿</button></div>
      <div className="create-grid">
        <section className="form-card">
          <div className="form-section"><div className="form-title"><span>01</span><div><strong>视频目标</strong><small>决定案例筛选、评分器和公式权重</small></div></div><div className="option-grid four">{['高点击','高付费','高留存','付费 × 次留双高'].map((item)=><button className={objective===item?'selected':''} onClick={()=>setObjective(item)} key={item}>{item}{objective===item&&<i>✓</i>}</button>)}</div></div>
          <div className="form-section"><div className="form-title"><span>02</span><div><strong>宣发内容</strong><small>来自风神标签和当前有效产品能力</small></div></div><div className="field-grid"><label>功能<select value={feature} onChange={(e)=>setFeature(e.target.value)}><option>新建 Agent</option><option>AI 团队</option><option>技能调用</option><option>生成文件 / PPT</option></select></label><label>核心卖点<select><option>职业模板开箱即用</option><option>多 Agent 协同</option><option>复杂任务自动执行</option></select></label><label>应用场景<select value={scene} onChange={(e)=>setScene(e.target.value)}><option>自媒体运营</option><option>项目管理</option><option>行业研究</option><option>办公提效</option></select></label><label>目标人群<select><option>内容运营 / 创作者</option><option>团队管理者</option><option>知识工作者</option></select></label></div></div>
          <div className="form-section"><div className="form-title"><span>03</span><div><strong>视频规格</strong><small>高级参数默认由系统按渠道最优策略选择</small></div></div><div className="field-grid three"><label>渠道<select><option>常规投放</option><option>直播切片</option><option>商品素材</option></select></label><label>视频时长<select><option>40 秒</option><option>30 秒</option><option>45 秒</option><option>60 秒</option></select></label><label>画幅<select><option>9:16 竖屏</option><option>16:9 横屏</option><option>1:1 方形</option></select></label><label>视频结构<select><option>自然融入型</option><option>故事 + UI 证明</option><option>功能强演示型</option></select></label><label>真实 UI 深度<select><option>深度展示 · 完整用例</option><option>标准展示 · 关键节点</option><option>轻展示 · 结果证明</option></select></label><label>每次生成<select><option>5 条</option><option>8 条</option><option>10 条</option></select></label></div></div>
          <div className="form-section"><div className="form-title"><span>04</span><div><strong>探索与边界</strong><small>线上 Champion 保持稳定，留出小部分探索新机制</small></div></div><div className="explore-control"><div><span>Challenger 探索比例</span><strong>{explore}%</strong></div><input type="range" min="0" max="40" step="5" value={explore} onChange={(e)=>setExplore(Number(e.target.value))}/><p><span style={{width:`${100-explore}%`}}>Champion {100-explore}%</span><i style={{width:`${explore}%`}}>Challenger {explore}%</i></p></div><div className="boundary-row"><label><input type="checkbox" defaultChecked/> 必须使用真实扣子 UI</label><label><input type="checkbox" defaultChecked/> 禁止虚假数据与稀缺性</label><label><input type="checkbox" defaultChecked/> 自动送审变色龙</label></div></div>
        </section>
        <aside className="job-preview"><p className="section-label">JOB PREVIEW</p><h3>任务预览</h3><div className="preview-summary"><span>目标</span><strong>{objective}</strong></div><div className="preview-summary"><span>功能 × 场景</span><strong>{feature} × {scene}</strong></div><div className="preview-summary"><span>首条 MVP 用例</span><strong>职业模板创建完整链路</strong></div><div className="preview-flow">{['检索案例','生成脚本','UI 执行','AIGC 镜头','自动合成','质检送审'].map((item,index)=><div key={item}><span>{index+1}</span><p><strong>{item}</strong><small>{index===0?'6 Goodcase + 3 Badcase':'自动完成'}</small></p></div>)}</div><div className="estimate"><div><span>预计耗时</span><strong>18–25 分钟</strong></div><div><span>输出</span><strong>5 条候选视频</strong></div></div><button className="submit-job" onClick={onSubmit}>开始全自动生成 <span>→</span></button><small className="submit-note">Prompt、公式和模型版本会自动记录，可追溯和回滚。</small></aside>
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
