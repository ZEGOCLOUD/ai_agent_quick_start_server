import { NextRequest, NextResponse } from 'next/server';
import { ZegoZIM, ZegoMessageType, ZegoMessagePriority } from '@/lib/zego/zim';

// 定义消息回调的载荷接口
// Define the payload interface for message callbacks
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
// Define the message item interface
interface MessageItem {
    role: string;
    content: string;
}

// 会话类型枚举
// Conversation type enumeration
enum ConvType {
    SingleChat = 0,
    Room = 1,
    GroupChat = 2,
}

// 消息类型枚举
// Message type enumeration
enum MsgType {
    Text = 1,
    Image = 11,
    Document = 12,
    Audio = 13,
    Video = 14,
    Custom = 200,
}

// 机器人用户ID前缀
// Robot user ID prefix
const RobotUserIdPrefix = '@RBT#';

// 处理ZIM回调的POST请求
// Handle ZIM callback POST request
export async function POST(request: NextRequest) {
    try {
        // 解析请求体
        // Parse request body
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

        console.log(`收到ZIM回调事件: ${event}`, payload); // Received ZIM callback event

        // 只处理消息发送事件
        // Only process message sending events
        if (event !== 'send_msg') {
            return NextResponse.json({ message: '非消息发送事件，忽略' }, { status: 200 }); // Not a message sending event, ignore
        }

        // 过滤掉非单聊消息
        // Filter out non-single chat messages
        if (conversationType !== ConvType.SingleChat) {
            console.log(`会话类型: ${conversationType} 不是单聊，忽略`); // Conversation type is not single chat, ignore
            return NextResponse.json({ message: '非单聊消息，忽略' }, { status: 200 }); // Not a single chat message, ignore
        }

        // 过滤掉非文本消息
        // Filter out non-text messages
        if (messageType !== MsgType.Text) {
            console.log(`消息类型: ${messageType} 不是文本消息，忽略`); // Message type is not text, ignore
            return NextResponse.json({ message: '非文本消息，忽略' }, { status: 200 }); // Not a text message, ignore
        }

        // 过滤发送状态不为成功的消息
        // Filter out messages with unsuccessful send status
        if (sendResult !== 0) {
            console.log(`发送结果: ${sendResult} 不是成功，忽略`); // Send result is not successful, ignore
            return NextResponse.json({ message: '消息发送失败，忽略' }, { status: 200 }); // Message sending failed, ignore
        }

        // 过滤掉不是发送给机器人的消息
        // Filter out messages not sent to the robot
        if (!conversationId.startsWith(RobotUserIdPrefix)) {
            console.log(`会话ID: ${conversationId} 不是以 ${RobotUserIdPrefix} 开头，忽略`); // Conversation ID does not start with robot prefix, ignore
            return NextResponse.json({ message: '非机器人消息，忽略' }, { status: 200 }); // Not a robot message, ignore
        }

        // 检查必要参数
        // Check required parameters
        if (!conversationId || !fromUserId) {
            console.log('会话ID或发送者ID为空，忽略'); // Conversation ID or sender ID is empty, ignore
            return NextResponse.json({ message: '参数不完整，忽略' }, { status: 200 }); // Parameters incomplete, ignore
        }

        // 处理消息并生成回复
        // Process message and generate reply
        await handleMessage(fromUserId, conversationId, messageBody, appid);

        // 返回成功响应
        // Return success response
        return NextResponse.json({ message: '回调处理成功' }, { status: 200 }); // Callback processed successfully
    } catch (error) {
        console.error('处理ZIM回调时出错:', error); // Error processing ZIM callback
        return NextResponse.json({ message: '处理回调请求时出错' }, { status: 500 }); // Error processing callback request
    }
}

// 定义消息历史记录接口
// Define message history record interface
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
// Process message and generate reply
async function handleMessage(fromUserId: string, conversationId: string, messageBody: string, _appId: string) {
    try {

        // 查询历史消息
        // Query message history
        const msgContext = await queryHistory(fromUserId, conversationId, 20, 0);
        // 添加当前用户消息到上下文
        // Add current user message to context
        msgContext.push({ role: 'user', content: messageBody });

        // 调用大语言模型生成回复
        // Call large language model to generate reply
        const llmResponse = await generateLLMResponse(msgContext);

        // 发送回复消息
        // Send reply message
        await sendReplyMessage(conversationId, fromUserId, llmResponse);

    } catch (error) {
        console.error('处理消息时出错:', error); // Error processing message
        throw error;
    }
}

