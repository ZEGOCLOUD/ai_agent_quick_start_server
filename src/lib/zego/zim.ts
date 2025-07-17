import { ZegoAIAgent } from './aiagent';

// 定义消息类型常量
export enum ZegoMessageType {
    Text = 1,
    Command = 2,
    Combine = 10,
    Image = 11,
    File = 12,
    Audio = 13,
    Video = 14,
    Custom = 200
}

// 定义消息优先级常量
export enum ZegoMessagePriority {
    Low = 1,
    Medium = 2,
    High = 3
}

// 定义消息体接口
export interface ZegoMessageBody {
    Message: string;
    ExtendedData?: string;
    OfflinePush?: {
        Enable: number;
        Title?: string;
        Content?: string;
        Payload?: string;
    };
}

// 定义发送消息选项接口
export interface ZegoSendMsgOptions {
    NoUnread?: boolean;
}

// 定义机器人注册响应接口
export interface ZegoRobotRegisterResponse {
    Code: number;
    Message: string;
    RequestId: string;
    Data?: {
        RobotId: string;
    };
    ErrorList?: Array<{
        UserId: string;
        SubCode: number;
        SubMessage: string;
    }>;
}

// 定义消息列表查询响应接口
export interface ZegoMessageListResponse {
    Code: number;
    Message: string;
    RequestId: string;
    Next: number;
    List?: Array<{
        Sender: string;
        MsgType: number;
        SubMsgType?: number;
        MsgBody: string;
        MsgId: number | string;
        MsgSeq: number;
        Payload?: string;
        MsgTime: number;
        IsEmpty?: number;
    }>;
}

// 定义发送消息响应接口
export interface ZegoSendMessageResponse {
    Code: number;
    Message: string;
    RequestId: string;
    ErrorList?: Array<{
        UserId: string;
        SubCode: number;
    }>;
    SuccList?: Array<{
        UserId: string;
        MsgId: string;
        MsgSeq: number;
    }>;
    AuditInfos?: Array<{
        Index: number;
        Reason: string;
    }>;
}

export class ZegoZIM {
    private static instance: ZegoZIM;

    private constructor() {
        // Private constructor to enforce singleton pattern
    }

    public static getInstance(): ZegoZIM {
        if (!ZegoZIM.instance) {
            ZegoZIM.instance = new ZegoZIM();
        }
        return ZegoZIM.instance;
    }

    /**
     * 查询或确保机器人存在，如果不存在则注册
     * Query or ensure robot exists, register if not exists
     * @param robotUserId 机器人用户ID，如果不提供则使用默认值
     * @returns 返回机器人ID
     */
    async ensureRobotExists(robotUserId?: string): Promise<{ robotId: string; isNewRegistration: boolean }> {
        const userId = robotUserId || "@RBT#AIAgentExample1";
        
        try {
            // 尝试注册机器人
            const registerResult = await this.registerZIMRobot(userId);
            
            if (registerResult.Code === 0) {
                // 注册成功，是新注册的机器人
                console.log("register ZIM robot success");
                return {
                    robotId: registerResult.Data?.RobotId || userId,
                    isNewRegistration: true
                };
            } else if (registerResult.ErrorList && registerResult.ErrorList.length > 0) {
                if (registerResult.ErrorList[0].SubCode === 660700002) {
                    // 机器人已存在
                    console.log("ZIM robot already exists");
                    return {
                        robotId: userId,
                        isNewRegistration: false
                    };
                } else {
                    // 其他错误
                    throw new Error(`register ZIM robot failed! ${registerResult.ErrorList[0].SubMessage}`);
                }
            } else {
                // 未知错误
                throw new Error(`register ZIM robot failed! Code: ${registerResult.Code}, Message: ${registerResult.Message}`);
            }
        } catch (error) {
            console.error('Error ensuring robot exists:', error);
            throw error;
        }
    }

