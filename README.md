# 扣子全自动视频素材生产工作台

前端仓库，对接 `coze-video-aime-service` 的 FastAPI 接口。

## 本地联调

先启动 Aime 后端（默认 `http://localhost:8000`），再启动前端：

```bash
cp .env.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_AIME_API_BASE_URL` 未配置时，前端默认调用线上 Aime mock 后端（`https://seekers-released-generations-blue.trycloudflare.com`）；如需本地联调，可在 `.env.local` 中覆盖为本地地址。

## 已接通的接口

- 创建任务与 SSE 实时进度
- 查询和修改多轨时间线（带 `base_version` 乐观锁）
- 重试失败节点
- 触发渲染
- 获取媒体清单
- 提交 mock 审核

## 协作边界

- 前端负责交互、数据展示、API Client 与演示降级。
- Aime 后端负责任务编排、状态持久化、媒体处理与第三方系统集成。
- API 字段或状态机变更应先更新双方共享契约，再分别实现，避免前后端互相猜字段。
