# AI Agent Server Example Usage Guide

[![English](https://img.shields.io/badge/language-English-blue.svg)](./README_EN.md) [![中文](https://img.shields.io/badge/language-中文-red.svg)](./README.md)

- [AI Agent Server Example Usage Guide](#ai-agent-server-example-usage-guide)
  - [Run \& Deployment](#run--deployment)
    - [Running Locally](#running-locally)
    - [Deploy to Netlify](#deploy-to-netlify)
    - [Deploy to Vercel](#deploy-to-vercel)
  - [Using the Service](#using-the-service)
  - [Project Structure](#project-structure)


## Run & Deployment

### Deploy to Netlify

Please note ⚠️: This method is recommended for users in Mainland China

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ZEGOCLOUD/ai_agent_quick_start_server&branch=rag)

Click the button above to deploy this project to the Netlify platform with one click.
During deployment, you need to import all necessary environment variables. The specific steps are as follows:

1. On the Netlify platform, navigate to `Your Site Instance -> Site configuration -> Environment variables`
2. Click `Add a variable` on the right and select `Import from a .env file`, then copy the following content into the input box (Contents of .env file:), and click `Import variables`.
Note⚠️: Please replace yourdomain with the domain name of the site after successful deployment.

```bash
# AppID and ServerSecret obtained by you from ZEGOCLOUD console（https://console.zegocloud.com/）
NEXT_PUBLIC_ZEGO_APP_ID=
ZEGO_SERVER_SECRET=

# You need to provide an LLM API address that conforms to the OpenAPI specification. AIAgent will directly initiate a request to this interface. Note that it must be a URL that can be accessed from the outside network and not a LAN address or localhost.
LLM_BASE_URL=https://***.netlify.app/api/chat/completions
# The URL, Key, and Model provided by the real LLM service provider. Call it in your own defined LLM interface.
LLM_BASE_URL_REAL=https://ark.cn-beijing.volces.com/api/v3/
LLM_API_KEY=**********
LLM_MODEL=doubao-1-5-lite-32k-250115

# Which knowledge base to use (ragflow or bailian). Configure the corresponding knowledge base environment variables according to KB_TYPE. If not used, no configuration is required.
KB_TYPE=bailian
# The number of fragments returned by the query
KB_CHUNK_COUNT=8

# You need to deploy the RAGFlow service yourself.
# RAGFlow 文档地址：https://ragflow.io/docs/dev/
RAGFLOW_KB_DATASET_ID=947499c*************
RAGFLOW_API_ENDPOINT=https://demo.ragflow.io/
RAGFLOW_API_KEY=ragflow-**********

# Bailian knowledge base usage guide: https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.7ba312d5YW74o6&tab=doc#/doc/?type=app&url=2807740
# Bailian knowledge base API guide address: https://bailian.console.aliyun.com/?spm=5176.29619931.J_AHgvE-XDhTWrtotIBlDQQ.13.74cd521cb6A3jn&tab=doc#/doc/?type=app&url=2852772
# How to create ACCESS_KEY and ACCESS_KEY_SECRET: https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair?spm=a2c4g.11186623.0.i2
ALIBABA_CLOUD_ACCESS_KEY_ID='Your Alibaba Cloud access key ID'
ALIBABA_CLOUD_ACCESS_KEY_SECRET='Your Alibaba Cloud access key password'
ALIBABA_CLOUD__SERVICE_ENDPOINT=bailian.cn-beijing.aliyuncs.com
# How to get the Alibaba Cloud Bailian workspace ID: https://bailian.console.aliyun.com/?spm=5176.29619931.J_AHgvE-XDhTWrtotIBlDQQ.13.74cd521cb6A3jn&tab=doc#/doc/?type=model&url=2587495
ALIBABA_CLOUD_BAILIAN_WORKSPACE_ID='Your Alibaba Cloud Bailian workspace ID'
# How to get the Alibaba Cloud Bailian knowledge base ID: Alibaba Cloud Bailian console -> Application -> Knowledge Base -> Place the mouse over the ID icon on the right side of the knowledge base -> copy the popped ID
ALIBABA_CLOUD_BAILIAN_KB_INDEX_ID='Your knowledge base ID'

# Taking ByteDance's TTS as an example, during the access test period (within 2 weeks after contacting ZEGOCLOUD technical support to activate the AI Agent service)
# both the appid and token can be directly filled with "zego_test" to use the TTS (Text-to-Speech) service.
# The following configurations can be used directly without modification during the access test period:
TTS_BYTEDANCE_APP_ID=zego_test
TTS_BYTEDANCE_TOKEN=zego_test
TTS_BYTEDANCE_CLUSTER=volcano_tts
TTS_BYTEDANCE_VOICE_TYPE=zh_female_wanwanxiaohe_moon_bigtts
```
![](./images/import-env.png)
3. Go to the `Deploys` page and click `Trigger deploy` on the right, then select the `Deploy site` option to trigger a website rebuild
![deploy-site.png](./images/deploy-site.png)
4. After deployment is complete, you can see your website's domain on the `Site overview` page.
![](./images/site-overview.png)

Use this domain to access the API interfaces:
- Get ZEGO Token: `https://cute-******.netlify.app/api/zego-token`
- Start talking with AI Agent: `https://cute-******.netlify.app/api/start`
- Stop talk with AI Agent: `https://cute-******.netlify.app/api/stop`

### Deploy to Vercel

Please note ⚠️: Access to Vercel from Mainland China may be problematic. If you can't access it, please use a VPN. After deployment, binding your own domain to the service can also allow normal access (be aware of the risk of domain blocking).

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZEGOCLOUD%2Fai_agent_quick_start_server%2Ftree%2Frag&env=NEXT_PUBLIC_ZEGO_APP_ID,ZEGO_SERVER_SECRET,LLM_API_KEY,LLM_BASE_URL,LLM_MODEL,TTS_BYTEDANCE_APP_ID,TTS_BYTEDANCE_TOKEN,TTS_BYTEDANCE_CLUSTER,TTS_BYTEDANCE_VOICE_TYPE&envDescription=这些是启动ZEGO的AI代理服务器所需的环境变量。请查看下方文档获取更多信息。&envLink=https://github.com/zegoim/aiagent-server-quickstart-sample/blob/main/.env.example)

Click the button above to deploy this project to the Vercel platform with one click. During deployment, you need to fill in all necessary environment variables. For detailed explanations of the environment variables, please refer to the [.env.example](.env.example) file.

![](./images/vercel-server.png)

Use this domain to access the API interfaces:
- Get ZEGO Token: `https://****.vercel.app/api/api/zego-token`
- Start talking with AI Agent: `https://****.vercel.app/api/start`
- Start a video call with the digital human agent: `https://****.vercel.app/api/start-digital-human`
- Stop talk with AI Agent: `https://****.vercel.app/api/api/stop`

## Using the Service

The client needs to integrate the ZEGO Express SDK and join the same room with the AI agent instance to perform publish and play streaming for voice interaction. Therefore, the steps to use this service are as follows:
1. The client calls the `/api/api/zego-token` interface to obtain the ZEGO Token, which is used to log in to the room using the ZEGO Express SDK.
2. The client enters the room, performs publish and play streaming, and calls the `/api/api/start` interface to notify the AI Agent service to create an AI agent instance (In this example, the roomID, userID, and streamID are already predefined, so no parameters need to be passed).

After these two steps, you can interact with the AI agent using voice on the client.

When you need to end the call, call the `/api/api/stop` interface to notify the AI Agent service to delete the AI agent instance.

## Project Structure

The project source code structure is as follows:

```
src
├── app
│   ├── api
│   │   ├── callback
│   │   │   └── route.ts        # Callback interface handling. Contact ZEGO technical support for configuration to receive callback events.
│   │   ├── passthrough-request
│   │   │   └── route.ts        # Passthrough request handling
│   │   ├── start
│   │   │   └── route.ts        # Start AI Agent instance
│   │   ├── stop
│   │   │   └── route.ts        # Stop AI Agent instance
│   │   └── zego-token
│   │       └── route.ts        # ZEGO Token generation interface
└── lib
    ├── logger.ts               # Logging tool
    └── zego
        ├── aiagent.ts          # ZEGO AI Agent PaaS interface request logic
        └── token_helper.ts     # ZEGO Token generation tool
```