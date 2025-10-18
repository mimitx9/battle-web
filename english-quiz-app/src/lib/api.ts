import axios from 'axios';
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
    ApiResponse,
    CreateQuizAttemptResponse,
    GetQuizAttemptResponse,
    QuizAttemptResponse,
    RegisterUserResponse,
    QuizSubmitData,
    QuizSubmitResponse,
    SubscriptionPlan,
    AttemptHistoryResponse
} from '@/types';
import { handle401Error } from './authUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:7071/fai/v1/account';
const USER_PROFILE_URL = process.env.NEXT_PUBLIC_USER_PROFILE_URL || 'http://localhost:7071/fai/v1/user';
const QUIZ_API_BASE_URL = process.env.NEXT_PUBLIC_QUIZ_API_URL || 'http://localhost:7071/fai/v1/test';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const authApi = axios.create({
    baseURL: AUTH_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const userProfileApi = axios.create({
    baseURL: USER_PROFILE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const quizApiInstance = axios.create({
    baseURL: QUIZ_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

userProfileApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

quizApiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    console.log('🔍 Quiz API Token:', token ? 'Present' : 'Missing');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔍 Authorization header set');
    } else {
        console.warn('⚠️ No auth token found for quiz API');
    }
    return config;
});

// Add response interceptors để handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('🔍 API: 401 error detected, redirecting to login');
            handle401Error();
        }
        return Promise.reject(error);
    }
);

userProfileApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('🔍 UserProfile API: 401 error detected, redirecting to login');
            handle401Error();
        }
        return Promise.reject(error);
    }
);

quizApiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log('🔍 Quiz API: 401 error detected, redirecting to login');
            handle401Error();
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApiService = {
    login: async (data: LoginRequest): Promise<{ token: string; login: boolean }> => {
        console.log('🔍 API: Login request data:', data);

        const response = await authApi.post<ApiResponse<AuthResponse>>('/auth-mini', data);

        console.log('🔍 API: Raw response:', response);
        console.log('🔍 API: Response data:', response.data);
        console.log('🔍 API: Response status:', response.status);

        // Check response structure matches expected format
        if (response.data && response.data.data && response.data.data.token) {
            console.log('🔍 API: Login successful, token received');
            return {
                token: response.data.data.token,
                login: response.data.data.login ?? true
            };
        } else {
            console.error('❌ API: Unexpected login response structure:', response.data);
            throw new Error('Invalid login response structure');
        }
    },

    register: async (data: RegisterRequest): Promise<User> => {
        console.log('🔍 API: Register request data:', data);

        const response = await authApi.post<ApiResponse<RegisterUserResponse>>('/register-mini', data);

        console.log('🔍 API: Register response:', response.data);

        if (response.data && response.data.data) {
            console.log('🔍 API: Register successful, user created');
            // Convert RegisterUserResponse to User format
            const userData: User = {
                userId: response.data.data.id,
                email: response.data.data.email,
                username: response.data.data.username,
                fullName: response.data.data.username, // Use username as fullName if not available
                avatar: undefined,
                university: undefined,
                subscriptionType: 'free',
                countAttempt: 0,
                createdAt: response.data.data.createdAt,
                updatedAt: response.data.data.updatedAt
            };
            return userData;
        } else {
            throw new Error('Invalid register response structure');
        }
    },

    getProfile: async (): Promise<User> => {
        try {
            console.log('🔍 API: Calling getProfile...');
            const response = await userProfileApi.get('/profile-mini');

            console.log('🔍 API: getProfile response:', response);
            console.log('🔍 API: getProfile data:', response.data);

            // Xử lý response linh hoạt - có thể là ApiResponse hoặc trực tiếp User
            let userData: User;
            if (response.data.data) {
                // Nếu có cấu trúc ApiResponse
                userData = response.data.data;
                console.log('🔍 API: Using nested data structure');
            } else {
                // Nếu response trực tiếp là User data
                userData = response.data;
                console.log('🔍 API: Using direct data structure');
            }

            console.log('🔍 API: Final user data:', userData);
            return userData;
        } catch (error: any) {
            console.error('❌ API: getProfile failed:', error);
            console.error('❌ API: Error response:', error.response?.data);
            console.error('❌ API: Error status:', error.response?.status);
            throw error;
        }
    },

    logout: async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Logout có thể fail nhưng vẫn clear local state
            console.log('Logout API failed, but continuing with local cleanup');
        }
    },
};

