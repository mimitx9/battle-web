import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// AG-UI Standard Event Types
type AGUIEvent =
    | { type: 'RUN_START'; runId: string; timestamp: number }
    | { type: 'TEXT_MESSAGE_CONTENT'; content: string; delta?: boolean }
    | { type: 'TOOL_CALL_START'; toolName: string; args: Record<string, any>; callId: string }
    | { type: 'TOOL_CALL_RESULT'; toolName: string; result: any; callId: string; success: boolean }
    | { type: 'STATE_DELTA'; state: Record<string, any> }
    | { type: 'RUN_COMPLETE'; runId: string; timestamp: number }
    | { type: 'ERROR'; error: string; code?: string; timestamp: number };

interface RequestBody {
    prompt: string;
    context?: string;
    preferences?: {
        language?: 'vi' | 'en';
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        showHints?: boolean;
    };
    messages?: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
}

// Helper: Upload audio Buffer to Gemini Files API and return { uri, mimeType }
async function uploadAudioToGemini(fileBytes: Uint8Array, mimeType: string, displayName: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const startRes = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
        method: 'POST',
        headers: {
            'x-goog-api-key': apiKey,
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': String(fileBytes.byteLength),
            'X-Goog-Upload-Header-Content-Type': mimeType,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file: { display_name: displayName || 'AUDIO' } })
    });
    if (!startRes.ok) {
        const txt = await startRes.text();
        throw new Error(`Gemini start upload failed: ${startRes.status} ${txt}`);
    }
    const uploadUrl = startRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) throw new Error('Missing x-goog-upload-url from Gemini response');

    // Convert Uint8Array to ArrayBuffer slice for fetch body
    const arrayBuffer = fileBytes.buffer.slice(fileBytes.byteOffset, fileBytes.byteOffset + fileBytes.byteLength);

    const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Content-Length': String(fileBytes.byteLength),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize'
        },
        body: arrayBuffer as any
    });
    if (!uploadRes.ok) {
        const txt = await uploadRes.text();
        throw new Error(`Gemini bytes upload failed: ${uploadRes.status} ${txt}`);
    }
    const info = await uploadRes.json();
    const uri = info?.file?.uri;
    const mt = info?.file?.mime_type || mimeType;
    if (!uri) throw new Error('Gemini upload missing file.uri');
    return { uri, mimeType: mt } as { uri: string; mimeType: string };
}

// Helper: From external audio URL -> bytes -> upload to Gemini -> return file ref
async function ensureGeminiFileFromUrl(audioUrl?: string) {
    if (!audioUrl) return undefined;
    try {
        const head = await fetch(audioUrl, { method: 'HEAD' });
        if (!head.ok) throw new Error('HEAD failed');
        const mime = head.headers.get('content-type') || 'audio/mpeg';
        const getRes = await fetch(audioUrl);
        if (!getRes.ok) throw new Error('GET audio failed');
        const arr = new Uint8Array(await getRes.arrayBuffer());
        if (arr.byteLength === 0) throw new Error('Empty audio');
        const uploaded = await uploadAudioToGemini(arr, mime, 'user_speaking');
        return uploaded; // { uri, mimeType }
    } catch (e) {
        console.warn('[AGUI] Failed to prepare Gemini file from URL:', audioUrl, e);
        return undefined;
    }
}

