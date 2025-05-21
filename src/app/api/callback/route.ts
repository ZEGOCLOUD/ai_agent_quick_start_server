import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // 解析请求体
        // Parse request body
        const data = await request.json();

        if (data.Event === 'UserSpeakAction') {
            console.log(`检测到用户说话事件: ${data.Event}, 说话状态:`, data.Action); // Detected user speaking event, speaking status
        } else if (data.Event === 'AgentSpeakAction') {
            console.log(`检测到智能体说话事件: ${data.Event}, 说话状态:`, data.Action); // Detected agent speaking event, speaking status
        }else {
            // 打印回调内容
            // Print callback content
            console.log('收到回调数据:', data); // Received callback data
        }

        // 返回 200 状态码表示接收成功
        // Return 200 status code to indicate successful reception
        return NextResponse.json({ message: '回调接收成功' }, { status: 200 }); // Callback received successfully
    } catch (error) {
        console.error('处理回调请求时出错:', error); // Error processing callback request
        // 返回 500 状态码表示处理出错
        // Return 500 status code to indicate processing error
        return NextResponse.json({ message: '处理回调请求时出错' }, { status: 500 }); // Error processing callback request
    }
}