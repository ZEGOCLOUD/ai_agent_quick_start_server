import * as bailian20231229 from '@alicloud/bailian20231229'
import * as OpenApi from '@alicloud/openapi-client'
import * as Util from '@alicloud/tea-util'

// 创建阿里云客户端的函数
const createClient = () => {
    const config = new OpenApi.Config({
        accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    })

    config.endpoint = process.env.ALIBABA_CLOUD__SERVICE_ENDPOINT

    return new bailian20231229.default(config)
}

// 添加返回类型定义
interface BailianResponse {
  kbContent: string;
  rawResponse: any; // 保留原始响应，以防其他地方需要使用
}

// 检索函数
export const retrieveFromBailian = async ({ query }: { query: string }): Promise<BailianResponse> => {
    const client = createClient()
    const retrieveRequest = new bailian20231229.RetrieveRequest({
        query,
        enableReranking: false,
        indexId: process.env.ALIBABA_CLOUD_BAILIAN_KB_INDEX_ID,
    })

    const runtime = new Util.RuntimeOptions({})
    const headers = {}

    console.log(">>>>>>>>>>>>>>>>>>> 开始检索：", query, "检索 <<<<<<<<<<<<<<<<");
    const result = await client.retrieveWithOptions(
        process.env.ALIBABA_CLOUD_BAILIAN_WORKSPACE_ID!,
        retrieveRequest,
        headers,
        runtime
    )
    console.log(">>>>>>>>>>>>>>>>>>> 检索结果：", result, "检索结果 <<<<<<<<<<<<<<<<");

    if (!result?.body?.success || !result?.body?.data?.nodes) {
        throw new Error('资料库查询失败');
    }

    // 处理资料库内容
    const kbContent = result.body.data.nodes
        .slice(0, Number(process.env.KB_CHUNK_COUNT))
        .map((node: any) => `doc_name: ${node.metadata.doc_name}\ncontent: ${node.text}`)
        .join('\n\n');

    console.log(">>>>>>>>>>>>>>>>>>> 检索结果：", kbContent, "检索结果 <<<<<<<<<<<<<<<<");

    return {
        kbContent,
        rawResponse: result
    };
}