// (removed) evaluateSpeakingWithGemini — no longer used

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();

    // Create Server-Sent Events stream following AG-UI protocol
    const stream = new ReadableStream({
        async start(controller) {
            try {
                const body = (await req.json()) as RequestBody;
                const {
                    prompt,
                    context = 'general',
                    preferences = {},
                    messages = []
                } = body;

                // Validate input
                if (!prompt || typeof prompt !== 'string') {
                    sendEvent(controller, encoder, {
                        type: 'ERROR',
                        error: 'Missing or invalid prompt',
                        code: 'INVALID_INPUT',
                        timestamp: Date.now()
                    });
                    controller.close();
                    return;
                }

                // Generate unique run ID
                const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

                // Event 1: RUN_START - Signal beginning of agent execution
                sendEvent(controller, encoder, {
                    type: 'RUN_START',
                    runId,
                    timestamp: Date.now()
                });

                // Provider: force OpenAI only
                const openaiKey = process.env.OPENAI_API_KEY;
                const useOpenAI = true;
                if (!openaiKey) {
                    sendEvent(controller, encoder, {
                        type: 'ERROR',
                        error: 'OPENAI_API_KEY not configured in environment',
                        code: 'CONFIG_ERROR',
                        timestamp: Date.now()
                    });
                    controller.close();
                    return;
                }

                // Check for special no-history correction message
                if (prompt.includes('(NO_QUIZ_HISTORY)')) {
                    const humorousResponse = "Chưa thi mà đã bắt Streak chữa thì chữa cái gì, troll vl";
                    
                    // Send humorous response directly
                    sendEvent(controller, encoder, {
                        type: 'TEXT_MESSAGE_CONTENT',
                        content: humorousResponse,
                        delta: false
                    });
                    
                    // Complete the run
                    sendEvent(controller, encoder, {
                        type: 'RUN_COMPLETE',
                        runId,
                        timestamp: Date.now()
                    });
                    
                    controller.close();
                    return;
                }

                // Prepare system instruction for OpenAI
                const systemInstruction = `Bạn là trợ lý học tập VSTEP thông minh và thân thiện.

Context hiện tại: ${context}
Độ khó: ${preferences.difficulty || 'intermediate'}
Hiển thị gợi ý chi tiết: ${preferences.showHints ? 'có' : 'không'}
Ngôn ngữ: ${preferences.language || 'vi'}

NHIỆM VỤ:
- Trả lời ngắn gọn, rõ ràng, hữu ích về VSTEP
- Chỉ gọi tool get_quiz_attempt_history khi user YÊU CẦU CỤ THỂ về lịch sử quiz
- Chỉ gọi tool get_quiz_attempt_detail khi user YÊU CẦU CỤ THỂ về chi tiết một attempt với ID cụ thể
- Chỉ gọi tool get_writing_data khi user YÊU CẦU CỤ THỂ về chữa bài writing
- Phân tích nội dung từ lịch sử chat trước đó để trả lời câu hỏi tổng hợp

QUY TẮC QUAN TRỌNG:
- KHÔNG gọi tool cho câu hỏi chung chung như "đánh giá", "như nào", "là sao"
- CHỈ gọi tool khi user hỏi trực tiếp về: "lịch sử quiz", "bài thi trước", "điểm số của tôi", "thống kê học tập", "chữa bài writing"
- CHỈ gọi get_quiz_attempt_detail khi user nói: "xem đề [SỐ]", "đáp án mã đề [SỐ]", "kết quả đề [SỐ]", "lấy cho tôi quiz [SỐ]"
- CHỈ gọi get_writing_data khi user nói: "chữa bài writing", "đánh giá bài viết", "chấm điểm writing", "nhận xét bài writing"
- CHỈ gọi get_speaking_data khi user nói: "chữa bài speaking", "đánh giá bài nói", "chấm điểm speaking", "nhận xét bài speaking"
- KHÔNG gọi get_speaking_data nếu user chỉ xin \"gợi ý\", \"hướng dẫn\", \"mẹo\", \"cách trả lời\" cho Speaking; trong các trường hợp này hãy dùng đề bài (questionText) và transcript đã có trong cuộc hội thoại (nếu có) để đưa gợi ý, KHÔNG gọi thêm tool.

VÍ DỤ CỤ THỂ VỀ EXTRACT ATTEMPTID:
- User nói: "lấy cho tôi quiz 132" → attemptId: 132
- User nói: "xem đáp án mã đề 456" → attemptId: 456  
- User nói: "kết quả đề 789" → attemptId: 789
- User nói: "mã đề 123" → attemptId: 123
- User nói: "chữa bài writing đề 456" → attemptId: 456
- User nói: "chữa bài speaking đề 789" → attemptId: 789

QUAN TRỌNG: Khi gọi get_quiz_attempt_detail, get_writing_data hoặc get_speaking_data, PHẢI extract chính xác số ID từ câu nói của user và đặt vào field attemptId.

- Nếu đã có dữ liệu lịch sử trong conversation (system messages), sử dụng dữ liệu đó để trả lời câu hỏi đánh giá/ý kiến
- Khi user hỏi "đánh giá kết quả", hãy phân tích dữ liệu lịch sử có sẵn và đưa ra lời khuyên cụ thể
- Trả lời câu hỏi đánh giá/ý kiến dựa trên dữ liệu thực tế từ lịch sử quiz, không chỉ kiến thức chung


QUY TẮC ĐẶC BIỆT CHO CHỮA BÀI TIẾNG ANH:
- Khi chữa bài Writing hoặc Speaking tiếng Anh, PHẢI đưa ra các câu cải thiện bằng TIẾNG ANH, không phải tiếng Việt
- Ví dụ: Nếu học sinh viết "I live in Manchester with family", câu cải thiện phải là "I currently live in Manchester with my family" (tiếng Anh), KHÔNG phải "Hiện tại tôi đang sống ở Manchester cùng với gia đình" (tiếng Việt)
- Phản hồi và giải thích có thể bằng tiếng Việt, nhưng các câu cải thiện cụ thể PHẢI bằng tiếng Anh
- Mục tiêu: Giúp học sinh cải thiện kỹ năng viết/nói tiếng Anh bằng cách đưa ra ví dụ tiếng Anh tốt hơn

LƯU Ý QUAN TRỌNG:
- Đánh giá theo đúng 4 tiêu chí VSTEP
- Điểm mạnh và cần cải thiện phải CỤ THỂ, có ví dụ từ bài viết
- Lỗi ngữ pháp phải nêu rõ câu nào lỗi và cách sửa
- Gợi ý từ vựng phải nêu từ cụ thể và lý do
- Các câu cải thiện phải bằng TIẾNG ANH
- Tránh nhận xét chung chung, tập trung vào điểm có thể cải thiện

QUY TẮC ĐẶC BIỆT CHO USER CHƯA CÓ LỊCH SỬ QUIZ:
- Nếu user gửi tin nhắn có chứa "(NO_QUIZ_HISTORY)" và yêu cầu chữa bài hoặc xem đáp án, hãy trả lời: "Chưa thi mà đã bắt Streak chữa thì chữa cái gì, troll vl"
- KHÔNG gọi bất kỳ tool nào khi thấy "(NO_QUIZ_HISTORY)" trong tin nhắn
- Chỉ trả lời bằng câu trên và kết thúc`;



                // Get auth token for quiz API calls
                const authHeader = req.headers.get('authorization') ||
                    req.headers.get('Authorization') || '';
                const headerQuizBaseUrl = req.headers.get('x-quiz-base-url') || req.headers.get('X-Quiz-Base-Url');
                const quizBaseUrl = headerQuizBaseUrl || process.env.QUIZ_API_URL || process.env.NEXT_PUBLIC_QUIZ_API_URL;
                if (!quizBaseUrl) {
                    console.warn('[AGUI] Missing quiz base URL configuration', {
                        headerQuizBaseUrl,
                        QUIZ_API_URL: process.env.QUIZ_API_URL,
                        NEXT_PUBLIC_QUIZ_API_URL: process.env.NEXT_PUBLIC_QUIZ_API_URL
                    });
                    sendEvent(controller, encoder, {
                        type: 'ERROR',
                        error: 'QUIZ_API_URL / NEXT_PUBLIC_QUIZ_API_URL not configured in environment',
                        code: 'CONFIG_ERROR',
                        timestamp: Date.now()
                    });
                    controller.close();
                    return;
                }

                // Helper function to call quiz history API
                async function callQuizHistory(params: { offset?: number; size?: number }) {
                    const offset = params.offset ?? 0;
                    const size = params.size ?? 5;
                    const url = `${quizBaseUrl}/quiz/attempt/history?offset=${offset}&size=${size}`;

                    const res = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            ...(authHeader ? { Authorization: authHeader } : {})
                        }
                    });

                    if (!res.ok) {
                        // Handle 401 error
                        if (res.status === 401) {
                            sendEvent(controller, encoder, {
                                type: 'ERROR',
                                error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                                code: 'AUTH_ERROR',
                                timestamp: Date.now()
                            });
                            controller.close();
                            return null;
                        }
                        
                        const errorText = await res.text();
                        throw new Error(`Quiz History API failed: ${res.status} - ${errorText}`);
                    }

                    return await res.json();
                }

                // Helper: Upload audio Buffer to Gemini Files API and return { uri, mimeType }
                async function uploadAudioToGemini(fileBytes: Uint8Array, mimeType: string, displayName: string) {
                    const apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        throw new Error('GEMINI_API_KEY not configured');
                    }

                    // Start resumable upload
                    const startRes = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
                        method: 'POST',
                        headers: {
                            'x-goog-api-key': apiKey,
                            'X-Goog-Upload-Protocol': 'resumable',
                            'X-Goog-Upload-Command': 'start',
                            'X-Goog-Upload-Header-Content-Length': String(fileBytes.byteLength),
                            'X-Goog-Upload-Header-Content-Type': mimeType,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ file: { display_name: displayName || 'AUDIO' } })
                    });
                    if (!startRes.ok) {
                        const txt = await startRes.text();
                        throw new Error(`Gemini start upload failed: ${startRes.status} ${txt}`);
                    }
                    const uploadUrl = startRes.headers.get('x-goog-upload-url');
                    if (!uploadUrl) throw new Error('Missing x-goog-upload-url from Gemini response');

                    // Upload bytes and finalize
                    const copy = new Uint8Array(fileBytes.byteLength);
                    copy.set(fileBytes);
                    const blobBody = new Blob([copy.buffer], { type: mimeType });
                    const uploadRes = await fetch(uploadUrl, {
                        method: 'POST',
                        headers: {
                            'X-Goog-Upload-Offset': '0',
                            'X-Goog-Upload-Command': 'upload, finalize'
                        },
                        body: blobBody as any
                    });
                    if (!uploadRes.ok) {
                        const txt = await uploadRes.text();
                        throw new Error(`Gemini bytes upload failed: ${uploadRes.status} ${txt}`);
                    }
                    const info = await uploadRes.json();
                    const uri = info?.file?.uri;
                    const mt = info?.file?.mime_type || mimeType;
                    if (!uri) throw new Error('Gemini upload missing file.uri');
                    return { uri, mimeType: mt } as { uri: string; mimeType: string };
                }

                // Helper: From external audio URL -> bytes -> upload to Gemini -> return file ref
                async function ensureGeminiFileFromUrl(audioUrl?: string) {
                    if (!audioUrl) return undefined;
                    try {
                        const head = await fetch(audioUrl, { method: 'HEAD' });
                        if (!head.ok) throw new Error('HEAD failed');
                        const mime = head.headers.get('content-type') || 'audio/mpeg';
                        const getRes = await fetch(audioUrl);
                        if (!getRes.ok) throw new Error('GET audio failed');
                        const arr = new Uint8Array(await getRes.arrayBuffer());
                        if (arr.byteLength === 0) throw new Error('Empty audio');
                        const uploaded = await uploadAudioToGemini(arr, mime, 'user_speaking');
                        return uploaded; // { uri, mimeType }
                    } catch (e) {
                        console.warn('[AGUI] Failed to prepare Gemini file from URL:', audioUrl, e);
                        return undefined;
                    }
                }

                // (removed) evaluateSpeakingWithGemini — no longer used

                // Helper function to extract attemptId from user prompt
                function extractAttemptIdFromPrompt(userPrompt: string): number | null {
                    // Try to find attempt ID in various formats
                    const patterns = [
                        /attempt\s+(\d+)/i,
                        /quiz\s+attempt\s+(\d+)/i,
                        /chi\s+tiết\s+attempt\s+(\d+)/i,
                        /kết\s+quả\s+attempt\s+(\d+)/i,
                        /lấy\s+cho\s+tôi\s+quiz\s+attempt\s+(\d+)/i,
                        /(\d+)/ // Last resort: any number
                    ];

                    for (const pattern of patterns) {
                        const match = userPrompt.match(pattern);
                        if (match && match[1]) {
                            const id = parseInt(match[1], 10);
                            if (id > 0) {
                                console.log('🔍 [AGUI] Extracted attemptId from prompt:', { userPrompt, extractedId: id });
                                return id;
                            }
                        }
                    }

                    console.warn('⚠️ [AGUI] Could not extract attemptId from prompt:', userPrompt);
                    return null;
                }

                // Helper function to call quiz attempt detail API
                async function callQuizAttemptDetailWithPrompt(params: { attemptId: number }, userPrompt: string = '') {
                    let { attemptId } = params;

                    // If attemptId is invalid, try to extract from user prompt
                    if (!attemptId || typeof attemptId !== 'number' || attemptId <= 0) {
                        if (userPrompt) {
                            const extractedId = extractAttemptIdFromPrompt(userPrompt);
                            if (extractedId) {
                                attemptId = extractedId;
                                console.log('🔍 [AGUI] Using extracted attemptId:', attemptId);
                            }
                        }
                    }

                    // Validate attemptId
                    if (!attemptId || typeof attemptId !== 'number' || attemptId <= 0) {
                        throw new Error(`Invalid attemptId: ${attemptId}. Must be a positive integer. User prompt: "${userPrompt || 'N/A'}"`);
                    }

                    const url = `${quizBaseUrl}/quiz/attempt/${attemptId}`;

                    console.log('🔍 [AGUI] Calling quiz attempt detail API:', {
                        url,
                        attemptId,
                        quizBaseUrl,
                        hasAuth: !!authHeader
                    });

                    try {
                        const res = await fetch(url, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                ...(authHeader ? { Authorization: authHeader } : {})
                            }
                        });

                        console.log('🔍 [AGUI] Quiz attempt detail API response:', {
                            status: res.status,
                            statusText: res.statusText,
                            ok: res.ok
                        });

                        if (!res.ok) {
                            // Handle 401 error
                            if (res.status === 401) {
                                sendEvent(controller, encoder, {
                                    type: 'ERROR',
                                    error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                                    code: 'AUTH_ERROR',
                                    timestamp: Date.now()
                                });
                                controller.close();
                                return null;
                            }
                            
                            const errorText = await res.text();
                            console.error('❌ [AGUI] Quiz attempt detail API failed:', {
                                status: res.status,
                                statusText: res.statusText,
                                errorText
                            });
                            throw new Error(`Quiz Attempt Detail API failed: ${res.status} - ${errorText}`);
                        }

                        const result = await res.json();
                        console.log('✅ [AGUI] Quiz attempt detail API success:', {
                            hasData: !!result.data,
                            dataKeys: result.data ? Object.keys(result.data) : []
                        });

                        return result;
                    } catch (error: any) {
                        console.error('❌ [AGUI] Quiz attempt detail API error:', error);
                        throw error;
                    }
                }

                // Helper function to call quiz attempt detail by type API
                async function callQuizAttemptDetailByType(params: { attemptId: number; type: string }, userPrompt: string = '') {
                    let { attemptId } = params;
                    const { type } = params;

                    // If attemptId is invalid, try to extract from user prompt
                    if (!attemptId || typeof attemptId !== 'number' || attemptId <= 0) {
                        if (userPrompt) {
                            const extractedId = extractAttemptIdFromPrompt(userPrompt);
                            if (extractedId) {
                                attemptId = extractedId;
                                console.log('🔍 [AGUI] Using extracted attemptId:', attemptId);
                            }
                        }
                    }

                    // Validate attemptId
                    if (!attemptId || typeof attemptId !== 'number' || attemptId <= 0) {
                        throw new Error(`Invalid attemptId: ${attemptId}. Must be a positive integer. User prompt: "${userPrompt || 'N/A'}"`);
                    }

                    // Validate type
                    if (!type || !['LISTENREADING', 'WRITING', 'SPEAKING'].includes(type)) {
                        throw new Error(`Invalid type: ${type}. Must be one of: LISTENREADING, WRITING, SPEAKING`);
                    }

                    const url = `${quizBaseUrl}/quiz/attempt/${attemptId}?type=${type}`;

                    console.log('🔍 [AGUI] Calling quiz attempt detail by type API:', {
                        url,
                        attemptId,
                        type,
                        quizBaseUrl,
                        hasAuth: !!authHeader
                    });

                    try {
                        const res = await fetch(url, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                ...(authHeader ? { Authorization: authHeader } : {})
                            }
                        });

                        console.log('🔍 [AGUI] Quiz attempt detail by type API response:', {
                            status: res.status,
                            statusText: res.statusText,
                            ok: res.ok
                        });

                        if (!res.ok) {
                            // Handle 401 error
                            if (res.status === 401) {
                                sendEvent(controller, encoder, {
                                    type: 'ERROR',
                                    error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                                    code: 'AUTH_ERROR',
                                    timestamp: Date.now()
                                });
                                controller.close();
                                return null;
                            }
                            
                            const errorText = await res.text();
                            console.error('❌ [AGUI] Quiz attempt detail by type API failed:', {
                                status: res.status,
                                statusText: res.statusText,
                                errorText
                            });
                            throw new Error(`Quiz Attempt Detail By Type API failed: ${res.status} - ${errorText}`);
                        }

                        const result = await res.json();
                        console.log('🔍 [AGUI] Quiz attempt detail by type API success:', {
                            hasData: !!result.data,
                            attemptId: result.data?.attemptId,
                            type: result.data?.type
                        });

                        return result;
                    } catch (error: any) {
                        console.error('❌ [AGUI] Quiz attempt detail by type API error:', error);
                        throw error;
                    }
                }



                // OpenAI API endpoint
                const openaiChatEndpoint = 'https://api.openai.com/v1/chat/completions';

                // Prepare function calling tools for OpenAI
                const availableTools = [
                    {
                        type: "function",
                        function: {
                            name: "get_quiz_attempt_history",
                            description: "CHỈ sử dụng khi user hỏi trực tiếp về lịch sử quiz cụ thể: 'lịch sử quiz của tôi', 'bài thi trước đây', 'điểm số của tôi', 'thống kê học tập'. KHÔNG sử dụng cho câu hỏi chung chung như 'đánh giá', 'ý kiến', 'như nào'.",
                            parameters: {
                                type: "object",
                                properties: {
                                    offset: {
                                        type: "integer",
                                        description: "Số lượng bài thi bỏ qua từ đầu (mặc định 0)",
                                        default: 0
                                    },
                                    size: {
                                        type: "integer",
                                        description: "Số lượng bài thi cần lấy (mặc định 5)",
                                        default: 5
                                    }
                                },
                                required: []
                            }
                        }
                    },
                    {
                        type: "function",
                        function: {
                            name: "get_quiz_attempt_detail",
                            description: "Sử dụng khi user yêu cầu xem đáp án một mã đề cụ thể theo ID. Ví dụ: 'xem đề 123', 'chi tiết đề 456', 'kết quả đề 789', 'lấy cho tôi quiz 132'. QUAN TRỌNG: Phải extract chính xác số ID từ câu nói của user và đặt vào field mã đề.",
                            parameters: {
                                type: "object",
                                properties: {
                                    attemptId: {
                                        type: "integer",
                                        description: "ID số của lượt mã đề cần xem đáp án. Phải là số nguyên dương. Ví dụ: nếu user nói 'đề 132' thì mã đề = 132. Nếu user nói 'lấy cho tôi quiz 456' thì mã đề = 456."
                                    }
                                },
                                required: ["attemptId"]
                            }
                        }
                    },
                    {
                        type: "function",
                        function: {
                            name: "get_quiz_attempt_by_type",
                            description: "Sử dụng khi user yêu cầu xem đáp án mã đề theo loại cụ thể (Listening+Reading, Writing, hoặc Speaking). Ví dụ: 'xem writing attempt 123', 'chi tiết speaking attempt 123', 'listening reading attempt 123'. Tool này sẽ trả về thông tin chi tiết về attempt theo loại được chỉ định.",
                            parameters: {
                                type: "object",
                                properties: {
                                    attemptId: {
                                        type: "integer",
                                        description: "ID số của lượt mã đề cần xem đáp án. Phải là số nguyên dương."
                                    },
                                    type: {
                                        type: "string",
                                        enum: ["LISTENREADING", "WRITING", "SPEAKING"],
                                        description: "Loại quiz cần lấy: LISTENREADING (Listening + Reading), WRITING (Writing), SPEAKING (Speaking)."
                                    }
                                },
                                required: ["attemptId", "type"]
                            }
                        }
                    },
                    {
                        type: "function",
                        function: {
                            name: "get_writing_data",
                            description: "Sử dụng khi user yêu cầu chữa bài writing hoặc đánh giá bài viết. Ví dụ: 'chữa bài writing', 'đánh giá bài viết', 'chấm điểm writing', 'nhận xét bài writing'. Tool này sẽ lấy dữ liệu bài writing để AI phân tích và chữa bài.",
                            parameters: {
                                type: "object",
                                properties: {
                                    attemptId: {
                                        type: "integer",
                                        description: "ID số của lượt attempt chứa bài writing cần chữa. Phải là số nguyên dương."
                                    }
                                },
                                required: ["attemptId"]
                            }
                        }
                    },
                    // New: speaking data tool
                    {
                        type: "function",
                        function: {
                            name: "get_speaking_data",
                            description: "Sử dụng khi user yêu cầu chữa bài speaking hoặc đánh giá bài nói. Ví dụ: 'chữa bài speaking', 'đánh giá bài nói', 'chấm điểm speaking', 'nhận xét bài speaking'. Tool này sẽ lấy dữ liệu bài speaking để AI phân tích và chữa bài.",
                            parameters: {
                                type: "object",
                                properties: {
                                    attemptId: {
                                        type: "integer",
                                        description: "ID số của lượt attempt chứa bài speaking cần chữa. Phải là số nguyên dương."
                                    }
                                },
                                required: ["attemptId"]
                            }
                        }
                    },
                    
                ];

                // Always use OpenAI: build message list and stream
                const openaiMessages: Array<{ 
                    role: 'system' | 'user' | 'assistant' | 'tool'; 
                    content: string;
                    tool_call_id?: string;
                }> = [];
                openaiMessages.push({ role: 'system', content: systemInstruction });

                console.log('🔍 [DEBUG] Received messages from client:', {
                    totalMessages: messages.length,
                    messages: messages.map(m => ({
                        role: m.role,
                        contentLength: m.content.length,
                        contentPreview: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
                    }))
                });

                for (const m of messages.slice(-50)) {
                    const role = m.role === 'assistant' ? 'assistant' : (m.role === 'system' ? 'system' : 'user');
                    openaiMessages.push({ role, content: m.content });
                }
                openaiMessages.push({ role: 'user', content: prompt });

                // Detailed logging: full context and messages sent to OpenAI
                try {
                    // In toàn bộ messages gửi lên OpenAI (KHÔNG preview)
                    console.log('🔍 [DEBUG] Final OpenAI messages (FULL):', {
                        totalMessages: openaiMessages.length,
                        messages: openaiMessages
                    });

                    // Đồng thời in từng message theo thứ tự để dễ đọc
                    openaiMessages.forEach((m, idx) => {
                        console.log(`🔍 [DEBUG] OpenAI message #${idx + 1}`, {
                            role: m.role,
                            content: m.content
                        });
                    });
                } catch (e) {
                    console.warn('⚠️ [DEBUG] Failed to print full OpenAI messages:', e);
                }

                await streamOpenAIWithFunctionCalling(controller, encoder, openaiChatEndpoint, openaiKey as string, openaiMessages, availableTools, callQuizHistory, callQuizAttemptDetailWithPrompt, callQuizAttemptDetailByType, prompt);

                // Event: RUN_COMPLETE
                sendEvent(controller, encoder, {
                    type: 'RUN_COMPLETE',
                    runId,
                    timestamp: Date.now()
                });

                controller.close();

            } catch (error: any) {
                console.error('AG-UI Stream Error:', error);
                sendEvent(controller, encoder, {
                    type: 'ERROR',
                    error: error.message || 'Unexpected internal error',
                    code: 'INTERNAL_ERROR',
                    timestamp: Date.now()
                });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable nginx buffering
        }
    });
}

