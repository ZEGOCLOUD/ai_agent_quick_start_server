// 定义检索响应的类型
interface RagFlowRetrievalResponse {
    code: number;
    data: {
        chunks: Array<{
            content: string;
            document_id: string;
            document_keyword: string;
            highlight: string;
            id: string;
            image_id: string;
            important_keywords: string[];
            kb_id: string;
            positions: string[];
            similarity: number;
            term_similarity: number;
            vector_similarity: number;
        }>;
        doc_aggs: Array<{
            count: number;
            doc_id: string;
            doc_name: string;
        }>;
        total: number;
    };
}

// 检索函数的参数接口
// 检索参数的含义请参考 RAGFlow 的文档：https://docs.ragflow.com/docs/api/retrieval
interface RetrieveParams {
    question: string;
    dataset_ids?: string[];
    document_ids?: string[];
    page?: number;
    page_size?: number;
    similarity_threshold?: number;
    vector_similarity_weight?: number;
    top_k?: number;
    rerank_id?: string;
    keyword?: boolean;
    highlight?: boolean;
}

// 新增返回类型接口
interface RagFlowResponse {
    kbContent: string;
    rawResponse: RagFlowRetrievalResponse;
}


// 修改检索函数的返回类型
export async function retrieveFromRagflow({
    question,
    dataset_ids = [process.env.RAGFLOW_KB_DATASET_ID!],
    document_ids = [],
    page = 1,
    page_size = 100,
    similarity_threshold = 0.2,
    vector_similarity_weight = 0.3,
    top_k = 1024,
    rerank_id,
    keyword = true,
    highlight = false,
}: RetrieveParams): Promise<RagFlowResponse> {
    // 检查必要的环境变量
    if (!process.env.RAGFLOW_API_KEY || !process.env.RAGFLOW_API_ENDPOINT) {
        throw new Error('缺少必要的RAGFlow配置信息');
    }

    // 检查必要的参数
    if (!dataset_ids?.length && !document_ids?.length) {
        throw new Error('dataset_ids 或 document_ids 至少需要提供一个');
    }

    // 构建请求体
    const requestBody = {
        question,
        dataset_ids,
        document_ids,
        page,
        page_size,
        similarity_threshold,
        vector_similarity_weight,
        top_k,
        rerank_id,
        keyword,
        highlight,
    };

    try {
        // 使用官方文档中的正确端点格式
        const response = await fetch(`${process.env.RAGFLOW_API_ENDPOINT}/api/v1/retrieval`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RAGFLOW_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`RAGFlow API 错误: ${response.status} ${response.statusText}, 详细信息: ${errorData}`);
        }

        const data: RagFlowRetrievalResponse = await response.json();


        // 处理检索结果，将其转换为拼接好的文本
        let kbContent = '';
        // 返回的 chunk 可能会很多，所以需要限制一下返回的 chunk 数量
        let kbCount = 0;

        for (const chunk of data.data.chunks) {
            if (kbCount < Number(process.env.KB_CHUNK_COUNT)) {
                kbContent += `doc_name: ${chunk.document_keyword}\ncontent: ${chunk.content}\n\n`;
                kbCount += 1;
            }
        }

        return {
            kbContent,
            rawResponse: data
        };

    } catch (error) {
        console.error('RAGFlow检索失败:', error);
        throw error;
    }
}