import { NextRequest, NextResponse } from 'next/server';
import { ZegoZIM, ZegoMessageType, ZegoMessagePriority } from '@/lib/zego/zim';

// 定义消息回调的载荷接口
interface ZimMessageSendPayload {
    appid: string;
    event: string;
    conv_type: number;
    msg_type: number;
    send_result: number;
    conv_id: string;
    from_user_id: string;
    msg_body: string;
}

// 定义消息项接口
interface MessageItem {
    role: string;
    content: string;
}

// 会话类型枚举
enum ConvType {
    SingleChat = 0,
    Room = 1,
    GroupChat = 2,
}

// 消息类型枚举
enum MsgType {
    Text = 1,
    Image = 11,
    Document = 12,
    Audio = 13,
    Video = 14,
    Custom = 200,
}

// 机器人用户ID前缀
const RobotUserIdPrefix = '@RBT#';

// 处理ZIM回调的POST请求
export async function POST(request: NextRequest) {
    try {
        // 解析请求体
        const payload = await request.json() as ZimMessageSendPayload;
        const {
            appid,
            event,
            conv_id: conversationId,
            conv_type: conversationType,
            msg_type: messageType,
            send_result: sendResult,
            from_user_id: fromUserId,
            msg_body: messageBody
        } = payload;

        console.log(`收到ZIM回调事件: ${event}`, payload);

        // 只处理消息发送事件
        if (event !== 'send_msg') {
            return NextResponse.json({ message: '非消息发送事件，忽略' }, { status: 200 });
        }

        // 过滤掉非单聊消息
        if (conversationType !== ConvType.SingleChat) {
            console.log(`会话类型: ${conversationType} 不是单聊，忽略`);
            return NextResponse.json({ message: '非单聊消息，忽略' }, { status: 200 });
        }

        // 过滤掉非文本消息
        if (messageType !== MsgType.Text) {
            console.log(`消息类型: ${messageType} 不是文本消息，忽略`);
            return NextResponse.json({ message: '非文本消息，忽略' }, { status: 200 });
        }

        // 过滤发送状态不为成功的消息
        if (sendResult !== 0) {
            console.log(`发送结果: ${sendResult} 不是成功，忽略`);
            return NextResponse.json({ message: '消息发送失败，忽略' }, { status: 200 });
        }

        // 过滤掉不是发送给机器人的消息
        if (!conversationId.startsWith(RobotUserIdPrefix)) {
            console.log(`会话ID: ${conversationId} 不是以 ${RobotUserIdPrefix} 开头，忽略`);
            return NextResponse.json({ message: '非机器人消息，忽略' }, { status: 200 });
        }

        // 检查必要参数
        if (!conversationId || !fromUserId) {
            console.log('会话ID或发送者ID为空，忽略');
            return NextResponse.json({ message: '参数不完整，忽略' }, { status: 200 });
        }

        // 处理消息并生成回复
        await handleMessage(fromUserId, conversationId, messageBody, appid);

        // 返回成功响应
        return NextResponse.json({ message: '回调处理成功' }, { status: 200 });
    } catch (error) {
        console.error('处理ZIM回调时出错:', error);
        return NextResponse.json({ message: '处理回调请求时出错' }, { status: 500 });
    }
}

// 定义消息历史记录接口
interface MessageHistoryItem {
    Sender: string;
    MsgBody: string;
    MsgType: number;
    MsgId?: string | number;
    MsgSeq?: number;
}

interface MessageHistoryResult {
    Code: number;
    Message: string;
    List?: MessageHistoryItem[];
    Next?: number;
}

// 处理消息并生成回复
async function handleMessage(fromUserId: string, conversationId: string, messageBody: string, _appId: string) {
    try {

        // 查询历史消息
        const msgContext = await queryHistory(fromUserId, conversationId, 20, 0);
        // 添加当前用户消息到上下文
        msgContext.push({ role: 'user', content: messageBody });

        // 调用大语言模型生成回复
        const llmResponse = await generateLLMResponse(msgContext);

        // 发送回复消息
        await sendReplyMessage(conversationId, fromUserId, llmResponse);

    } catch (error) {
        console.error('处理消息时出错:', error);
        throw error;
    }
}

async function queryHistory(fromUserId: string, conversationId: string, messageCount: number, next: number): Promise<MessageItem[]> {
    try {

        // 设置历史消息数量
        const messageCount = 20;

        // 查询历史消息
        const response: any = await ZegoZIM.getInstance().queryMessageList(
            conversationId,  // 机器人ID作为发送方
            fromUserId,      // 用户ID作为接收方
            messageCount,    // 获取最近20条消息
            0                // 从头开始查询
        );

        // 转换为我们定义的类型
        const msgHistoryResult: MessageHistoryResult = {
            Code: response?.Code || 0,
            Message: response?.Message || '',
            List: response?.List || [],
            Next: response?.Next || 0
        };

        console.log('查询历史消息结果:', msgHistoryResult);

        // 构建消息上下文
        const msgContext: MessageItem[] = [];

        // 如果有历史消息，添加到上下文
        if (msgHistoryResult.List && msgHistoryResult.List.length > 0) {
            msgHistoryResult.List.forEach((msg: MessageHistoryItem) => {
                // 根据发送者确定角色
                const role = msg.Sender === conversationId ? 'assistant' : 'user';
                msgContext.push({
                    role: role,
                    content: msg.MsgBody
                });
            });
        }

        return msgContext;
    } catch (error) {
        console.error('查询历史消息时出错:', error);
        throw error;
    }
}

// 生成LLM回复
async function generateLLMResponse(messages: MessageItem[]): Promise<string> {
    try {
        console.log('准备生成LLM回复，消息上下文:', messages);

        // 从环境变量获取LLM配置
        const apiKey = process.env.LLM_API_KEY;
        const baseURL = process.env.LLM_BASE_URL;
        const model = process.env.LLM_MODEL || 'deepseek-v3-250324';

        if (!apiKey || !baseURL) {
            console.error('缺少LLM配置，请检查环境变量');
            return "抱歉，我暂时无法回复您的消息，请稍后再试。";
        }

        // 转换消息格式
        const formattedMessages = messages.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
        }));

        // 添加系统提示
        formattedMessages.unshift({
            role: "system",
            content: "你是一个有帮助的助手，请简洁明了地回答用户问题。"
        });

        console.log('调用LLM API，模型:', model);

        // 使用fetch API调用LLM服务
        const response = await fetch(baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: formattedMessages,
                model: model
            })
        });

        if (!response.ok) {
            throw new Error(`LLM API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // 获取回复内容
        const reply = data.choices?.[0]?.message?.content || "抱歉，我无法生成回复。";
        console.log('LLM回复生成成功:', reply);

        return reply;
    } catch (error) {
        console.error('生成LLM回复时出错:', error);
        return "抱歉，处理您的请求时出现了问题，请稍后再试。";
    }
}

// 发送回复消息
async function sendReplyMessage(fromUserId: string, toUserId: string, message: string) {
    try {
        // 构建消息体
        const messageBody = {
            Message: message,
            ExtendedData: ''
        };

        // 发送消息
        const result = await ZegoZIM.getInstance().sendPeerMessage(
            fromUserId,                  // 发送者ID（机器人ID）
            [toUserId],                  // 接收者ID数组
            ZegoMessageType.Text,        // 消息类型：文本
            messageBody,                 // 消息内容
            ZegoMessagePriority.Medium   // 消息优先级：中
        );

        console.log('发送回复消息结果:', result);
        return result;
    } catch (error) {
        console.error('发送回复消息时出错:', error);
        throw error;
    }
}