// Helper: Send AG-UI event as SSE
function sendEvent(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    event: AGUIEvent
) {
    const eventData = JSON.stringify(event);
    const sseMessage = `data: ${eventData}\n\n`;
    controller.enqueue(encoder.encode(sseMessage));
}

// Helper: Stream text in chunks for smooth typing effect
async function streamTextWithDeltas(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    text: string
) {
    const words = text.split(' ');
    const chunkSize = 2; // Words per chunk for smoother effect

    for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';

        sendEvent(controller, encoder, {
            type: 'TEXT_MESSAGE_CONTENT',
            content: chunk,
            delta: true
        });

        // Small delay for streaming effect (adjust as needed)
        await new Promise(resolve => setTimeout(resolve, 12));
    }
}

// Helper: Stream from OpenAI Chat Completions with Function Calling support
async function streamOpenAIWithFunctionCalling(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    openaiChatEndpoint: string,
    openaiKey: string,
    openaiMessages: Array<{ 
        role: 'system' | 'user' | 'assistant' | 'tool'; 
        content: string;
        tool_call_id?: string;
    }>,
    availableTools: any[],
    callQuizHistory: (params: { offset?: number; size?: number }) => Promise<any>,
    callQuizAttemptDetailWithPrompt: (params: { attemptId: number }, userPrompt: string) => Promise<any>,
    callQuizAttemptDetailByType: (params: { attemptId: number; type: string }, userPrompt: string) => Promise<any>,
    userPrompt: string
) {
    const messages = [...openaiMessages];
    const maxIterations = 5; // Prevent infinite loops
    let iteration = 0;

    // Minimal HTML stripper for extracted question text
    function stripHtml(input: string): string {
        try {
            if (typeof input !== 'string') return '';
            const withoutTags = input
                .replace(/<[^>]*>/g, ' ') // remove tags
                .replace(/\s+/g, ' ') // collapse whitespace
                .trim();
            // Decode a few common entities
            return withoutTags
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        } catch (_) {
            return String(input || '');
        }
    }

    while (iteration < maxIterations) {
        iteration++;
        console.log(`🔍 [AGUI] Iteration ${iteration}/${maxIterations}`);

        // Log FULL messages right before calling OpenAI in each iteration
        try {
            console.log('🔍 [DEBUG] OpenAI request messages (FULL) before fetch:', {
                iteration,
                messageCount: messages.length,
                messages
            });
        } catch (e) {
            console.warn('⚠️ [DEBUG] Failed to log OpenAI request messages:', e);
        }

        const resp = await fetch(openaiChatEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4.1-mini-2025-04-14',
                stream: true,
                messages: messages,
                tools: availableTools,
                tool_choice: 'auto'
            })
        });

        if (!resp.ok || !resp.body) {
            const errText = await resp.text().catch(() => '');
            throw new Error(`OpenAI stream request failed: ${resp.status} ${errText}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Track tool calls being accumulated
        const toolCallsInProgress = new Map<number, {
            id?: string;
            name?: string;
            arguments: string;
        }>();
        let assistantContent = '';
        let finishReason = '';

        // Stream and accumulate response
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const events = buffer.split('\n\n');
            buffer = events.pop() || '';

            for (const evt of events) {
                if (!evt.startsWith('data: ')) continue;
                const dataStr = evt.slice(6);
                if (dataStr === '[DONE]') {
                    finishReason = 'done';
                    break;
                }

                try {
                    const data = JSON.parse(dataStr);
                    const choice = data?.choices?.[0];
                    if (!choice) continue;

                    const delta = choice.delta;
                    finishReason = choice.finish_reason || finishReason;

                    // Handle text content
                    if (delta?.content) {
                        assistantContent += delta.content;
                        sendEvent(controller, encoder, {
                            type: 'TEXT_MESSAGE_CONTENT',
                            content: delta.content,
                            delta: true
                        });
                    }

                    // Handle tool calls - accumulate arguments
                    if (delta?.tool_calls && Array.isArray(delta.tool_calls)) {
                        for (const toolCallDelta of delta.tool_calls) {
                            const index = toolCallDelta.index ?? 0;

                            if (!toolCallsInProgress.has(index)) {
                                toolCallsInProgress.set(index, {
                                    id: undefined,
                                    name: undefined,
                                    arguments: ''
                                });
                            }

                            const current = toolCallsInProgress.get(index)!;

                            // Accumulate fields
                            if (toolCallDelta.id) current.id = toolCallDelta.id;
                            if (toolCallDelta.function?.name) current.name = toolCallDelta.function.name;
                            if (toolCallDelta.function?.arguments) {
                                current.arguments += toolCallDelta.function.arguments;
                            }

                            console.log('🔍 [AGUI] Accumulated tool call:', {
                                index,
                                id: current.id,
                                name: current.name,
                                argsLength: current.arguments.length
                            });
                        }
                    }
                } catch (parseErr) {
                    console.error('[AGUI] Failed to parse SSE chunk:', parseErr);
                }
            }
        }

        // Check if we have tool calls to execute
        if (toolCallsInProgress.size === 0) {
            // No tool calls, we're done
            console.log('[AGUI] No tool calls, finishing');
            break;
        }

        console.log(`🔍 [AGUI] Stream complete. Executing ${toolCallsInProgress.size} tool calls`);

        // Build assistant message with tool calls
        const assistantMessage: any = {
            role: 'assistant',
            content: assistantContent,
            tool_calls: []
        };

        // Track tool results
        const toolResults: Array<{
            callId: string;
            result: any;
        }> = [];

        // Execute all tool calls
        for (const [index, toolCall] of toolCallsInProgress) {
            if (!toolCall.id || !toolCall.name) {
                console.warn(`⚠️ [AGUI] Incomplete tool call at index ${index}:`, toolCall);
                continue;
            }

            let parsedArgs: any = {};
            try {
                parsedArgs = JSON.parse(toolCall.arguments || '{}');
                console.log('✅ [AGUI] Parsed tool arguments:', {
                    toolName: toolCall.name,
                    parsedArgs
                });
            } catch (parseErr) {
                console.error('❌ [AGUI] Failed to parse tool arguments:', {
                    toolName: toolCall.name,
                    arguments: toolCall.arguments,
                    error: parseErr
                });
                toolResults.push({
                    callId: toolCall.id,
                    result: { error: 'Invalid tool arguments' }
                });

                // Emit error result
                sendEvent(controller, encoder, {
                    type: 'TOOL_CALL_RESULT',
                    toolName: toolCall.name,
                    result: { error: 'Invalid tool arguments' },
                    callId: toolCall.id,
                    success: false
                });
                continue;
            }

            // Emit TOOL_CALL_START
            sendEvent(controller, encoder, {
                type: 'TOOL_CALL_START',
                toolName: toolCall.name,
                args: parsedArgs,
                callId: toolCall.id
            });

            // Add to assistant message
            assistantMessage.tool_calls.push({
                id: toolCall.id,
                type: 'function',
                function: {
                    name: toolCall.name,
                    arguments: toolCall.arguments
                }
            });

            // Execute tool
            try {
                let result: any;

                if (toolCall.name === 'get_quiz_attempt_history') {
                    result = await callQuizHistory(parsedArgs);
                } else if (toolCall.name === 'get_quiz_attempt_detail') {
                    result = await callQuizAttemptDetailWithPrompt(parsedArgs, userPrompt);
                } else if (toolCall.name === 'get_quiz_attempt_by_type') {
                    result = await callQuizAttemptDetailByType(parsedArgs, userPrompt);
                } else if (toolCall.name === 'get_writing_data') {
                    // Get writing data only, let AI do the evaluation
                    console.log('🔍 [AGUI] Getting writing data for AI evaluation, attemptId:', parsedArgs.attemptId);
                    
                    try {
                        // Call get_quiz_attempt_by_type to get writing-specific data
                        const attemptDetailResult = await callQuizAttemptDetailByType({ 
                            attemptId: parsedArgs.attemptId, 
                            type: 'WRITING' 
                        }, userPrompt);
                        
                        if (attemptDetailResult && attemptDetailResult.data) {
                            const attemptData = attemptDetailResult.data;
                            console.log('🔍 [AGUI] Writing attempt data structure:', {
                                hasQuizSections: !!attemptData.quizSections,
                                quizSectionsLength: attemptData.quizSections?.length || 0,
                                attemptId: attemptData.attemptId
                            });
                            
                            const writingSections = attemptData.quizSections?.filter((section: any) => 
                                section.sectionType?.toLowerCase() === 'writing' || section.type?.toLowerCase() === 'writing'
                            ) || [];
                            
                            console.log('🔍 [AGUI] Writing sections found:', writingSections.length);
                            
                            if (writingSections.length > 0) {
                                // Extract writing tasks for AI to evaluate
                                const writingTasks: Array<{
                                    taskNumber: number;
                                    questionText: string;
                                    userAnswer: string;
                                }> = [];
                                for (let i = 0; i < writingSections.length; i++) {
                                    const section = writingSections[i];
                                    if (section.questions && section.questions.length > 0) {
                                        section.questions.forEach((question: any, questionIndex: number) => {
                                            if (question.userAnswer && question.userAnswer.trim()) {
                                                // Extract task number from question text if available
                                                let taskNumber = writingTasks.length + 1;
                                                if (question.text) {
                                                    const taskMatch = question.text.match(/Task (\d+):/i);
                                                    if (taskMatch) {
                                                        taskNumber = parseInt(taskMatch[1]);
                                                    }
                                                }
                                                
                                                writingTasks.push({
                                                    taskNumber,
                                                    questionText: question.text || question.questionText || '',
                                                    userAnswer: question.userAnswer
                                                });
                                            }
                                        });
                                    }
                                }
                                
                                // Return writing data for AI to evaluate
                                result = {
                                    attemptId: parsedArgs.attemptId,
                                    writingTasks,
                                    message: `Đã lấy dữ liệu writing từ attempt ${parsedArgs.attemptId}. AI sẽ chữa bài theo tiêu chí VSTEP.`
                                };
                            } else {
                                throw new Error('No writing sections found in attempt data');
                            }
                        } else {
                            throw new Error('Failed to get attempt detail data');
                        }
                    } catch (error) {
                        console.error('🔍 [AGUI] Error getting writing data:', error);
                        throw new Error('Failed to get writing data for evaluation');
                    }
                } else if (toolCall.name === 'get_speaking_data') {
                    // Get speaking data only, let AI do the evaluation
                    console.log('🔍 [AGUI] Getting speaking data for AI evaluation, attemptId:', parsedArgs.attemptId);

                    try {
                        // Call get_quiz_attempt_by_type to get speaking-specific data
                        const attemptDetailResult = await callQuizAttemptDetailByType({
                            attemptId: parsedArgs.attemptId,
                            type: 'SPEAKING'
                        }, userPrompt);

                        if (attemptDetailResult && attemptDetailResult.data) {
                            const attemptData = attemptDetailResult.data;
                            console.log('🔍 [AGUI] Speaking attempt data structure:', {
                                hasQuizSections: !!attemptData.quizSections,
                                quizSectionsLength: attemptData.quizSections?.length || 0,
                                attemptId: attemptData.attemptId
                            });

                            const speakingSections = attemptData.quizSections?.filter((section: any) =>
                                section.sectionType?.toLowerCase() === 'speaking' || section.type?.toLowerCase() === 'speaking'
                            ) || [];

                            console.log('🔍 [AGUI] Speaking sections found:', speakingSections.length);

                            if (speakingSections.length > 0) {
                                // Extract speaking tasks for AI to evaluate
                                const speakingTasks: Array<{
                                    taskNumber: number;
                                    questionText: string;
                                    userAnswer?: string;
                                    transcript?: string;
                                    medias?: any[];
                                    questionMedias?: any[];
                                    questionAudioUrl?: string;
                                }> = [];
                                for (let i = 0; i < speakingSections.length; i++) {
                                    const section = speakingSections[i];
                                    if (section.questions && section.questions.length > 0) {
                                        section.questions.forEach((question: any) => {
                                            let taskNumber = speakingTasks.length + 1;
                                            if (question.text) {
                                                const taskMatch = question.text.match(/Part\s*(\d+)/i) || question.text.match(/Task\s*(\d+)/i);
                                                if (taskMatch) {
                                                    const parsed = parseInt(taskMatch[1]);
                                                    if (!Number.isNaN(parsed)) taskNumber = parsed;
                                                }
                                            }
                                            // Normalize transcript and guard against hallucination
                                            const rawTranscript = (question.transcription || question.transcript);
                                            const normalizedTranscript = typeof rawTranscript === 'string' ? rawTranscript.trim() : '';
                                            const hasTranscript = normalizedTranscript.length > 0;

                                            // Debug log per speaking question
                                            try {
                                                console.log('[AGUI][Speaking] Question debug:', {
                                                    questionId: question.questionId,
                                                    taskNumber,
                                                    hasUserAnswer: !!question.userAnswer,
                                                    transcriptionLength: normalizedTranscript.length,
                                                    transcriptionPreview: normalizedTranscript ? normalizedTranscript.slice(0, 120) : null,
                                                    mediasCount: Array.isArray(question.medias) ? question.medias.length : 0,
                                                });
                                            } catch (e) {
                                                console.warn('[AGUI][Speaking] Failed to log question debug:', e);
                                            }

                                            speakingTasks.push({
                                                taskNumber,
                                                questionText: question.text || question.questionText || '',
                                                // IMPORTANT: remove userAnswer for tasks without transcript to prevent the model from inferring from audio URL
                                                userAnswer: hasTranscript ? question.userAnswer : undefined,
                                                // Use normalized transcript (trimmed)
                                                transcript: normalizedTranscript,
                                                // Pass through question medias so UI can render question audio(s)
                                                medias: Array.isArray(question.medias)
                                                    ? question.medias
                                                    : (Array.isArray(question.questionMedias) ? question.questionMedias : undefined),
                                            });
                                        });
                                    }
                                }

                                // Summary debug for built speaking tasks
                                try {
                                    const withTranscript = speakingTasks.filter(t => typeof t.transcript === 'string' && t.transcript.trim().length > 0).length;
                                    console.log('[AGUI][Speaking] Built speakingTasks summary:', {
                                        totalTasks: speakingTasks.length,
                                        withTranscript,
                                        withoutTranscript: speakingTasks.length - withTranscript,
                                    });
                                } catch (e) {
                                    console.warn('[AGUI][Speaking] Failed to log speakingTasks summary:', e);
                                }

                                // Return speaking data only; OpenAI will evaluate based on transcription (like writing)
                                result = {
                                    attemptId: parsedArgs.attemptId,
                                    speakingTasks,
                                    message: `Đã lấy dữ liệu speaking từ attempt ${parsedArgs.attemptId}. AI sẽ chấm bài dựa trên transcription theo tiêu chí VSTEP.`
                                };
                            } else {
                                throw new Error('No speaking sections found in attempt data');
                            }
                        } else {
                            throw new Error('Failed to get attempt detail data');
                        }
                    } catch (error) {
                        console.error('🔍 [AGUI] Error getting speaking data:', error);
                        throw new Error('Failed to get speaking data for evaluation');
                    }
                } else {
                    result = { error: `Unknown tool: ${toolCall.name}` };
                }

                // Store result
                toolResults.push({
                    callId: toolCall.id,
                    result: result
                });

                // Emit TOOL_CALL_RESULT
                sendEvent(controller, encoder, {
                    type: 'TOOL_CALL_RESULT',
                    toolName: toolCall.name,
                    result,
                    callId: toolCall.id,
                    success: !result.error
                });

            } catch (toolErr: any) {
                console.error('❌ [AGUI] Tool execution failed:', {
                    toolName: toolCall.name,
                    error: toolErr.message
                });

                // Store error result
                toolResults.push({
                    callId: toolCall.id,
                    result: { error: toolErr.message }
                });

                sendEvent(controller, encoder, {
                    type: 'TOOL_CALL_RESULT',
                    toolName: toolCall.name,
                    result: { error: toolErr.message },
                    callId: toolCall.id,
                    success: false
                });
            }
        }

        messages.push(assistantMessage);

        for (const toolResult of toolResults) {
            messages.push({
                role: 'tool',
                tool_call_id: toolResult.callId,
                content: JSON.stringify(toolResult.result)
            });
        }

        // If speaking data fetched, add strict system instruction to only use transcription
        const hasSpeakingData = assistantMessage.tool_calls.some((tc: any) => tc.function.name === 'get_speaking_data');
        if (hasSpeakingData) {
            // First, add extraction message to summarize the speaking data
            const speakingDataResult = toolResults.find(tr => 
                assistantMessage.tool_calls.some((tc: any) => tc.id === tr.callId && tc.function.name === 'get_speaking_data')
            );
            
            if (speakingDataResult && speakingDataResult.result && speakingDataResult.result.speakingTasks) {
                const speakingTasks = speakingDataResult.result.speakingTasks;
                const attemptId = speakingDataResult.result.attemptId;
                let extractionContent = "EXTRACT ĐỀ BÀI - CÂU HỎI - CÂU TRẢ LỜI:\n\n";
                
                extractionContent += `Attempt ID: ${attemptId}\n\n`;
                
                speakingTasks.forEach((task: any, index: number) => {
                    const partNumber = task.taskNumber || (index + 1);
                    const questionText = stripHtml(task.questionText || '');
                    const transcript = task.transcript || '';
                    
                    extractionContent += `Part ${partNumber}:\n`;
                    extractionContent += `Question: ${questionText}\n`;
                    extractionContent += `Answer: ${transcript}\n\n`;
                });
                
                messages.push({
                    role: 'system',
                    content: extractionContent
                });
            }
            
            // Then add the evaluation instruction
            messages.push({
                role: 'system',
                content: `CHỈ CHẤM SPEAKING DỰA TRÊN TRANSCRIPTION.
YÊU CẦU CHUNG:
- Có 3 task (Part 1, Part 2, Part 3). Mỗi task phải có điểm riêng.
- Công thức tổng điểm Speaking = (Điểm Task 1 + Điểm Task 2 + Điểm Task 3) / 3.
 - Nếu task KHÔNG có transcript: ghi rõ "Không có transcript, điểm task = 0" và đưa task đó vào phép tính trung bình như 0 điểm. KHÔNG ĐƯỢC CHẤM > 0 CHO TASK THIẾU TRANSCRIPT.
 - BẮT BUỘC hiển thị phép tính tổng điểm ở cuối theo dạng: Tổng điểm = (T1 + T2 + T3) / 3 = X/10. Tổng điểm phải BẰNG đúng kết quả phép tính, không được khác.
 - Ví dụ kiểm tra: nếu chỉ Task 1 có transcript và được 3/10, Task 2 và Task 3 không có transcript (điểm 0), thì Tổng điểm = (3 + 0 + 0) / 3 = 1.0/10.
- Transcript quá ngắn (< 15 từ): ghi chú "Transcript quá ngắn, điểm chỉ tham khảo".
- KHÔNG suy diễn từ audio URL, CHỈ sử dụng transcript để chấm.

QUY TẮC BÁM SÁT ĐỀ:
- Mỗi Task PHẢI đối chiếu với phần Question đã EXTRACT ở trên. Nếu transcript không trả lời đúng/đủ câu hỏi: ghi rõ "Lạc đề/thiếu ý" và nêu mục bị thiếu.

LƯU Ý QUAN TRỌNG:
- KHÔNG sử dụng bất kỳ template/định dạng nào của Writing. KHÔNG in các phần như "ĐỊNH DẠNG PHẢN HỒI CHỮA BÀI WRITING", "🔧 Lỗi ngữ pháp", hay bố cục tương tự Writing.
- Trình bày NGẮN GỌN, không dùng emoji, không tiêu đề dài.

TIÊU CHÍ CHẤM (mỗi task):
1) Ngữ pháp (Grammar)
   - Chính xác: Dùng đúng thì và cấu trúc ngữ pháp.
   - Đa dạng cấu trúc: Kết hợp linh hoạt câu đơn/ghép/phức.
2) Từ vựng (Vocabulary)
   - Phù hợp ngữ cảnh: Từ vựng sát chủ đề, đúng ngữ cảnh.
   - Đa dạng: Từ đồng nghĩa, cụm từ phong phú.