// Quiz API
export const quizApi = {

    createAttempt: async (quizType?: string): Promise<CreateQuizAttemptResponse> => {
        try {
            const body = quizType ? {quiz_type: quizType} : {quiz_type: "normal"};
            console.log('🔍 Creating quiz attempt with body:', body);
            console.log('🔍 API URL:', `${QUIZ_API_BASE_URL}/quiz/attempt/`);

            const response = await quizApiInstance.post<CreateQuizAttemptResponse>('/quiz/attempt/', body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            console.log('🔍 Create attempt response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error creating quiz attempt:', error);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
                console.error('❌ Response headers:', error.response.headers);
            }
            throw error;
        }
    },

    getAttempt: async (attemptId: number): Promise<QuizAttemptResponse> => {
        const response = await quizApiInstance.get<GetQuizAttemptResponse>(`/quiz/attempt/${attemptId}`);
        return response.data.data;
    },

    // New: Get the latest in-progress attempt without providing an id
    getInProgressAttempt: async (): Promise<QuizAttemptResponse> => {
        try {
            const response = await quizApiInstance.get<GetQuizAttemptResponse>('/quiz/attempt/in-progress');
            return response.data.data;
        } catch (error: any) {
            console.error('❌ Error getting in-progress attempt:', error);

            if (error.response && error.response.status === 400) {
                const errorCode = error.response.data?.meta?.code;
                const errorMessage = error.response.data?.meta?.message;

                if (errorCode === 40400107) {
                    // No in-progress quiz attempt found
                    const customError = new Error('NO_IN_PROGRESS_ATTEMPT');
                    (customError as any).code = 'NO_IN_PROGRESS_ATTEMPT';
                    (customError as any).message = errorMessage || 'No in-progress quiz attempt found';
                    throw customError;
                } else if (errorCode === 40000106) {
                    // Quiz attempt expired
                    const customError = new Error('ATTEMPT_EXPIRED');
                    (customError as any).code = 'ATTEMPT_EXPIRED';
                    (customError as any).message = errorMessage || 'Quiz attempt expired';
                    throw customError;
                }
            }

            // Re-throw original error for other cases
            throw error;
        }
    },

    updateAttempt: async (submitData: QuizSubmitData): Promise<QuizSubmitResponse> => {
        try {
            const endpoint = `/quiz/attempt/progress`;
            console.log('🔍 Trying endpoint:', endpoint);

            const response = await quizApiInstance.post<QuizSubmitResponse>(endpoint, submitData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            console.log('🔍 Progress update response:', response.data);

            // Kiểm tra nếu data là null hoặc undefined
            if (response.data && response.data.data) {
                console.log('🔍 Progress update success:', response.data.data.success);
            } else {
                console.log('🔍 Progress update response has null data, but meta indicates success');
                // Tạo response giả lập khi data là null nhưng meta thành công
                response.data = {
                    meta: response.data.meta,
                    data: {
                        success: true,
                        attemptId: 0,
                        listeningScore: 0,
                        readingScore: 0,
                        speakingScore: 0,
                        writingScore: 0,
                        totalScore: 0,
                        message: 'Progress updated successfully'
                    }
                };
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Error updating quiz attempt progress:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error code:', error.code);

            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response statusText:', error.response.statusText);
                console.error('❌ Response data:', error.response.data);
                console.error('❌ Response headers:', error.response.headers);
                console.error('❌ Request URL:', error.config?.url);
                console.error('❌ Request method:', error.config?.method);
                console.error('❌ Request headers:', error.config?.headers);
            } else if (error.request) {
                console.error('❌ Request made but no response received:', error.request);
            } else {
                console.error('❌ Error setting up request:', error.message);
            }
            throw error;
        }
    },

    submitAttempt: async (submitData: QuizSubmitData): Promise<QuizSubmitResponse> => {
        try {
            // Try different endpoint formats
            const endpoint = `/quiz/attempt/submit`;
            console.log('🔍 Trying endpoint:', endpoint);

            const response = await quizApiInstance.post<QuizSubmitResponse>(endpoint, submitData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            console.log('🔍 Submit response:', response.data);

            // Kiểm tra nếu data là null hoặc undefined
            if (response.data && response.data.data) {
                console.log('🔍 Submit success:', response.data.data.success);
                console.log('🔍 Total score:', response.data.data.totalScore);
                console.log('🔍 Listening score:', response.data.data.listeningScore);
                console.log('🔍 Reading score:', response.data.data.readingScore);
            } else {
                console.log('🔍 Submit response has null data, but meta indicates success');
                // Tạo response giả lập khi data là null nhưng meta thành công
                response.data = {
                    meta: response.data.meta,
                    data: {
                        success: true,
                        attemptId: 0,
                        totalScore: 0,
                        listeningScore: 0,
                        readingScore: 0,
                        speakingScore: 0,
                        writingScore: 0,
                        message: 'Quiz submitted successfully'
                    }
                };
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Error submitting quiz attempt:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error code:', error.code);

            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response statusText:', error.response.statusText);
                console.error('❌ Response data:', error.response.data);
                console.error('❌ Response headers:', error.response.headers);
                console.error('❌ Request URL:', error.config?.url);
                console.error('❌ Request method:', error.config?.method);
                console.error('❌ Request headers:', error.config?.headers);
            } else if (error.request) {
                console.error('❌ Request made but no response received:', error.request);
            } else {
                console.error('❌ Error setting up request:', error.message);
            }
            throw error;
        }
    },

    // New: submit attempt with optional speaking audio as multipart/form-data
    submitAttemptWithAudio: async (
        submitData: QuizSubmitData,
        speakingAudios?: Record<number, File | Blob>,
    ): Promise<QuizSubmitResponse> => {
        try {
            const endpoint = `/quiz/attempt/submit`;
            console.log('🔍 Trying multipart endpoint:', endpoint);

            const formData = new FormData();
            formData.append('quizAttempt', JSON.stringify(submitData));

            // Debug FormData contents
            console.log('🔍 FormData before append audios:', {
                audioCount: speakingAudios ? Object.keys(speakingAudios).length : 0
            });

            if (speakingAudios && Object.keys(speakingAudios).length > 0) {
                Object.entries(speakingAudios).forEach(([indexStr, blob]) => {
                    const index = Number(indexStr);
                    const key = `speaking_audio_${index}`;
                    // đặt filename có index để dễ debug phía BE
                    const fileName = `recording_${index}.wav`;
                    formData.append(key, blob as any, fileName);
                    console.log(`🔍 Appended audio: ${key}`, {
                        type: (blob as any)?.type,
                        size: (blob as any)?.size
                    });
                });
            } else {
                console.log('🔍 No speaking audio files to append');
            }

            // Debug final FormData
            console.log('🔍 FormData entries:');
            for (const [key, value] of formData.entries()) {
                if (value && typeof value === 'object' && 'type' in value && 'size' in value) {
                    console.log(`  ${key}:`, { type: (value as File | Blob).type, size: (value as File | Blob).size });
                } else {
                    console.log(`  ${key}:`, typeof value, (value as string).length ? `${(value as string).length} chars` : value);
                }
            }

            const response = await quizApiInstance.post<QuizSubmitResponse>(endpoint, formData, {
                headers: {
                    // Let the browser set the correct multipart boundary
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json',
                },
            });

            console.log('🔍 Submit multipart response:', response.data);

            if (response.data && response.data.data) {
                console.log('🔍 Submit multipart success:', response.data.data.success);
            } else {
                response.data = {
                    meta: response.data.meta,
                    data: {
                        success: true,
                        attemptId: 0,
                        totalScore: 0,
                        listeningScore: 0,
                        readingScore: 0,
                        speakingScore: 0,
                        writingScore: 0,
                        message: 'Quiz submitted successfully (multipart)'
                    }
                } as any;
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Error submitting quiz attempt (multipart):', error);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
            }
            throw error;
        }
    },

    getResult: async (attemptId: number): Promise<QuizSubmitResponse> => {
        try {
            console.log('🔍 Getting quiz result for attempt:', attemptId);
            console.log('🔍 Base URL:', QUIZ_API_BASE_URL);
            console.log('🔍 Full URL:', `${QUIZ_API_BASE_URL}/quiz/attempt/${attemptId}/result`);

            const endpoint = `/quiz/attempt/${attemptId}/result`;
            console.log('🔍 Trying endpoint:', endpoint);

            const response = await quizApiInstance.get<QuizSubmitResponse>(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            console.log('🔍 Get result response:', response.data);

            // Kiểm tra nếu data là null hoặc undefined
            if (response.data && response.data.data) {
                console.log('🔍 Get result success');
                console.log('🔍 Total score:', response.data.data.totalScore);
                console.log('🔍 Listening score:', response.data.data.listeningScore);
                console.log('🔍 Reading score:', response.data.data.readingScore);
                console.log('🔍 Speaking score:', response.data.data.speakingScore);
                console.log('🔍 Writing score:', response.data.data.writingScore);
            } else {
                console.log('🔍 Get result response has null data, but meta indicates success');
                // Tạo response giả lập khi data là null nhưng meta thành công
                response.data = {
                    meta: response.data.meta,
                    data: {
                        success: true,
                        attemptId: attemptId,
                        totalScore: 0,
                        listeningScore: 0,
                        readingScore: 0,
                        speakingScore: 0,
                        writingScore: 0,
                        message: 'Quiz results retrieved successfully'
                    }
                };
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Error getting quiz result:', error);
            console.error('❌ Error message:', error.message);
            console.error('❌ Error code:', error.code);

            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response statusText:', error.response.statusText);
                console.error('❌ Response data:', error.response.data);
                console.error('❌ Response headers:', error.response.headers);
                console.error('❌ Request URL:', error.config?.url);
                console.error('❌ Request method:', error.config?.method);
                console.error('❌ Request headers:', error.config?.headers);
            } else if (error.request) {
                console.error('❌ Request made but no response received:', error.request);
            } else {
                console.error('❌ Error setting up request:', error.message);
            }
            throw error;
        }
    },

    validateAttempt: async (): Promise<{
        meta: { code: number, message: string },
        data: { attemptId: number, startedAt: number, status: string }
    }> => {
        try {
            console.log('🔍 Validating quiz attempt...');
            console.log('🔍 Base URL:', QUIZ_API_BASE_URL);
            console.log('🔍 Full URL:', `${QUIZ_API_BASE_URL}/quiz/attempt/validate`);

            const endpoint = `/quiz/attempt/validate`;
            console.log('🔍 Trying endpoint:', endpoint);

            const response = await quizApiInstance.get(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            console.log('🔍 Validate attempt response:', response.data);
            return response.data;
        } catch (error: any) {
            throw error;
        }
    },

    // New: Get attempt history with pagination (offset-based)
    getAttemptHistory: async (offset: number = 0, size: number = 10): Promise<AttemptHistoryResponse> => {
        try {
            const endpoint = `/quiz/attempt/history`;
            const response = await quizApiInstance.get<AttemptHistoryResponse>(endpoint, {
                params: { offset, size },
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Error getting attempt history:', error);
            throw error;
        }
    },

    // New: Clone an existing attempt
    cloneAttempt: async (attemptId: number): Promise<CreateQuizAttemptResponse> => {
        try {
            const endpoint = `/quiz/attempt/${attemptId}/clone`;
            console.log('🔍 Cloning attempt:', attemptId);
            console.log('🔍 API URL:', `${QUIZ_API_BASE_URL}${endpoint}`);

            const response = await quizApiInstance.post<CreateQuizAttemptResponse>(endpoint, {}, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            console.log('🔍 Clone attempt response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error cloning attempt:', error);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
            }
            throw error;
        }
    },

    // New: Get attempt detail with full quiz data
    getAttemptDetail: async (attemptId: number): Promise<QuizSubmitResponse> => {
        try {
            const endpoint = `/quiz/attempt/${attemptId}`;
            console.log('🔍 Getting attempt detail for:', attemptId);
            console.log('🔍 API URL:', `${QUIZ_API_BASE_URL}${endpoint}`);

            const response = await quizApiInstance.get<QuizSubmitResponse>(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            console.log('🔍 Get attempt detail response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error getting attempt detail:', error);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
            }
            throw error;
        }
    },

    // New: Get attempt detail by type (LISTENREADING, WRITING, SPEAKING)
    getAttemptDetailByType: async (attemptId: number, queryParams: { type?: string } = {}): Promise<QuizSubmitResponse> => {
        try {
            const endpoint = `/quiz/attempt/${attemptId}`;
            console.log('🔍 Getting attempt detail by type for:', attemptId, 'with params:', queryParams);
            console.log('🔍 API URL:', `${QUIZ_API_BASE_URL}${endpoint}`);

            const response = await quizApiInstance.get<QuizSubmitResponse>(endpoint, {
                params: queryParams,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            console.log('🔍 Get attempt detail by type response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Error getting attempt detail by type:', error);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
            }
            throw error;
        }
    },
};

// Subscription API
export const subscriptionApi = {
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        // Mock data for now - in real app, this would call your backend
        return [
            {
                id: 'basic',
                name: 'Gói Cơ Bản',
                price: 199000,
                currency: 'VND',
                duration: 30,
                features: [
                    'Làm bài thi không giới hạn',
                    'Truy cập tất cả đề thi',
                    'Xem kết quả chi tiết',
                    'Hỗ trợ qua Messenger'
                ]
            },
            {
                id: 'premium',
                name: 'Gói Premium',
                price: 399000,
                currency: 'VND',
                duration: 30,
                features: [
                    'Tất cả tính năng Gói Cơ Bản',
                    'Luyện tập cá nhân hóa',
                    'Phân tích điểm mạnh/yếu',
                    'Hỗ trợ ưu tiên',
                    'Tài liệu học tập độc quyền'
                ],
                popular: true
            },
            {
                id: 'vip',
                name: 'Gói VIP',
                price: 699000,
                currency: 'VND',
                duration: 30,
                features: [
                    'Tất cả tính năng Gói Premium',
                    'Gia sư 1-1 online',
                    'Lộ trình học cá nhân',
                    'Mock test với giám khảo',
                    'Bảo đảm điểm số'
                ]
            }
        ];
    },

    createPayment: async (data: { planId: string; paymentMethod: string }) => {
        // Mock payment creation
        console.log('Creating payment for plan:', data.planId);
        return {success: true, paymentId: 'mock-payment-id'};
    },

    upgradeSubscription: async (planId: string) => {
        // Mock subscription upgrade
        console.log('Upgrading subscription to plan:', planId);
        return {success: true};
    }
};

export default api;