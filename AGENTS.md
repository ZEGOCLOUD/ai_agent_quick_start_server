# AGENTS.md

本文档为编码代理提供在本仓库内安全工作的最小项目上下文。

## 项目概览

- 项目：ZEGO AI Agent quick start server
- 技术栈：Next.js 15 App Router、React 19、TypeScript
- 目的：提供服务端 API，用于 ZEGO Token 生成、AI agent 实例生命周期管理、数字人启动、回调接收，以及通用透传请求
- UI 范围：首页只是一个轻量级内部演示/调试面板，不是主要产品界面

## 运行与命令

- Node.js 要求：`>=18.18`
- 安装依赖：`npm install`
- 启动开发环境：`npm run dev`
- 生产构建：`npm run build`
- 启动生产服务：`npm run start`
- Lint：`npm run lint`

默认本地地址是 `http://localhost:3000`。

## 环境变量

运行前先将 `.env.example` 复制为 `.env`。

必需或常用变量：

- `NEXT_PUBLIC_ZEGO_APP_ID`
- `ZEGO_SERVER_SECRET`
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`
- `TTS_VENDOR`
- `TTS_API_KEY`
- `TTS_MODEL`
- `TTS_VOICE_ID`
- `TTS_GROUP_ID`
- `ADVANCED_CONFIG`：可选，JSON 字符串
- `LLM_SYSTEM_PROMPT`：可选

不要把密钥硬编码到源码或示例请求体中。

## 关键路径

- `src/app/page.tsx`：演示/管理风格首页，通过浏览器调用透传 API
- `src/app/api/zego-token/route.ts`：根据 `userId` 查询参数生成 ZEGO token
- `src/app/api/start/route.ts`：创建语音 AI agent 实例
- `src/app/api/start-digital-human/route.ts`：创建数字人实例；遇到并发限制时会回退到语音模式
- `src/app/api/start-live-digital-human/route.ts`：创建播报数字人实例；支持 RTC 或 CDN，RTC 参数不包含 `UserStreamId`
- `src/app/api/stop/route.ts`：删除 agent 实例
- `src/app/api/passthrough-request/route.ts`：ZEGO 动作的通用透传接口
- `src/app/api/callback/route.ts`：接收 ZEGO 回调事件并写日志
- `src/lib/zego/aiagent.ts`：ZEGO API 集成主逻辑
- `src/lib/zego/token_helper.ts`：token 生成辅助函数
- `src/lib/store.ts`：单个 `agentInstanceId` 的内存单例存储

## API 约定

- `GET /api/zego-token?userId=...`：必须提供 `userId`
- `POST /api/start`：请求体应包含 `user_id`、`room_id`、`user_stream_id`
- `POST /api/start-digital-human`：请求体应包含 `digital_human_id`、`config_id`、`user_id`、`room_id`、`user_stream_id`
- `POST /api/start-live-digital-human`：请求体应包含 `digital_human_id`、`config_id`，并在 `room_id` 与 `cdn_url` 中二选一；也兼容 ZEGO 原生 `AgentId`、`DigitalHuman`、`RTC`、`CDN` 等 PascalCase 字段
- `POST /api/stop`：当前要求请求体里提供 `agent_instance_id`
- `POST /api/passthrough-request`：请求体应为 `{ "action": string, "data"?: any }`

## 仓库已知特性与陷阱

- `src/lib/store.ts` 只做内存存储。服务重启后状态会丢失，也不适合多实例部署。
- `POST /api/start-live-digital-human` 的 RTC 模式由服务端生成 `AgentStreamId` 和 `AgentUserId`，客户端不需要传 `user_id` 或 `user_stream_id`。
- `CreateLiveDigitalHumanAgentInstance` 的 RTC 和 CDN 配置二选一；如果同时传入两个配置，按 ZEGO 接口规则优先生效 CDN。
- `src/app/api/stop/route.ts` 虽然引入了 `AgentStore`，但当前在 `agent_instance_id` 缺失时不会从 store 读取，而是直接返回 `404`。除非你明确要修复它，否则应按“请求体驱动”来理解当前行为。
- README 示例里有少量接口路径不一致问题，例如重复的 `/api/api/...`。以 route 文件为准，不要只信 README 文本。
- `src/lib/zego/token_helper.js` 与 TypeScript 版本并存。若未确认两者是否都仍然需要，不要只改其中一个。

## 修改建议

- 保持 App Router 结构和现有 route 文件布局。
- 优先做小而准的修改。这个仓库是 quick-start sample，简单性比抽象层次更重要。
- 除非用户明确要求破坏性变更，否则保持请求/响应结构向后兼容。
- 如果修改了 API 合约，同时更新 `README.md` 和 `README_EN.md`。
- 如果改动了环境变量要求，同一变更里同步更新 `.env.example` 和相关文档。
- 修改已有文件时，保持双语注释和用户可见文案与当前代码风格一致。

## 验证

代码改动后，优先执行以下最小验证集：

1. `npm run lint`
2. `npm run build`

如果 API route 的行为发生变化，再额外用具体请求体对相关接口做一次本地验证。

## 对后续 Agent 的安全假设

- 这个仓库本质上是示例后端，不是强化过的生产服务。
- 回调处理是有意保持最小实现，主要依赖日志。
- 首页用于手动查看或触发 ZEGO agent 相关操作。
- 当文档说明与 route 实现冲突时，以源码为准。
