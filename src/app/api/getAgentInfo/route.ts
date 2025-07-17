import { NextRequest } from "next/server";
import { ZegoAIAgent } from "@/lib/zego/aiagent";
import { ZegoZIM } from "@/lib/zego/zim";

// 定义请求体类型
// Define request body type
interface RequestBody {
  user_id: string;
}

const agent_id_prefix = "ai_agent_1";
const agent_name = "李浩然";

export async function POST(req: NextRequest) {
  try {
    // 尝试从请求体获取参数 / Try to get parameters from request body
    let user_id: string = "";
    try {
      const body: RequestBody = await req.json();
      user_id = body.user_id || "";
    } catch (e) {
      // 如果解析请求体失败，忽略错误 / If parsing request body fails, ignore error
      console.log(
        "No request body or invalid JSON, will use stored instance ID"
      );
    }
    let agent_id = agent_id_prefix + "_" + user_id;
    let robot_user_id = '@RBT#'+agent_id;
    let robotResult: any;

    const assistant = ZegoAIAgent.getInstance();
    const agents = await assistant.queryAgents([agent_id]);
    console.log("query agents", agents);
    
    if (
      !agents ||
      agents.length === 0 ||
      !agents.find((agent: any) => agent.AgentId === agent_id)
    ) {
      // 智能体不存在，需要注册
      const res = await assistant.registerAgent(agent_id, agent_name);
      if (res.Code === 0) {
        console.log("register agent success");
        // 注册成功后注册ZIM机器人，用于存储对话历史记录
        // Register ZIM robot for storing conversation history after successful agent registration
        const zim = ZegoZIM.getInstance();
        robotResult = await zim.ensureRobotExists(robot_user_id);
        return Response.json(
          {
            code: 0,
            message: "get agent info success",
            agent_id: agent_id,
            agent_name: agent_name,
            robot_id: robotResult.robotId,
            is_new_robot_registration: robotResult.isNewRegistration,
          },
          { status: 200 }
        );
      } else {
        // 智能体注册失败，不注册机器人，直接返回失败响应
        // Agent registration failed, don't register robot, return error response
        console.log("register agent failed", res);
        return Response.json(
          {
            code: res.Code || 500,
            message: res.Message || "register agent failed",
          },
          { status: 500 }
        );
      }
    } else {
      // 智能体已存在，注册ZIM机器人
      // Agent already exists, register ZIM robot
      console.log("agent already exists");
      const zim = ZegoZIM.getInstance();
      robotResult = await zim.ensureRobotExists(robot_user_id);
      return Response.json(
        {
          code: 0,
          message: "get agent info success",
          agent_id: agent_id,
          agent_name: agent_name,
          robot_id: robotResult.robotId
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("register agent failed:", error);
    return Response.json(
      {
        code: (error as any).code || 500,
        message:
          (error as any).message || "start agent failed with unknown error",
      },
      { status: 500 }
    );
  }
}