    /**
     * Register a ZIM robot for storing conversation history
     * @param robotUserId 机器人用户ID，如果不提供则使用默认值
     * @returns The result of the registration
     */
    async registerZIMRobot(robotUserId?: string): Promise<ZegoRobotRegisterResponse> {
        const userId = robotUserId || "@RBT#AIAgentExample1";
        const action = 'RobotRegister';
        const baseURL = 'https://zim-api.zego.im';
        const body = {
            UserInfo: [
                {
                    UserId: userId // Must match the RobotId used when creating AIAgent instance
                }
            ]
        }
        const agent = ZegoAIAgent.getInstance();
        const result = await agent.sendRequest<ZegoRobotRegisterResponse>(action, body, baseURL);
        console.log("register ZIM robot result", result);
        return result;
    }

    /**
     * Query message list of one-on-one chats
     * @param fromUserId The user ID of the first participant (required)
     * @param toUserId The user ID of the second participant (required)
     * @param limit The number of messages to query (optional, default 10, max 100)
     * @param next Pagination flag, use 0 for first query, then use the returned Next value (optional)
     * @param withEmptyMsg Whether to include recalled or deleted messages (optional, 0: exclude, 1: include)
     * @returns The result of the query
     */
    async queryMessageList(fromUserId: string, toUserId: string, limit: number = 10, next: number = 0, withEmptyMsg: number = 0): Promise<ZegoMessageListResponse> {
        const action = 'QueryPeerMsg';
        const baseURL = 'https://zim-api.zego.im';
        const body = {
            FromUserId: fromUserId,
            ToUserId: toUserId,
            Limit: limit,
            Next: next,
            WithEmptyMsg: withEmptyMsg
        }
        const agent = ZegoAIAgent.getInstance();
        const result = await agent.sendRequest<ZegoMessageListResponse>(action, body, baseURL);
        console.log("query message list result", result);
        return result;
    }

    /**
     * Send a one-to-one message to one or multiple users
     * @param fromUserId The sender's user ID (required)
     * @param toUserIds Array of recipient user IDs, max 100 users (required)
     * @param messageType Message type, use ZegoMessageType enum (required)
     * @param messageBody Message content (required)
     * @param priority Message priority, use ZegoMessagePriority enum (required)
     * @param subMsgType Custom message subtype, only needed when messageType is Custom (optional)
     * @param searchedContent Searchable content for custom messages (optional)
     * @param senderUnaware Whether the sender is aware of this message (0: aware, 1: unaware) (optional)
     * @param sendMsgOptions Additional message options (optional)
     * @returns The result of sending the message
     */
    async sendPeerMessage(
        fromUserId: string,
        toUserIds: string[],
        messageType: ZegoMessageType,
        messageBody: ZegoMessageBody,
        priority: ZegoMessagePriority,
        subMsgType?: number,
        searchedContent?: string,
        senderUnaware?: number,
        sendMsgOptions?: ZegoSendMsgOptions
    ): Promise<ZegoSendMessageResponse> {
        const action = 'SendPeerMessage';
        const baseURL = 'https://zim-api.zego.im';

        // 构建请求体
        const body: any = {
            FromUserId: fromUserId,
            ToUserId: toUserIds,
            MessageType: messageType,
            Priority: priority,
            MessageBody: messageBody
        };

        // 添加可选参数
        if (messageType === ZegoMessageType.Custom && subMsgType !== undefined) {
            body.SubMsgType = subMsgType;
        }

        if (searchedContent !== undefined) {
            body.SearchedContent = searchedContent;
        }

        if (senderUnaware !== undefined) {
            body.SenderUnaware = senderUnaware;
        }

        if (sendMsgOptions !== undefined) {
            body.SendMsgOptions = sendMsgOptions;
        }

        const agent = ZegoAIAgent.getInstance();
        const result = await agent.sendRequest<ZegoSendMessageResponse>(action, body, baseURL);
        console.log("send peer message result", result);
        return result;
    }
}