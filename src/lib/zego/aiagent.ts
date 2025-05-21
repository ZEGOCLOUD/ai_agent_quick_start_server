import { createHash } from 'crypto';

const SYSTEM_PROMPT = `
回答问题要求：你在做角色扮演，请按照人设要求与用户对话，直接输出回答，回答时以句号为维度，单次回答最长不要超过3句，不能超过100字。
角色：李悦然
绰号：李老师
性别：男
出身背景：李悦然出身于一个充满文化氛围的书香门第，从小受到良好的教育和熏陶。
性格特点：耐心细致，对待学生的问题从不厌烦；严谨负责，对教学工作一丝不苟；热情开朗，总是以积极的态度感染着身边的人。
语言风格：条理清晰，能够将复杂的语言知识有条不紊地讲解出来；准确流畅，发音标准，用词恰当；富有感染力，让学生对学习语言充满热情。
人际关系：在教育界拥有良好的口碑，备受尊敬。与学生相处如同朋友，关心他们的成长；与同事合作默契，相互支持。
过往经历：自幼对语言学习展现出浓厚兴趣，大学毅然选择主修语言学专业。毕业后全身心投入语言教育工作，至今已有 20 年的丰富教学经验。因其出色的教学成果，曾多次荣获优秀教师的荣誉称号。擅长多种语言的口语教学，帮助众多学生在语言能力上取得显著进步。
经典台词：
1. "语言的魅力无穷，让我们一起探索！"
2. "只要有耐心和毅力，没有学不好的语言。"
3. "别着急，一步一个脚印，你会发现自己的进步。"
对话示例：
1. 用户：李老师，我觉得这门语言太难了。
李悦然：同学，别灰心，万事开头难，跟着老师的节奏，你会渐入佳境的。
2. 用户：老师，我发音总是不准。
李悦然：来，多跟我读几遍，注意口型和声调，没问题的。
3. 用户：李老师，我这次考试没考好。
李悦然：别太在意这一次的成绩，咱们一起分析错题，找到薄弱点，下次一定能考好。
4. 用户：老师，我想参加语言比赛，您觉得我行吗？
李悦然：当然行！只要你努力准备，老师相信你能大放异彩。
5. 用户：李老师，学这么多语言会不会混乱啊？
李悦然：只要掌握方法，合理规划，就不会混乱，老师会帮你梳理的。
6. 用户：我语法总是出错。
李悦然：语法需要多练习，多总结规律，老师给你准备了一些专项练习，咱们一起攻克它。
7. 用户：老师，我不敢和外国人交流。
李悦然：别怕，勇敢迈出第一步，有老师在后面支持你。
8. 用户：李老师，学语言太枯燥了。
李悦然：那咱们换种有趣的方式学习，比如看电影、听歌曲。
9. 用户：老师，我想放弃了。
李悦然：别轻易放弃呀，坚持就是胜利，老师陪你一起克服困难。
10. 用户：李老师，谢谢您的教导。
李悦然：看到你的进步，老师比什么都开心，继续加油！
`;
export interface RtcInfo {
    RoomId: string;
    AgentStreamId: string;
    AgentUserId: string;
    UserStreamId: string;
}

interface ZegoConfig {
    appId: number;
    serverSecret: string;
}

interface CommonParams {
    AppId: number;
    Signature: string;
    SignatureNonce: string;
    SignatureVersion: string;
    Timestamp: number;
}

interface SignatureParams {
    appId: number;
    signatureNonce: string;
    serverSecret: string;
    timestamp: number;
    action: string;
}

export interface LLMConfig {
    Url: string;
    ApiKey: string;
    Model: string;
    SystemPrompt?: string;
    Temperature?: number;
    TopP?: number;
    Params?: any;
}

export interface FilterText {
    BeginCharacters: string;
    EndCharacters: string;
}
export interface TTSConfig {
    Vendor: string;
    Params?: any;
    FilterText?: FilterText[];
}

export interface ASRConfig {
    HotWord?: string;
    Params?: any;
}

export interface ZIMConfig {
    RobotId: string;
    LoadMessageCount: number;
}

export interface MessageHistory {
    SyncMode: number;
    Messages: any[];
    WindowSize: number;
    ZIM: ZIMConfig;
}

export interface CallbackConfig {
    ASRResult: number;
    LLMResult: number;
}

// 会话消息响应类型
export interface ConversationMessagesResponse {
    Code: number;
    Message: string;
    RequestId: string;
    Data: any;
}

export class ZegoAIAgent {
    private static instance: ZegoAIAgent;
    private appId: number;
    private serverSecret: string;
    private baseUrl = 'https://aigc-aiagent-api.zegotech.cn';

    private constructor(config: ZegoConfig) {
        this.appId = config.appId;
        this.serverSecret = config.serverSecret;
    }

    public static getInstance(): ZegoAIAgent {
        if (!ZegoAIAgent.instance) {
            const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
            const serverSecret = process.env.ZEGO_SERVER_SECRET || '';

            if (!appId || !serverSecret) {
                throw new Error('NEXT_PUBLIC_ZEGO_APP_ID and ZEGO_SERVER_SECRET environment variables must be set');
            }

            ZegoAIAgent.instance = new ZegoAIAgent({
                appId,
                serverSecret
            });
        }
        return ZegoAIAgent.instance;
    }

    private generateSignature(params: SignatureParams): string {
        const { appId, signatureNonce, serverSecret, timestamp } = params;
        const str = `${appId}${signatureNonce}${serverSecret}${timestamp}`;
        const hash = createHash('md5');
        hash.update(str);
        return hash.digest('hex');
    }

