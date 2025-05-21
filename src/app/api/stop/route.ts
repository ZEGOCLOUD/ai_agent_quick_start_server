import { NextRequest } from 'next/server';
import { ZegoAIAgent } from '@/lib/zego/aiagent';
import { AgentStore } from '@/lib/store';


export async function POST(req: NextRequest) {
    try {
        const store = AgentStore.getInstance();
        const agent_instance_id = store.getAgentInstanceId();
        console.log("try to delete instance: ", agent_instance_id)

        if (!agent_instance_id) {
            return Response.json({
                code: 404,
                message: 'agent instance not found'
            }, { status: 404 });
        }

        console.log("delete agent instance:", agent_instance_id);

        const assistant = ZegoAIAgent.getInstance();
        await assistant.deleteAgentInstance(agent_instance_id);

        // 删除存储的 agent_instance_id
        store.setAgentInstanceId("");

        return Response.json({
            code: 0,
            message: 'delete agent instance success'
        }, { status: 200 });
    } catch (error) {
        console.error('delete agent instance failed:', error);
        return Response.json(
            { code: (error as any).code || 500, message: 'delete agent instance failed' },
            { status: 500 }
        );
    }
}