async function queryHistory(fromUserId: string, conversationId: string, messageCount: number, next: number): Promise<MessageItem[]> {
    try {

        // 设置历史消息数量
        // Set the number of historical messages
        const messageCount = 20;

        // 查询历史消息
        // Query message history
        const response: any = await ZegoZIM.getInstance().queryMessageList(
            conversationId,  // 机器人ID作为发送方 // Robot ID as sender
            fromUserId,      // 用户ID作为接收方 // User ID as receiver
            messageCount,    // 获取最近20条消息 // Get the latest 20 messages
            0                // 从头开始查询 // Start query from the beginning
        );

        // 转换为我们定义的类型
        // Convert to our defined type
        const msgHistoryResult: MessageHistoryResult = {
            Code: response?.Code || 0,
            Message: response?.Message || '',
            List: response?.List || [],
            Next: response?.Next || 0
        };

        console.log('查询历史消息结果:', msgHistoryResult); // Query message history result

        // 构建消息上下文
        // Build message context
        const msgContext: MessageItem[] = [];

        // 如果有历史消息，添加到上下文
        // If there are historical messages, add them to the context
        if (msgHistoryResult.List && msgHistoryResult.List.length > 0) {
            msgHistoryResult.List.forEach((msg: MessageHistoryItem) => {
                // 根据发送者确定角色
                // Determine role based on sender
                const role = msg.Sender === conversationId ? 'assistant' : 'user';
                msgContext.push({
                    role: role,
                    content: msg.MsgBody
                });
            });
        }

        return msgContext;
    } catch (error) {
        console.error('查询历史消息时出错:', error); // Error querying message history
        throw error;
    }
}

// 生成LLM回复
// Generate LLM reply
async function generateLLMResponse(messages: MessageItem[]): Promise<string> {
    try {
        console.log('准备生成LLM回复，消息上下文:', messages); // Preparing to generate LLM reply, message context

        // 从环境变量获取LLM配置
        // Get LLM configuration from environment variables
        const apiKey = process.env.LLM_API_KEY;
        const baseURL = process.env.LLM_BASE_URL;
        const model = process.env.LLM_MODEL || 'deepseek-v3-250324';

        if (!apiKey || !baseURL) {
            console.error('缺少LLM配置，请检查环境变量'); // Missing LLM configuration, please check environment variables
            return "抱歉，我暂时无法回复您的消息，请稍后再试。"; // Sorry, I cannot reply to your message at the moment, please try again later
        }

        // 转换消息格式
        // Convert message format
        const formattedMessages = messages.map(msg => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content
        }));

        // 添加系统提示
        // Add system prompt
        formattedMessages.unshift({
            role: "system",
            content: "你是一个有帮助的助手，请简洁明了地回答用户问题。" // You are a helpful assistant, please answer user questions concisely and clearly
        });

        console.log('调用LLM API，模型:', model); // Calling LLM API, model

        // 使用fetch API调用LLM服务
        // Use fetch API to call LLM service
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
            throw new Error(`LLM API请求失败: ${response.status} ${response.statusText}`); // LLM API request failed
        }

        const data = await response.json();

        // 获取回复内容
        // Get reply content
        const reply = data.choices?.[0]?.message?.content || "抱歉，我无法生成回复。"; // Sorry, I cannot generate a reply
        console.log('LLM回复生成成功:', reply); // LLM reply generated successfully

        return reply;
    } catch (error) {
        console.error('生成LLM回复时出错:', error); // Error generating LLM reply
        return "抱歉，处理您的请求时出现了问题，请稍后再试。"; // Sorry, there was a problem processing your request, please try again later
    }
}

// 发送回复消息
// Send reply message
async function sendReplyMessage(fromUserId: string, toUserId: string, message: string) {
    try {
        // 构建消息体
        // Build message body
        const messageBody = {
            Message: message,
            ExtendedData: ''
        };

        // 发送消息
        // Send message
        const result = await ZegoZIM.getInstance().sendPeerMessage(
            fromUserId,                  // 发送者ID（机器人ID） // Sender ID (robot ID)
            [toUserId],                  // 接收者ID数组 // Receiver ID array
            ZegoMessageType.Text,        // 消息类型：文本 // Message type: text
            messageBody,                 // 消息内容 // Message content
            ZegoMessagePriority.Medium   // 消息优先级：中 // Message priority: medium
        );

        console.log('发送回复消息结果:', result); // Send reply message result
        return result;
    } catch (error) {
        console.error('发送回复消息时出错:', error); // Error sending reply message
        throw error;
    }
}