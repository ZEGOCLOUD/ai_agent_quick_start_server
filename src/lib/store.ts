// 简单的内存存储实现 / Simple memory storage implementation
// 注意：这是一个示例实现，数据在服务器重启后会丢失
// Note: This is an example implementation, data will be lost after server restart

export class AgentStore {
    private static instance: AgentStore;
    private agentInstanceId: string = "";

    private constructor() {}

    public static getInstance(): AgentStore {
        if (!AgentStore.instance) {
            AgentStore.instance = new AgentStore();
        }
        return AgentStore.instance;
    }

    public setAgentInstanceId(agentInstanceId: string): void {
        this.agentInstanceId = agentInstanceId;
        console.log('Saved agent instance ID (Memory):', agentInstanceId);
    }

    public getAgentInstanceId(): string {
        console.log('Loaded agent instance ID (Memory):', this.agentInstanceId || 'null');
        return this.agentInstanceId;
    }
}