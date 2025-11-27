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
    AttemptHistoryResponse,
    QuizRoom,
    QuestionsByCategoryRequest,
    QuestionsByCategoryResponse,
    UserBagResponse,
    GlobalRank
} from '../types';
import { handle401Error } from './authUtils';

// Base URL configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.facourse.com/fai' 
  : 'http://localhost:7071/fai';

const API_BASE_URL = `${BASE_URL}/api`;
const AUTH_API_BASE_URL = `${BASE_URL}/v1/account`;
const USER_PROFILE_URL = `${BASE_URL}/v1/user`;
const QUIZ_API_BASE_URL = `${BASE_URL}/v1/test`;
const QUIZ_BATTLE_API_BASE_URL = `${BASE_URL}/v1/quiz-battle`;
const MASTER_API_BASE_URL = `${BASE_URL}/v1/master`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'site': 'BATTLE',
    },
});

const authApi = axios.create({
    baseURL: AUTH_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'site': 'BATTLE',
    },
});

const userProfileApi = axios.create({
    baseURL: USER_PROFILE_URL,
    headers: {
        'Content-Type': 'application/json',
        'site': 'BATTLE',
    },
});

const quizApiInstance = axios.create({
    baseURL: QUIZ_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'site': 'BATTLE',
    },
});

const quizBattleApiInstance = axios.create({
    baseURL: QUIZ_BATTLE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'site': 'BATTLE',
    },
});

const masterApiInstance = axios.create({
    baseURL: MASTER_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'site': 'BATTLE',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure site header is always set
    config.headers.site = 'BATTLE';
    return config;
});

userProfileApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure site header is always set
    config.headers.site = 'BATTLE';
    return config;
});

quizApiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure site header is always set
    config.headers.site = 'BATTLE';
    return config;
});

quizBattleApiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure site header is always set
    config.headers.site = 'BATTLE';
    return config;
});

masterApiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.site = 'BATTLE';
    return config;
});

// Add response interceptors để handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            handle401Error();
        }
        return Promise.reject(error);
    }
);

userProfileApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            handle401Error();
        }
        return Promise.reject(error);
    }
);

quizApiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            handle401Error();
        }
        return Promise.reject(error);
    }
);

quizBattleApiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            handle401Error();
        }
        return Promise.reject(error);
    }
);

masterApiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            handle401Error();
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApiService = {
    login: async (data: LoginRequest): Promise<{ token: string; login: boolean }> => {
        const response = await authApi.post<ApiResponse<AuthResponse>>('/auth-mini', data);

        // Check response structure matches expected format
        if (response.data && response.data.data && response.data.data.token) {
            return {
                token: response.data.data.token,
                login: response.data.data.login ?? true
            };
        } else {
            throw new Error('Invalid login response structure');
        }
    },

    register: async (data: RegisterRequest): Promise<User> => {
        const response = await authApi.post<ApiResponse<RegisterUserResponse>>('/register-mini', data);

        if (response.data && response.data.data) {
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
            const response = await userProfileApi.get('/profile-battle');

            // Xử lý response linh hoạt - có thể là ApiResponse hoặc trực tiếp User
            let userData: any;
            if (response.data.data) {
                userData = response.data.data;
            } else {
                userData = response.data;
            }

            if (userData && userData.rank && !userData.globalRank) {
                userData.globalRank = userData.rank;
                delete userData.rank;
            }

            return userData as User;
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
        }
    },
};

// Quiz Battle API
export const quizBattleApiService = {
    getShoppingMall: async (): Promise<{ meta: { code: number; message: string }, data: Array<{ id: number; itemCode: string; status: string; description: string; quantity: number; priceInKey: number }> }> => {
        try {
            const response = await quizBattleApiInstance.get('/shopping-mall');
            return response.data;
        } catch (error: any) {
            console.error('❌ API: getShoppingMall failed:', error);
            console.error('❌ API: Error response:', error.response?.data);
            console.error('❌ API: Error status:', error.response?.status);
            throw error;
        }
    },
    consumeItem: async (payload: { itemCode: string; quantity: number }): Promise<{ meta: { code: number; message: string }, data?: { userBag: any } }> => {
        try {
            const response = await quizBattleApiInstance.post('/consume-item', payload);
            return response.data;
        } catch (error: any) {
            console.error('❌ API: consumeItem failed:', error);
            throw error;
        }
    },
    getUserBag: async (): Promise<UserBagResponse> => {
        try {
            const response = await quizBattleApiInstance.get<UserBagResponse>('/user-bag');
            
            return response.data;
        } catch (error: any) {
            console.error('❌ API: getUserBag failed:', error);
            console.error('❌ API: Error response:', error.response?.data);
            console.error('❌ API: Error status:', error.response?.status);
            throw error;
        }
    },

    getQuestionsByCategory: async (requestData: QuestionsByCategoryRequest): Promise<QuestionsByCategoryResponse> => {
        try {
            const response = await quizBattleApiInstance.post<QuestionsByCategoryResponse>('/questions/by-category', requestData);
            
            return response.data;
        } catch (error: any) {
            console.error('❌ API: getQuestionsByCategory failed:', error);
            console.error('❌ API: Error response:', error.response?.data);
            console.error('❌ API: Error status:', error.response?.status);
            throw error;
        }
    },

    getUserRanking: async (): Promise<{ data: { globalRank: GlobalRank } }> => {
        try {
            const response = await quizBattleApiInstance.get<{ data: { globalRank: GlobalRank } }>('/user-ranking');
            return response.data;
        } catch (error: any) {
            console.error('❌ API: getUserRanking failed:', error);
            throw error;
        }
    },
};

// Master API
export const masterApiService = {
    getUniversities: async (): Promise<{
        meta: { code: number; message: string };
        pagination: { pageSize: number; pageOffset: number; totalRecords: number; totalPages: number };
        data: Array<{ text: string; code: string; image?: string }>;
    }> => {
        try {
            const response = await masterApiInstance.get('/list', {
                params: { filterType: 'UNIVERSITY' },
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ API: getUniversities failed:', error);
            console.error('❌ API: Error response:', error.response?.data);
            console.error('❌ API: Error status:', error.response?.status);
            throw error;
        }
    },
};

export default api;