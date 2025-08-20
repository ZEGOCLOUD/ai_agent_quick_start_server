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
### 部署到 Netlify

请注意⚠️：中国大陆建议使用该方式

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ZEGOCLOUD/ai_agent_quick_start_server&branch=rag)

点击上方按钮可以一键将此项目部署到 Netlify 平台。
部署过程中，您需要导入所有必要的环境变量。具体步骤如下：

1. 在 Netlify 平台跳转到 `你的Site实例 -> Site configuration -> Environment variables`
2. 点击右侧的 `Add a variable` 并选择 `Import from a .env file`，然后将以下内容拷贝到输入框（Contents of .env file:）中，然后点击 `Import variables`。
注意⚠️：请将LLM_BASE_URL的yourdomain替换成刚部署成功后站点的域名。

```bash
# 您从 ZEGO 控制台（https://console.zego.im/）获取的AppID和ServerSecret
# AppID and ServerSecret obtained by you from ZEGOCLOUD console（https://console.zegocloud.com/）
NEXT_PUBLIC_ZEGO_APP_ID=
ZEGO_SERVER_SECRET=

# 您自己提供符合 OpenAPI 规范 LLM 接口地址。AIAgent 将会直接向这个接口发起请求。注意，必须是可以通过外网访问的 URL 而不能是局域网地址或者 localhost。
LLM_BASE_URL=https://***.netlify.app/api/chat/completions
# 真实 LLM 服务提供商提供的 URL、Key和Model。在您自己定义的 LLM 接口内部调用。
LLM_BASE_URL_REAL=https://ark.cn-beijing.volces.com/api/v3/
LLM_API_KEY=**********
LLM_MODEL=doubao-1-5-lite-32k-250115

# 使用哪个知识库（ragflow或者bailian）。按 KB_TYPE 配置以下对应的知识库环境变量。不使用不用配置。
KB_TYPE=bailian
# 使用查询返回的片段数量
KB_CHUNK_COUNT=8

# 您自己部署的 RAGFlow 服务。
# RAGFlow 文档地址：https://ragflow.io/docs/dev/
RAGFLOW_KB_DATASET_ID=947499c*************
RAGFLOW_API_ENDPOINT=https://demo.ragflow.io/
RAGFLOW_API_KEY=ragflow-**********

# 百炼知识库使用指南：https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.7ba312d5YW74o6&tab=doc#/doc/?type=app&url=2807740
# 百炼知识库API指南地址：https://bailian.console.aliyun.com/?spm=5176.29619931.J_AHgvE-XDhTWrtotIBlDQQ.13.74cd521cb6A3jn&tab=doc#/doc/?type=app&url=2852772
# 如何创建 ACCESS_KEY 及 ACCESS_KEY_SECRET：https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair?spm=a2c4g.11186623.0.i2
ALIBABA_CLOUD_ACCESS_KEY_ID='您的阿里云访问密钥ID'
ALIBABA_CLOUD_ACCESS_KEY_SECRET='您的阿里云访问密钥密码'
ALIBABA_CLOUD__SERVICE_ENDPOINT=bailian.cn-beijing.aliyuncs.com
# 如何获取阿里云百炼业务空间ID：https://bailian.console.aliyun.com/?spm=5176.29619931.J_AHgvE-XDhTWrtotIBlDQQ.13.74cd521cb6A3jn&tab=doc#/doc/?type=model&url=2587495
ALIBABA_CLOUD_BAILIAN_WORKSPACE_ID='您的阿里云百炼业务空间ID'
# 如何获取阿里云百炼知识库ID：阿里云百炼控制台->应用->知识库->鼠标放置在知识库右侧的ID图标上->复制弹出的ID
ALIBABA_CLOUD_BAILIAN_KB_INDEX_ID='您的知识库ID'

# 这里以字节跳动的TTS为例，您从字节跳动获取的TTS API Key、Token、Cluster和Voice Type
# 在接入测试期间（ 联系 ZEGO 技术支持开通 AI Agent 服务 2 周内）appid和token都可以直接填 zego_test 就可使用 tts（文本转语音） 服务。
# 接入测试期间，以下配置可直接使用，无需修改
# Taking ByteDance's TTS as an example, during the access test period (within 2 weeks after contacting ZEGOCLOUD technical support to activate the AI Agent service)
# both the appid and token can be directly filled with "zego_test" to use the TTS (Text-to-Speech) service.
# The following configurations can be used directly without modification during the access test period:
TTS_BYTEDANCE_APP_ID=zego_test
TTS_BYTEDANCE_TOKEN=zego_test
TTS_BYTEDANCE_CLUSTER=volcano_tts
TTS_BYTEDANCE_VOICE_TYPE=zh_female_wanwanxiaohe_moon_bigtts
```
![](./images/import-env.png)
3. 跳转到 `Deploys` 页面并点击右侧的 `Trigger deploy` 然后选择 `Deploy site` 选项触发网站重新构建
![deploy-site.png](./images/deploy-site.png)
4. 部署完成后，在 `Site overview` 页面即可查看到您网站的域名。
![](./images/site-overview.png)

使用该域名可访问API接口：
1. 获取 Token：`https://cute-******.netlify.app/api/zego-token`
2. 开始与智能体通话： `https://cute-******.netlify.app/api/start`
3. 开始与数字人智能体视频通话：`https://cute-******.netlify.app/api/start-digital-human`
4. 结束与智能体通话： `https://cute-******.netlify.app/api/stop`

### 部署到 Vercel

请注意⚠️：中国大陆访问Vercel可能会有问题。如果无法访问请科学上网。在部署好后的服务绑定自己申请的域名也可以正常访问（注意域名被墙的风险）。

[![部署到Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZEGOCLOUD%2Fai_agent_quick_start_server%2Ftree%2Frag&env=NEXT_PUBLIC_ZEGO_APP_ID,ZEGO_SERVER_SECRET,LLM_API_KEY,LLM_BASE_URL,LLM_MODEL,TTS_BYTEDANCE_APP_ID,TTS_BYTEDANCE_TOKEN,TTS_BYTEDANCE_CLUSTER,TTS_BYTEDANCE_VOICE_TYPE&envDescription=这些是启动ZEGO的AI代理服务器所需的环境变量。请查看下方文档获取更多信息。&envLink=https://github.com/zegoim/aiagent-server-quickstart-sample/blob/main/.env.example)

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