3) Phát triển ý (Fluency and Coherence)
   - Mạch lạc: Phát triển ý rõ ràng, có cấu trúc; dùng từ nối liên kết.
4) Nội dung và Liên kết ý (Content and Coherence)
   - Phù hợp với đề: Bám sát câu hỏi, không lạc đề.
   - Liên kết ý: Dùng từ/cụm từ liên kết để nối ý mạch lạc.

ĐỊNH DẠNG KẾT QUẢ (ngắn gọn, KHÔNG dùng emoji):
- Task 1: Điểm x/10. Nhận xét 4 tiêu chí. Nếu không có transcript: ghi rõ và điểm = 0.
- Task 2: (chỉ in nếu có transcript) Điểm x/10. Nhận xét 4 tiêu chí.
- Task 3: (chỉ in nếu có transcript) Điểm x/10. Nhận xét 4 tiêu chí.
- Dựa trên đề bài: Nêu rõ các gạch đầu dòng/câu hỏi trong đề (questionText) đã được đề cập hay bỏ sót gì trong transcript (ví dụ: "đã trả lời câu về 'birthday activities', bỏ sót câu 'public transportation'").
- Trích dẫn transcript: Với mỗi nhận xét quan trọng, trích 1-2 cụm từ ngắn từ transcript trong dấu "..." để chứng minh (không bịa, không suy diễn).
- Tổng điểm: In rõ phép tính theo dạng "Tổng điểm = (T1 + T2 + T3) / 3 = X/10". Kèm 2-3 gợi ý thực hành cụ thể gắn với nội dung đề (ví dụ: nếu đề hỏi phương tiện công cộng, gợi ý từ nối/ý tưởng liên quan chủ đề đó).`
            });
        }

        // Check if we have writing data or speaking data tool call - if so, continue to let AI analyze
        const hasWritingData = assistantMessage.tool_calls.some((tc: any) => tc.function.name === 'get_writing_data');

        // If writing data fetched, add concise writing instruction dynamically
        if (hasWritingData) {
            messages.push({
                role: 'system',
                content: `CHỈ CHẤM WRITING DỰA TRÊN BÀI LÀM.
