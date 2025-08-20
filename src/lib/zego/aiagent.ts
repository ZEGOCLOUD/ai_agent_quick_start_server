import { createHash } from 'crypto';
import { isEqual } from '@/lib/object';

const SYSTEM_PROMPT = `
请根据用户提供的知识库内容用友好的语气回答用户问题，如果用户的问题不在知识库中，请礼貌的告诉用户我们没有相关的知识库内容。
`;

// 常量定义
export const CONSTANTS = {
    AGENT_ID: "ai_agent_example_1",
    AGENT_NAME: "李浩然",
    ERROR_CODES: {
      DIGITAL_HUMAN_CONCURRENCY_LIMIT: 410001025,
    },
  } as const;

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

export interface DigitalHumanInfo {
    DigitalHumanId: string;
    ConfigId: string;
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

    getDefaultAgentConfig() {
        return {
            LLM: {
                Url: process.env.LLM_BASE_URL || "",
                ApiKey: process.env.LLM_API_KEY || "",
                Model: process.env.LLM_MODEL || "",
                SystemPrompt: SYSTEM_PROMPT
            },
            TTS: {
                Vendor: "ByteDance",
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
            ASR: {
                Params: {}
            }
        }
    }

    async registerAgent(agentId: string, agentName: string, llmConfig: LLMConfig | null = null, ttsConfig: TTSConfig | null = null, asrConfig: ASRConfig | null = null) {
        if (!process.env.LLM_BASE_URL || !process.env.LLM_API_KEY || !process.env.LLM_MODEL) {
            throw new Error('LLM_BASE_URL, LLM_API_KEY and LLM_MODEL environment variables must be set');
        }
        const { LLM, TTS, ASR } = await this.getDefaultAgentConfig();
        // https://aigc-aiagent-api.zegotech.cn?Action=RegisterAgent
        const action = 'RegisterAgent';
        const body = {
            AgentId: agentId,
            Name: agentName,
            LLM: llmConfig || LLM,
            TTS: ttsConfig || TTS,
            ASR: asrConfig || ASR
        };
        return this.sendRequest<any>(action, body);
    }

    compareAgentConfig(config: any) {
        const { LLM, TTS, ASR } = this.getDefaultAgentConfig();
        const defaultConfig = {
            LLM,
            TTS,
            ASR
        }
        const agentConfig = {
            LLM: config.LLM,
            TTS: config.TTS,
            ASR: config.ASR
        }
        return isEqual(agentConfig, defaultConfig);
    }

    async updateAgent(agentId: string, agentName: string, llmConfig: LLMConfig | null = null, ttsConfig: TTSConfig | null = null, asrConfig: ASRConfig | null = null) {
        if (!process.env.LLM_BASE_URL || !process.env.LLM_API_KEY || !process.env.LLM_MODEL) {
            throw new Error('LLM_BASE_URL, LLM_API_KEY and LLM_MODEL environment variables must be set');
        }
        const { LLM, TTS, ASR } = await this.getDefaultAgentConfig();
        // https://aigc-aiagent-api.zegotech.cn?Action=UpdateAgent
        const action = 'UpdateAgent';
        const body = {
            AgentId: agentId,
            Name: agentName,
            LLM: llmConfig || LLM,
            TTS: ttsConfig || TTS,
            ASR: asrConfig || ASR
        };
        console.log('updateAgent body', body)
        return this.sendRequest<any>(action, body);
    }

    // 智能体注册逻辑
    async ensureAgentRegistered(agentId: string, agentName: string): Promise<void> {
      try {
        const agents = await this.queryAgents([agentId]);
        const agentExists = agents?.length > 0 &&
          agents.find((agent: any) => agent.AgentId === agentId);

        if (!agentExists) {
          await this.registerAgent(agentId, agentName);
          console.log(`智能体注册成功: ${agentId}`);
        } else {
          console.log(`智能体已存在: ${agentId}`);
          const isConfigEqual = this.compareAgentConfig(agentExists)
          console.log('isConfigEqual', isConfigEqual)
          if (!isConfigEqual) {
            await this.updateAgent(agentId, agentName);
          }
        }
      } catch (error) {
        console.error(`智能体注册失败: ${agentId}`, error);
        throw new Error(`智能体注册失败: ${(error as any).message}`);
      }
    }

    async createAgentInstance(agentId: string, userId: string, rtcInfo: RtcInfo, llmConfig: LLMConfig | null = null, ttsConfig: TTSConfig | null = null, asrConfig: ASRConfig | null = null, messageHistory: MessageHistory | null = null, callbackConfig: CallbackConfig | null = null) {
        // https://aigc-aiagent-api.zegotech.cn?Action=CreateAgentInstance
        const action = 'CreateAgentInstance';
        const body = {
            AgentId: agentId,
            UserId: userId,
            RTC: rtcInfo,
            MessageHistory: messageHistory || {
                SyncMode: 1, // Change to 0 to use history messages from ZIM
                Messages: [],
                WindowSize: 10
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

    async createDigitalHumanAgentInstance(agentId: string, userId: string, rtcInfo: RtcInfo, digitalHumanInfo: DigitalHumanInfo, llmConfig: LLMConfig | null = null, ttsConfig: TTSConfig | null = null, asrConfig: ASRConfig | null = null, messageHistory: MessageHistory | null = null, callbackConfig: CallbackConfig | null = null) {
        // https://aigc-aiagent-api.zegotech.cn?Action=CreateDigitalHumanAgentInstance
        const action = 'CreateDigitalHumanAgentInstance';
        const body = {
            AgentId: agentId,
            UserId: userId,
            RTC: rtcInfo,
            DigitalHuman: digitalHumanInfo,
            MessageHistory: messageHistory || {
                SyncMode: 1, // Change to 0 to use history messages from ZIM
                Messages: [],
                WindowSize: 10
            },
            LLM: llmConfig,
            TTS: ttsConfig,
            ASR: asrConfig,
            CallbackConfig: callbackConfig
        };
        const result = await this.sendRequest<any>(action, body);
        console.log("create digital human agent instance result", result);
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
