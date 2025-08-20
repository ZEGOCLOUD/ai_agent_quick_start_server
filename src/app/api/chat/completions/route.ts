import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { retrieveFromRagflow } from '@/lib/rag/ragflow';
import OpenAI from 'openai';
import type { ChatCompletionCreateParams } from 'openai/resources/chat';
import { retrieveFromBailian } from '@/lib/rag/bailian';


export async function POST(request: NextRequest) {
    // 认证检查
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const requestData: ChatCompletionCreateParams = await request.json();
        console.log("requestData", requestData);
        console.log("requestData", JSON.stringify(requestData));

        // 读取API密钥，即在使用以下方式请求时带上的 apiKey 的值。AIAgent 服务端也使用以下方式请求。
        // const openai = new OpenAI({
        //     apiKey: "xxx",
        //     baseURL: "xxx"
        // });
        // 您在读取到 apiKey 后，可以做必要的业务校验。它不一定是 LLM 的 apiKey，因为是透传的，所以你可以传任意内容。
        const apiKey = authHeader.split(' ')[1];

        // 检查必需字段
        if (!requestData.messages || requestData.messages.length === 0) {
            return NextResponse.json(
                { error: 'Messages are required' },
                { status: 400 }
            );
        }

        // 检查是否要求流式响应
        if (requestData.stream) {
            // 读取 Model
            // 由于在注册 AIAgent 或者创建 AIAgent 实例时，会传入固定的 Model 所以 这里可以传一个普通给 LLM 的 Model。
            // 同时你也可以通过这个值传递一些额外的业务信息。比如 这个 Model 实际是业务标志，标识是直播/语聊房等等。
            const model = requestData.model;

            // 读取 SystemPrompt
            // 由于在注册 AIAgent 或者创建 AIAgent 实例时，会传入固定的 SystemPrompt 所以 这里可以传一个普通给 LLM 的 SystemPrompt。
            // 同时你也可以通过这个值传递一些额外的业务信息。比如带上用户的信息、等级、偏好等等。然后依此再调用 LLM 时针对性的修改实际给 LLM 的 SystemPrompt。
            const systemMessage = requestData.messages.find(message => message.role === 'system');

            // 读取最新一条 User Message（最新的在数组最后）
            // AIAgent 在向你的接口发起请求时，会带上 Messages 参数。这个参数也包括 SystemPrompt。
            const latestUserMessage = [...requestData.messages].reverse().find(message => message.role === 'user');

            // 读取其他符合 OpenAI 协议的 LLM 参数类似，这里不再赘述。

            // 创建流式响应
            const stream = new TransformStream();
            const writer = stream.writable.getWriter();
            const encoder = new TextEncoder();
            try {
                let kbContent = "";
                // 调用知识库查询接口，获取知识库查询结果
                if (process.env.KB_TYPE === "ragflow") {
                    console.log("调用 Ragflow 知识库查询接口");
                    const ragflowResponse = await retrieveFromRagflow({
                        question: latestUserMessage?.content as string,
                    });
                    kbContent = ragflowResponse.kbContent;
                } else if (process.env.KB_TYPE === "bailian") {
                    console.log("调用 Bailian 知识库查询接口");
                    const bailianResponse = await retrieveFromBailian({ query: latestUserMessage?.content as string });
                    kbContent = bailianResponse.kbContent;
                }

                // 将用户最新一条 User Message 和知识库查询结果进行合并，在替换 messages 数组最后一个元素，然后调用 LLM 进行回答
                // 小提示🔔：部分厂商的模型是提供上下文硬盘缓存的，所以计算价格时有缓存的计价会便宜很多。保持 SystemPrompt 不变，只替换 User Message 可有效提升缓存命中概率从而降低成本并且缩短推理时间。
                requestData.messages[requestData.messages.length - 1] = {
                    role: 'user',
                    content: `${latestUserMessage?.content}\n以下是知识库查询结果:\n${kbContent}`,
                };

                // 调用 LLM 进行回答（使用 OpenAI 的 SDK）
                const openai = new OpenAI({
                    apiKey: apiKey,
                    baseURL: process.env.LLM_BASE_URL_REAL
                });
                // 处理流式响应
                const completion = await openai.chat.completions.create({
                    model: model,
                    stream: true,
                    messages: requestData.messages
                });
                console.log("completion created successfully");
                for await (const chunk of completion) {
                    // 注意⚠️：AIAgent 要求最后一个有效数据必须包含 "finish_reason":"stop"且最后必须发送一条结束数据：data: [DONE]，如果不发送可能会导致智能体不回答或者回答不完整。
                    // 某些模型不会在流式响应中返回 finish_reason，这种情况需要自己根据修改一下chunk内容再传回给 AIAgent。
                    const ssePart = `data: ${JSON.stringify(chunk)}\n`;
                    writer.write(encoder.encode(ssePart));
                }

            } catch (error) {
                console.error('Stream processing error:', error);
            } finally {
                // 发送结束标记
                writer.write(encoder.encode('data: [DONE]\n\n'));
                writer.close();
                console.log("writer closed");
            }


            return new Response(stream.readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        } else {
            // AIAgent 不支持非流式响应，直接返回错误码
            return NextResponse.json(
                { error: 'Streaming is required' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// 添加OPTIONS方法支持CORS预检
export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}