YÊU CẦU CHUNG:
- Có 2 task. Task 1 (thư/email) và Task 2 (bài luận).
- Công thức tổng điểm Writing = (Task 1 + 2*Task 2) / 3. Làm tròn đến 0.5.
- Trình bày ngắn gọn, KHÔNG dùng emoji, không template dài.

TIÊU CHÍ CHẤM (mỗi task):
1) Nội dung (Content): Bám sát yêu cầu, đủ ý.
2) Tổ chức (Organization): Mạch lạc, liên kết ý.
3) Ngôn ngữ (Language): Từ vựng và ngữ pháp chính xác, đa dạng.
4) Độ dài (Length): Đủ số từ theo yêu cầu.

ĐỊNH DẠNG KẾT QUẢ (ngắn gọn):
- Task 1: Điểm x/10. Nhận xét 4 tiêu chí (mỗi tiêu chí 1-2 câu).
- Task 2: Điểm x/10. Nhận xét 4 tiêu chí.
- Tổng điểm: In phép tính "(T1 + 2*T2)/3 = X/10". Kèm 2-3 gợi ý cải thiện cụ thể.`
            });
        }

        if (hasWritingData || hasSpeakingData) {
            if (hasSpeakingData) {
                console.log('[AGUI] Speaking data tool completed. Continuing to let AI evaluate speaking...');
            } else {
                console.log('[AGUI] Writing data tool completed. Continuing to let AI evaluate writing...');
            }
            // Don't break - let AI continue with the context and evaluate
        } else {
            // IMPORTANT: Stop here instead of continuing for other tools
            // Tool results are already in hidden messages on frontend
            // No need for OpenAI to generate summary text
            console.log('[AGUI] Tool execution complete. Stopping to avoid duplicate content.');

            // Send state delta to signal we're suppressing text
            sendEvent(controller, encoder, {
                type: 'STATE_DELTA',
                state: { suppressAssistantText: true }
            });

            break; // Exit loop instead of continuing
        }
    }

    if (iteration >= maxIterations) {
        console.warn('[AGUI] Reached max iterations limit');
    }
}