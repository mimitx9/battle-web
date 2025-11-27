'use client';

import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import {User, LoginRequest, RegisterRequest} from '@/types';
import {authApiService} from '@/lib/api';
import {useUserCache} from './useUserCache';
import {handle401Error} from '@/lib/authUtils';
import {resetFirePoints} from '@/lib/firePointsUtils';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isInitialized: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    incrementAttemptCount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Use the cache hook
    const { saveUserToCache, getUserFromCache, clearUserCache } = useUserCache();

    // Chỉ dùng một effect duy nhất để tránh race condition
    useEffect(() => {
        // Tránh chạy nhiều lần
        if (isInitialized) {
            return;
        }

        const initAuth = async () => {
            // Kiểm tra localStorage có sẵn không (tránh lỗi SSR)
            if (typeof window === 'undefined') {
                setLoading(false);
                setIsInitialized(true);
                return;
            }

            const token = localStorage.getItem('auth_token');

            if (token) {
                // First, try to get user from cache
                const cachedUser = getUserFromCache();
                if (cachedUser) {
                    setUser(cachedUser);
                    setLoading(false);
                    setIsInitialized(true);
                    return;
                }

                // If no cache, fetch from API
                try {
                    const userData = await authApiService.getProfile();
                    setUser(userData);
                    saveUserToCache(userData);
                } catch (error: any) {
                    // Check if it's a 401 error and handle it
                    if (error?.response?.status === 401) {
                        handle401Error();
                    } else {
                        localStorage.removeItem('auth_token');
                        clearUserCache();
                        resetFirePoints(); // Reset đốm lửa khi có lỗi
                        setUser(null);
                    }
                }
            } else {
                clearUserCache();
                resetFirePoints(); // Reset đốm lửa khi không có token
            }

            setLoading(false);
            setIsInitialized(true);
        };

        initAuth().catch(error => {
            setLoading(false);
            setIsInitialized(true);
        });
    }, []);

    const login = async (data: LoginRequest) => {
        setLoading(true);

        try {
            // Step 1: Gọi API đăng nhập để lấy token
            const loginResponse = await authApiService.login(data);

            // Extract token from response: { token: "...", login: true }
            const token = loginResponse?.token;

            if (!token) {
                throw new Error('No token received from login API');
            }

            // Step 2: Lưu token vào localStorage
            localStorage.setItem('auth_token', token);

            // Step 3: Gọi API getProfile để lấy user data
            const userData = await authApiService.getProfile();

            // Step 4: Set user data and cache it
            setUser(userData);
            saveUserToCache(userData);

        } catch (error: any) {
            // Cleanup nếu có lỗi
            localStorage.removeItem('auth_token');
            clearUserCache();
            resetFirePoints(); // Reset đốm lửa khi login thất bại
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterRequest) => {
        setLoading(true);

        try {
            // Step 1: Gọi API register để tạo user
            const userData = await authApiService.register(data);

            // Step 2: Sau khi register thành công, tự động login để lấy token
            const loginData = {
                username: data.username,
                password: data.password
            };

            const loginResponse = await authApiService.login(loginData);

            // Step 3: Lưu token
            const token = loginResponse?.token;
            if (token) {
                localStorage.setItem('auth_token', token);
            }

            // Step 4: Set user data and cache it (đã có từ register response)
            setUser(userData);
            saveUserToCache(userData);

        } catch (error: any) {
            localStorage.removeItem('auth_token');
            clearUserCache();
            resetFirePoints(); // Reset đốm lửa khi register thất bại
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authApiService.logout();
        } catch (error: any) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            clearUserCache();
            resetFirePoints(); // Reset đốm lửa khi logout
            setUser(null);
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            const userData = await authApiService.getProfile();
            setUser(userData);
            saveUserToCache(userData);
        } catch (error: any) {
            // Check if it's a 401 error and handle it
            if (error?.response?.status === 401) {
                handle401Error();
            } else {
                localStorage.removeItem('auth_token');
                clearUserCache();
                resetFirePoints(); // Reset đốm lửa khi refresh thất bại
                setUser(null);
            }
        }
    };

    const incrementAttemptCount = () => {
        setUser(prev => {
            if (!prev) return prev;
            const updated: User = {
                ...prev,
                countAttempt: (prev.countAttempt || 0) + 1,
            };
            saveUserToCache(updated);
            return updated;
        });
    };

    const value = {
        user,
        loading,
        isInitialized,
        login,
        register,
        logout,
        refreshUser,
        incrementAttemptCount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};