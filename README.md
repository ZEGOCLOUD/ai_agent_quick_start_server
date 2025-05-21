# AI Agent 服务端示例使用说明

[![English](https://img.shields.io/badge/language-English-blue.svg)](./README_EN.md) [![中文](https://img.shields.io/badge/language-中文-red.svg)](./README.md)

本项目提供了一个快速启动 ZEGO AI Agent 服务的示例服务端，支持本地运行和云端部署。


- [AI Agent 服务端示例使用说明](#ai-agent-服务端示例使用说明)
  - [部署和运行](#部署和运行)
    - [本地运行](#本地运行)
    - [部署到 Netlify](#部署到-netlify)
    - [部署到 Vercel](#部署到-vercel)
  - [使用服务](#使用服务)
  - [项目结构](#项目结构)


## 部署和运行

### 本地运行

你可以在本地安装依赖环境后，在本地启动服务端，然后客户端通过连接到同一个局域网访问相应接口。

1. 请安装[Node.js 18.18](https://nodejs.org/)或以上版本。
2. 将本仓库代码下载至本地
3. 将 `.env.example` 文件拷贝为 `.env` 并按说明填写好所有环境变量的值（如ZEGO APPID、LLM、TTS）。
4. 进入项目根目录运行以下命令以启动服务。
```bash
npm install
npm run dev
```

运行完成后，可以打开 [http://localhost:3000](http://localhost:3000) 查看运行结果。

在运行成功后，即可调用以下接口：
1. 获取 Token：`http://localhost:3000/api/agent/zego-token`
2. 开始与智能体通话： `http://localhost:3000/api/start`
3. 结束与智能体通话： `http://localhost:3000/api/stop`

注意：如果是在 PC/Mac 上运行服务端然后在 Android 或者 iOS 等移动设备上调试，请把 `localhost` 替换成 PC/Mac 的实际局域网地址进行访问。

### 部署到 Netlify

请注意⚠️：中国大陆建议使用该方式

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ZEGOCLOUD/ai_agent_quick_start_server&branch=im_and_voice)

点击上方按钮可以一键将此项目部署到 Netlify 平台。
部署过程中，您需要导入所有必要的环境变量。具体步骤如下：

1. 在 Netlify 平台跳转到 `你的Site实例 -> Site configuration -> Environment variables`
2. 点击右侧的 `Add a variable` 并选择 `Import from a .env file`，然后将以下内容拷贝到输入框（Contents of .env file:）中，然后点击 `Import variables`。
```bash
# 请替换成您实际的内容
NEXT_PUBLIC_ZEGO_APP_ID=
ZEGO_SERVER_SECRET=

LLM_API_KEY=
LLM_BASE_URL=https://****************/chat/completions
LLM_MODEL=deepseek-v3-250324

TTS_BYTEDANCE_APP_ID=4******9
TTS_BYTEDANCE_TOKEN=N8I************************stqp
TTS_BYTEDANCE_CLUSTER=volcano_tts
TTS_BYTEDANCE_VOICE_TYPE=zh_female_wanwanxiaohe_moon_bigtts
```
![](./images/import-env.png)
3. 跳转到 `Deploys` 页面并点击右侧的 `Trigger deploy` 然后选择 `Deploy site` 选项触发网站重新构建
![deploy-site.png](./images/deploy-site.png)
4. 部署完成后，在 `Site overview` 页面即可查看到您网站的域名。
![](./images/site-overview.png)

使用该域名可访问API接口：
1. 获取 Token：`https://cute-******.netlify.app/api/agent/zego-token`
2. 开始与智能体通话： `https://cute-******.netlify.app/api/start`
3. 结束与智能体通话： `https://cute-******.netlify.app/api/stop`

### 部署到 Vercel

请注意⚠️：中国大陆访问Vercel可能会有问题。如果无法访问请科学上网。在部署好后的服务绑定自己申请的域名也可以正常访问（注意域名被墙的风险）。

[![部署到Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZEGOCLOUD%2Fai_agent_quick_start_server&branch-name=im_and_voice&env=NEXT_PUBLIC_ZEGO_APP_ID,ZEGO_SERVER_SECRET,LLM_API_KEY,LLM_BASE_URL,LLM_MODEL,TTS_BYTEDANCE_APP_ID,TTS_BYTEDANCE_TOKEN,TTS_BYTEDANCE_CLUSTER,TTS_BYTEDANCE_VOICE_TYPE&envDescription=这些是启动ZEGO的AI代理服务器所需的环境变量。请查看下方文档获取更多信息。&envLink=https://github.com/zegoim/aiagent-server-quickstart-sample/blob/main/.env.example)

点击上方按钮可以一键将此项目部署到Vercel平台。部署过程中，您需要填写所有必要的环境变量。关于环境变量的详细说明，请参考[.env.example](.env.example)文件。

![](./images/vercel-server.png)

使用该域名可访问API接口：
1. 获取 Token：`https://****.vercel.app/api/agent/zego-token`
2. 开始与智能体通话： `https://****.vercel.app/api/start`
3. 结束与智能体通话： `https://****.vercel.app/api/stop`

## 使用服务

客户端需要集成 ZEGO Express SDK 并与 AI agent 实例加入同一个房间，以进行推拉流来实现语音交互。因此，使用此服务的步骤如下：

1. 客户端调用 `/api/api/zego-token` 接口获取 ZEGO Token，用于使用 ZEGO Express SDK 登录房间。
2. 客户端进入房间，进行推拉流，并调用 `/api/api/start` 接口通知 AI Agent 服务创建 AI agent 实例（在本示例中，roomID、userID 和 streamID 已预定义，因此无需传递参数）。

完成这两个步骤后，您就可以在客户端使用语音与 AI agent 进行交互。

当需要结束通话时，调用 `/api/api/stop` 接口通知 AI Agent 服务删除 AI agent 实例。

## 项目结构

项目源代码结构如下：

```
src
├── app
│   ├── api
│   │   ├── callback
│   │   │   └── route.ts        # 回调接口处理。请联系 ZEGO 技术支持配置以接收回调事件。
│   │   ├── passthrough-request
│   │   │   └── route.ts        # 透传请求处理
│   │   ├── start
│   │   │   └── route.ts        # 启动 AI Agent 实例
│   │   ├── stop
│   │   │   └── route.ts        # 停止 AI Agent 实例
│   │   └── zego-token
│   │       └── route.ts        # ZEGO Token 生成接口
└── lib
    ├── logger.ts               # 日志工具
    └── zego
        ├── aiagent.ts          # ZEGO AI Agent PaaS 接口请求逻辑
        └── token_helper.ts     # ZEGO Token 生成工具
```

