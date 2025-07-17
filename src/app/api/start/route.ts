import { NextRequest } from 'next/server';
import { ZegoAIAgent } from '@/lib/zego/aiagent';

// 这里只是作为最简单的示例。所以以下参数都是固定的。请根据您实际的场景进行动态设置。
// This is just the simplest example. So the following parameters are all fixed. Please set them dynamically according to your actual scenario.
const agent_id = "ai_agent_example_1";
const agent_name = "李浩然";
function randomId(prefix: string) {
    return prefix + Math.random().toString(36).substring(2, 10);
}

export async function POST(req: NextRequest) {
    try {
        const assistant = ZegoAIAgent.getInstance();
        const body = await req.json();
        const user_id = body.user_id;
        const room_id = body.room_id;
        const agent_stream_id = randomId("stream_agent_");
        const agent_user_id = randomId("user_agent_");
        const user_stream_id = body.user_stream_id;
        const result = await assistant.createAgentInstance(agent_id, user_id, {
            RoomId: room_id,
            AgentStreamId: agent_stream_id,
            AgentUserId: agent_user_id,
            UserStreamId: user_stream_id
        });
        const agent_instance_id = result.Data.AgentInstanceId;

        // store.setAgentInstanceId(agent_instance_id);
        console.log("create agent instance", agent_instance_id);

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