    private generateCommonParams(action: string): CommonParams {
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureNonce = Math.random().toString(36).substring(2);

        const signature = this.generateSignature({
            appId: this.appId,
            signatureNonce,
            serverSecret: this.serverSecret,
            timestamp,
            action
        });

        return {
            AppId: this.appId,
            SignatureNonce: signatureNonce,
            Timestamp: timestamp,
            SignatureVersion: '2.0',
            Signature: signature
        };
    }

    private buildUrl(action: string, commonParams: CommonParams, baseUrl?: string): string {
        const params = new URLSearchParams({
            Action: action,
            AppId: commonParams.AppId.toString(),
            SignatureNonce: commonParams.SignatureNonce,
            Timestamp: commonParams.Timestamp.toString(),
            SignatureVersion: commonParams.SignatureVersion,
            Signature: commonParams.Signature
        });

        if (baseUrl) {
            return `${baseUrl}/?${params.toString()}`;
        } else {
            return `${this.baseUrl}/?${params.toString()}`;
        }
    }

    async sendRequest<T>(
        action: string,
        body?: any,
        baseURL?: string,
        method: 'GET' | 'POST' = 'POST'
    ): Promise<T> {
        try {
            const commonParams = this.generateCommonParams(action);
            const url = this.buildUrl(action, commonParams, baseURL);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return data;
        } catch (error) {
            console.error(`Error in ${action}:`, error);
            throw error;
        }
    }

    async queryAgents(agentIds: string[]) {
        // https://aigc-aiagent-api.zegotech.cn?Action=QueryAgents
        const action = 'QueryAgents';
        const body = {
            AgentIds: agentIds
        };
        const result = await this.sendRequest<any>(action, body);
        console.log("query agents result", result);
        return result.Data.Agents;
    }

    async registerAgent(agentId: string, agentName: string, llmConfig: LLMConfig | null = null, ttsConfig: TTSConfig | null = null, asrConfig: ASRConfig | null = null) {
        if (!process.env.LLM_BASE_URL || !process.env.LLM_API_KEY || !process.env.LLM_MODEL) {
            throw new Error('LLM_BASE_URL, LLM_API_KEY and LLM_MODEL environment variables must be set');
        }
        // https://aigc-aiagent-api.zegotech.cn?Action=RegisterAgent
        const action = 'RegisterAgent';
        const body = {
            AgentId: agentId,
            Name: agentName,
            LLM: llmConfig || {
                Url: process.env.LLM_BASE_URL || "",
                ApiKey: process.env.LLM_API_KEY || "",
                Model: process.env.LLM_MODEL || "",
                SystemPrompt: SYSTEM_PROMPT
            },
            TTS: ttsConfig || {
                Vendor: "Bytedance",
                Params: {
                    "app": {
                        "appid": process.env.TTS_BYTEDANCE_APP_ID || "",
                        "token": process.env.TTS_BYTEDANCE_TOKEN || "",
                        "cluster": process.env.TTS_BYTEDANCE_CLUSTER || ""
                    },
                    "speed_ratio": 1,
                    "volume_ratio": 1,
                    "pitch_ratio": 1,
                    "emotion": "happy",
                    "audio": {
                        "rate": 24000,
                        "voice_type": process.env.TTS_BYTEDANCE_VOICE_TYPE || ""
                    }
                },
                FilterText: [{ BeginCharacters: "(", EndCharacters: ")" }, { BeginCharacters: "（", EndCharacters: "）" }, { BeginCharacters: "{", EndCharacters: "}" }],
            },
            ASR: asrConfig || {
                HotWord: "",
                Params: {}
            }
        };
        return this.sendRequest<any>(action, body);
    }

    async createAgentInstance(agentId: string, userId: string, rtcInfo: RtcInfo, llmConfig: LLMConfig | null = null, ttsConfig: TTSConfig | null = null, asrConfig: ASRConfig | null = null, messageHistory: MessageHistory | null = null, callbackConfig: CallbackConfig | null = null) {
        // https://aigc-aiagent-api.zegotech.cn?Action=CreateAgentInstance
        const action = 'CreateAgentInstance';
        const body = {
            AgentId: agentId,
            UserId: userId,
            RTC: rtcInfo,
            MessageHistory: messageHistory || {
                SyncMode: 0,
                ZIM: {
                    RobotId: "@RBT#AIAgentExample1" // 跟registerZIMRobot时的参数一致
                }
            },
            LLM: llmConfig,
            TTS: ttsConfig,
            ASR: asrConfig,
            CallbackConfig: callbackConfig
        };
        const result = await this.sendRequest<any>(action, body);
        console.log("create agent instance result", result);
        return result;
    }

    async deleteAgentInstance(agentInstanceId: string) {
        // https://aigc-aiagent-api.zegotech.cn?Action=DeleteAgentInstance
        const action = 'DeleteAgentInstance';
        const body = {
            AgentInstanceId: agentInstanceId
        };
        const result = await this.sendRequest<any>(action, body);
        console.log("delete agent instance result", result);
        return result;
    }

    async listAgents(limit?: number, cursor?: string) {
        // https://aigc-aiagent-api.zegotech.cn?Action=ListAgents
        const action = 'ListAgents';
        const body: any = {};

        if (limit !== undefined) body.Limit = limit;
        if (cursor) body.Cursor = cursor;

        const result = await this.sendRequest<any>(action, body);
        console.log("list agents result", result);
        return result;
    }

}