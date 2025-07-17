import { NextRequest } from 'next/server';
import { ZegoAIAgent } from '@/lib/zego/aiagent';
import { ZegoZIM } from '@/lib/zego/zim';

// 定义请求体类型
// Define request body type
interface RequestBody {
    agent_id?: string;
    agent_name?: string;
    robot_user_id?: string;
}
export async function POST(req: NextRequest) {
    try {
         // 尝试从请求体获取参数 / Try to get parameters from request body
         let agent_id: string = "";
         let agent_name: string = "";
         let robot_user_id: string | undefined;
         try {
             const body: RequestBody = await req.json();
             console.log("body====", body);
             agent_id = body.agent_id || "";
             agent_name = body.agent_name || "";
             robot_user_id = body.robot_user_id;
         } catch (e) {
             // 如果解析请求体失败，忽略错误 / If parsing request body fails, ignore error
             console.log("No request body or invalid JSON, will use stored instance ID");
         }

        // 注册ZIM机器人，用于存储对话历史记录
        // Register ZIM robot for storing conversation history
        const zim = ZegoZIM.getInstance();
        const robotResult = await zim.ensureRobotExists(robot_user_id);

        // 如果没有提供agent_id，则只返回机器人信息
        // If no agent_id is provided, only return robot information
        if (!agent_id) {
            return Response.json({
                code: 0,
                message: robotResult.isNewRegistration ? 'robot registered successfully' : 'robot already exists',
                data: {
                    robot_id: robotResult.robotId,
                    is_new_registration: robotResult.isNewRegistration
                }
            }, { status: 200 });
        }

        // 处理AI代理相关逻辑
        // Handle AI agent related logic
        const assistant = ZegoAIAgent.getInstance();
        const agents = await assistant.queryAgents([agent_id]);
        console.log("query agents", agents);
        if (!agents || agents.length === 0 || !agents.find((agent: any) => agent.AgentId === agent_id)) {
            await assistant.registerAgent(agent_id, agent_name);
            console.log("register agent success");
        } else {
            console.log("agent already exists");
        }

        return Response.json({
            code: 0,
            message: 'get agent info success',
            agent_id: agent_id,
            agent_name: agent_name,
            robot_id: robotResult.robotId,
            is_new_robot_registration: robotResult.isNewRegistration
        }, { status: 200 });
    } catch (error) {
        console.error('register agent failed:', error);
        return Response.json({
            code: (error as any).code || 500,
            message: (error as any).message || 'start agent failed with unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const zim = ZegoZIM.getInstance();
        // 使用默认的机器人用户ID查询
        // Query with default robot user ID
        const result = await zim.ensureRobotExists();

        return Response.json({
            code: 0,
            message: result.isNewRegistration ? 'robot registered successfully' : 'robot already exists',
            data: {
                robot_id: result.robotId,
                is_new_registration: result.isNewRegistration
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Query or register robot failed:', error);
        return Response.json({
            code: (error as any).code || 500,
            message: (error as any).message || 'query or register robot failed with unknown error'
        }, { status: 500 });
    }
}
