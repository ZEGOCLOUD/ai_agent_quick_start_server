import { NextRequest, NextResponse } from "next/server";
import { SendAgentInstanceTTSRequest, ZegoAIAgent } from "@/lib/zego/aiagent";

interface SendTTSRequestBody {
  agent_instance_id?: string;
  text?: string;
  add_history?: boolean;
  interrupt_mode?: 0 | 1;
  priority?: "Low" | "Medium" | "High";
  same_priority_option?: "ClearAndInterrupt" | "Enqueue";
  enqueue_user_speech?: boolean;
}

interface SendTTSResponse {
  code: number;
  message: string;
  agent_instance_id?: string;
  request_id?: string;
  round?: number;
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function buildTTSRequest(body: SendTTSRequestBody): SendAgentInstanceTTSRequest | null {
  const agentInstanceId = body.agent_instance_id;
  const text = body.text;

  if (!agentInstanceId || !text) {
    return null;
  }

  const requestBody: SendAgentInstanceTTSRequest = {
    AgentInstanceId: agentInstanceId,
    Text: text,
  };

  if (hasValue(body.add_history)) {
    requestBody.AddHistory = body.add_history;
  }
  if (hasValue(body.interrupt_mode)) {
    requestBody.InterruptMode = body.interrupt_mode;
  }
  if (hasValue(body.priority)) {
    requestBody.Priority = body.priority;
  }
  if (hasValue(body.same_priority_option)) {
    requestBody.SamePriorityOption = body.same_priority_option;
  }
  if (hasValue(body.enqueue_user_speech)) {
    requestBody.EnqueueUserSpeech = body.enqueue_user_speech;
  }

  return requestBody;
}

function createErrorResponse(code: number, message: string, status = 200): NextResponse {
  const response: SendTTSResponse = { code, message };
  return NextResponse.json(response, { status });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: SendTTSRequestBody = await req.json();
    const ttsRequest = buildTTSRequest(body);

    if (!ttsRequest) {
      return createErrorResponse(
        400,
        "请求参数不完整，缺少必需字段: agent_instance_id, text",
        400
      );
    }

    const assistant = ZegoAIAgent.getInstance();
    const result = await assistant.sendAgentInstanceTTS(ttsRequest);

    if (result.Code !== 0) {
      return createErrorResponse(result.Code, result.Message || "自定义调用 TTS 失败");
    }

    return NextResponse.json(
      {
        code: 0,
        message: "自定义调用 TTS 成功",
        agent_instance_id: ttsRequest.AgentInstanceId,
        request_id: result.Data?.RequestId || result.RequestId,
        round: result.Data?.Round,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("自定义调用 TTS 失败:", error);

    return NextResponse.json(
      {
        code: (error as any).code || 500,
        message: `自定义调用 TTS 失败: ${(error as any).message || "unknown error"}`,
      },
      { status: 500 }
    );
  }
}
