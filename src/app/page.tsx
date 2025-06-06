"use client";

import { useEffect, useState } from "react";

interface Agent {
  AgentId: string;
  Name: string;
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/passthrough-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ListAgents',
            data: {
              "Limit": 10,
              "Cursor": ""
            }
          }),
        });
        const data = await response.json();
        console.log('Fetched agents:', data);
        setAgents(data.Data.Agents);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };

    fetchAgents();
  }, []);

  return (
    <>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">ZEGO 实时互动 AI Agent</a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><a href="https://www.zego.im/" target="_blank">Home</a></li>
            <li><a href="https://doc-zh.zego.im/aiagent-android/introduction/overview" target="_blank">Docs</a></li>
            <li>
              <details>
                <summary>Sample Code</summary>
                <ul className="bg-base-100 rounded-t-none p-2">
                  <li><a href="https://github.com/ZEGOCLOUD/ai_agent_quick_start_server" target="_blank">Server</a></li>
                  <li><a href="https://github.com/ZEGOCLOUD/ai_agent_quick_start/tree/master/android" target="_blank">Android</a></li>
                  <li><a href="https://github.com/ZEGOCLOUD/ai_agent_quick_start/tree/master/ios" target="_blank">iOS</a></li>
                  <li><a href="https://github.com/ZEGOCLOUD/ai_agent_quick_start/tree/master/web" target="_blank">iOS</a></li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>

      <div role="alert" className="alert alert-info alert-soft flex flex-col">
        <div>智能体被打断、用户说话状态、智能体说话状态、异常事件等，请联系技术支持配置好回调后，在您的服务端终端查看日志输出！</div>
        <div className="mt-2">For events like agent interruption, user speaking status, agent speaking status, and exceptions, please contact technical support to configure callbacks and check the logs in your server terminal!</div>
      </div>

      <div className="min-h-screen p-8 flex items-center justify-center">


        {/* name of each tab group should be unique */}
        <div role="tablist" className="tabs tabs-lift tabs-xl">
          <input type="radio" name="my_tabs_2" className="tab" aria-label="智能体配置管理（Agent Management）" defaultChecked />
          <div className="tab-content" style={{ minHeight: '800px' }}>
            <label className="select w-full">
              <span className="label">Agent list(智能体列表)</span>
              <select className="select select-bordered w-full">
                {agents.map((agent) => (
                  <option key={agent.AgentId} value={agent.AgentId}>
                    {agent.Name}({agent.AgentId})
                  </option>
                ))}
              </select>
            </label>

            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">注册智能体（RegisterAgent）</div>
              <div className="collapse-content text-sm">
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>请注意检查参数是否有效！即使参数无效也可能注册成功！</span>
                </div>
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>Please check if the parameters are valid! Registration may succeed even with invalid parameters!</span>
                </div>  
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#register-agent-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  console.log('Button clicked', textarea.value); // 检查按钮是否被点击
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'RegisterAgent',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="register-agent-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentId": "test-agent-123",
    "Name": "测试智能体",
    "LLM": {
        "Url": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        "ApiKey": "eexxxxxxxxxxxxxxx",
        "Model": "ep-xxxxxxxxxx",
        "SystemPrompt": "你是小智，成年女性，是即构科技创造的陪伴助手，上知天文下知地理，聪明睿智、热情友善。对话要求：1、按照人设要求与用户对话。2、不能超过100字。"
    },
    "TTS": {
        "Vendor": "Bytedance",
        "Params": {
            "app": {
                "appid": "your_appid",
                "token": "your_token",
                "cluster": "volcano_tts"
            },
            "audio": {
                "voice_type": "your_voice_type"
            }
        }
    },
    "ASR": {
        "HotWord": "即构科技|10"
    }
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">修改智能体（UpdateAgent）</div>
              <div className="collapse-content text-sm">
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>请注意检查参数是否有效！即使参数无效也可能修改成功！</span>
                </div>
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>Please check if the parameters are valid! Update may succeed even with invalid parameters!</span>
                </div>
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#update-agent-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  console.log('Button clicked', textarea.value); // 检查按钮是否被点击
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'UpdateAgent',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="update-agent-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentId": "test-agent-123",
    "Name": "测试智能体",
    "LLM": {
        "Url": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        "ApiKey": "eexxxxxxxxxxxxxxx",
        "Model": "ep-xxxxxxxxxx",
        "SystemPrompt": "你是小智，成年女性，是即构科技创造的陪伴助手，上知天文下知地理，聪明睿智、热情友善。对话要求：1、按照人设要求与用户对话。2、不能超过100字。"
    },
    "TTS": {
        "Vendor": "Bytedance",
        "Params": {
            "app": {
                "appid": "your_appid",
                "token": "your_token",
                "cluster": "volcano_tts"
            },
            "audio": {
                "voice_type": "your_voice_type"
            }
        }
    },
    "ASR": {
        "HotWord": "即构科技|10"
    }
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">注销智能体（UnregisterAgent）</div>
              <div className="collapse-content text-sm">
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#unregister-agent-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  console.log('Button clicked', textarea.value); // 检查按钮是否被点击
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'UnregisterAgent',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="unregister-agent-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentId": "test-agent-123"
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
          </div>



          <input type="radio" name="my_tabs_2" className="tab" aria-label="智能体实例管理（Agent Instance Management）" />
          <div className="tab-content" style={{ minHeight: '800px' }}>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">创建智能体实例（CreateAgentInstance）</div>
              <div className="collapse-content text-sm">
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>请注意检查参数是否有效！即使参数无效也可能创建成功！</span>
                </div>
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>Please check if the parameters are valid! Creation may succeed even with invalid parameters!</span>
                </div>
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#create-agent-instance-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'CreateAgentInstance',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="create-agent-instance-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentId": "test-agent-123",
    "UserId": "user_1",
    "RTC": {
        "RoomId": "room_1",
        "AgentStreamId": "agent_stream_1",
        "AgentUserId": "agent_user_1",
        "UserStreamId": "user_stream_1"
    }
}

                  `}></textarea>
                </fieldset>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">修改智能体实例（UpdateAgentInstance）</div>
              <div className="collapse-content text-sm">
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>请注意检查参数是否有效！即使参数无效也可能修改成功！</span>
                </div>
                <div role="alert" className="alert alert-warning alert-soft">
                  <span>Please check if the parameters are valid! Update may succeed even with invalid parameters!</span>
                </div>
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#update-agent-instance-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'UpdateAgentInstance',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="update-agent-instance-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentInstanceId": "1912124734317838336",
    "LLM": {
        "Url": "https://api.minimax.chat/v2/text/chatcompletion_v2",
        "ApiKey": "your_api_key",
        "Model": "abab6.5s-chat",
        "SystemPrompt": "你是小智，成年女性，是即构科技创造的陪伴助手，上知天文下知地理，聪明睿智、热情友善。对话要求：1、按照人设要求与用户对话。2、不能超过100字。"
    }
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">删除智能体实例（DeleteAgentInstance）</div>
              <div className="collapse-content text-sm">
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#delete-agent-instance-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'DeleteAgentInstance',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="delete-agent-instance-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentInstanceId": "1909811657303920640"
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
          </div>



          <input type="radio" name="my_tabs_2" className="tab" aria-label="智能体实例控制（Agent Instance Control）" />
          <div className="tab-content" style={{ minHeight: '800px' }}>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">主动调用LLM（SendAgentInstanceLLM）</div>
              <div className="collapse-content text-sm">
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#send-instance-llm-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'SendAgentInstanceLLM',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="send-instance-llm-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentInstanceId": "1907755175297171456",
    "Text": "今天天气怎么样？"
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">主动调用TTS（SendAgentInstanceTTS）</div>
              <div className="collapse-content text-sm">
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#sned-instance-tts-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'SendAgentInstanceTTS',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="sned-instance-tts-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentInstanceId": "1907780504753553408",
    "Text": "尊敬的开发者你好，欢迎使用 ZEGO RTC 共建实时互动世界。"
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-100 border border-base-300">
              <input type="radio" name="my-accordion-2" />
              <div className="collapse-title font-semibold">查询智能体实例状态（QueryAgentInstanceStatus）</div>
              <div className="collapse-content text-sm">
                <button className="btn btn-sm" onClick={async () => {
                  const textarea = document.querySelector('#query-instance-textarea') as HTMLTextAreaElement;
                  if (!textarea) {
                    alert('找不到文本区域元素');
                    return;
                  }
                  try {
                    const response = await fetch('/api/passthrough-request', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: 'QueryAgentInstanceStatus',
                        data: JSON.parse(textarea.value)
                      }),
                    });
                    const result = await response.json();
                    alert(`请求结果：${JSON.stringify(result)}`);
                  } catch (error) {
                    alert('请求失败：' + (error as Error).message);
                  }
                }}>点我发起请求（Send Request）</button>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">请求参数（Request Parameters）</legend>
                  <textarea id="query-instance-textarea" className="textarea w-full h-[300px]" placeholder="请根据您地实际内容填写" defaultValue={`
{
    "AgentInstanceId": "1909811657303920640"
}
                  `}></textarea>
                </fieldset>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
