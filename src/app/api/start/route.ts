import { NextRequest } from 'next/server';
import { ZegoAIAgent } from '@/lib/zego/aiagent';
import { ZegoZIM } from '@/lib/zego/zim';
import { AgentStore } from '@/lib/store';

// 定义请求体类型
// Define request body type
interface RequestBody {
    agent_id: string;
    agent_name: string;
}

// 这里只是作为最简单的示例。所以以下参数都是固定的。请根据您实际的场景进行动态设置。
// This is just the simplest example. So the following parameters are all fixed. Please set them dynamically according to your actual scenario.
const agent_id = "ai_agent_example_1";
const agent_name = "李浩然";
const user_id = "user_id_1";
const room_id = "room_id_1";
const agent_stream_id = "agent_stream_id_1";
const agent_user_id = "agent_user_id_1";
const user_stream_id = "user_stream_id_1";

export async function POST(req: NextRequest) {
    try {
        const assistant = ZegoAIAgent.getInstance();

        const agents = await assistant.queryAgents([agent_id]);
        console.log("query agents", agents);
        if (!agents || agents.length === 0 || !agents.find((agent: any) => agent.AgentId === agent_id)) {
            await assistant.registerAgent(agent_id, agent_name);
            console.log("register agent success");
        } else {
            console.log("agent already exists");
        }

        // 注册ZIM机器人，用于存储对话历史记录
        // Register ZIM robot for storing conversation history
        // 在实际开发时，并不用每次创建实例都创建ZIM机器人，可以理解为一个机器人就对应一个跟AI的文本会话，只是在语音通话的时候传递机器人ID将文本历史传递给语音作为上下文
        // In actual development, you don't need to create a ZIM robot every time you create an instance. You can understand that one robot corresponds to one text conversation with AI, and the robot ID is passed to the voice call to pass the text history as context
        const zim = ZegoZIM.getInstance();
        const registerRobotResult = await zim.registerZIMRobot()
        if (registerRobotResult.Code === 0) {
            console.log("register ZIM robot success")
        } else {
            if (registerRobotResult.ErrorList && registerRobotResult.ErrorList.length > 0) {
                if (registerRobotResult.ErrorList[0].SubCode === 660700002) {
                    console.log("ZIM robot already exists")
                } else {
                    console.log("register ZIM robot failed!")
                    throw new Error(`register ZIM robot failed! ${registerRobotResult.ErrorList[0].SubMessage}`);
                }
            } else {
                console.log("register ZIM robot failed with unknown error")
                throw new Error(`register ZIM robot failed! Code: ${registerRobotResult.Code}, Message: ${registerRobotResult.Message}`);
            }
        }


        // 保存 agent_instance_id
        // Save agent_instance_id
        const store = AgentStore.getInstance();
        const existingInstanceId = store.getAgentInstanceId();
        if (existingInstanceId) {
            await assistant.deleteAgentInstance(existingInstanceId);
            store.setAgentInstanceId("");
        }
        const result = await assistant.createAgentInstance(agent_id, user_id, {
            RoomId: room_id,
            AgentStreamId: agent_stream_id,
            AgentUserId: agent_user_id,
            UserStreamId: user_stream_id
        });
        const agent_instance_id = result.Data.AgentInstanceId;

        store.setAgentInstanceId(agent_instance_id);
        console.log("create agent instance", agent_instance_id, store.getAgentInstanceId());

        return Response.json({
            code: 0,
            message: 'start agent success',
            agent_id: agent_id,
            agent_name: agent_name,
            agent_instance_id: agent_instance_id
        }, { status: 200 });
    } catch (error) {
        console.error('register agent failed:', error);
        return Response.json({
            code: (error as any).code || 500,
            message: (error as any).message || 'start agent failed with unknown error'
        }, { status: 500 });
    }
}
