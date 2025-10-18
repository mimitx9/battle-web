'use client';

import React, {createContext, useContext, useEffect, useState, ReactNode} from 'react';
import {User, LoginRequest, RegisterRequest} from '@/types';
import {authApiService} from '@/lib/api';
import {useUserCache} from './useUserCache';
import {handle401Error} from '@/lib/authUtils';

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

    console.log('🔍 AuthProvider: Component mounted/rendered');

    // Chỉ dùng một effect duy nhất để tránh race condition
    useEffect(() => {
        console.log('🔍 AuthProvider: useEffect triggered');

        // Tránh chạy nhiều lần
        if (isInitialized) {
            console.log('🔍 AuthProvider: Already initialized, skipping');
            return;
        }

        const initAuth = async () => {
            console.log('🔍 useAuth: Initializing auth...');

            // Kiểm tra localStorage có sẵn không (tránh lỗi SSR)
            if (typeof window === 'undefined') {
                console.log('🔍 useAuth: Running on server, skipping localStorage check');
                setLoading(false);
                setIsInitialized(true);
                return;
            }

            const token = localStorage.getItem('auth_token');
            console.log('🔍 useAuth: Token found:', token ? 'YES' : 'NO');

            if (token) {
                // First, try to get user from cache
                const cachedUser = getUserFromCache();
                if (cachedUser) {
                    console.log('🔍 useAuth: Using cached user data, skipping API call');
                    setUser(cachedUser);
                    setLoading(false);
                    setIsInitialized(true);
                    return;
                }

                // If no cache, fetch from API
                try {
                    console.log('🔍 useAuth: No valid cache, calling getProfile API...');
                    const userData = await authApiService.getProfile();
                    console.log('🔍 useAuth: Profile data received:', userData);
                    setUser(userData);
                    saveUserToCache(userData);
                } catch (error: any) {
                    console.error('❌ useAuth: Failed to get profile:', error);
                    console.error('❌ useAuth: Error details:', {
                        message: error?.message,
                        status: error?.response?.status,
                        data: error?.response?.data
                    });
                    
                    // Check if it's a 401 error and handle it
                    if (error?.response?.status === 401) {
                        handle401Error();
                    } else {
                        localStorage.removeItem('auth_token');
                        clearUserCache();
                        setUser(null);
                    }
                }
            } else {
                console.log('🔍 useAuth: No token found, user will be null');
                clearUserCache();
            }

            setLoading(false);
            setIsInitialized(true);
            console.log('🔍 useAuth: Initialization completed');
        };

        initAuth().catch(error => {
            console.error('❌ useAuth: initAuth failed:', error);
            setLoading(false);
            setIsInitialized(true);
        });
    }, []);

    // Debug useEffect để kiểm tra state changes
    useEffect(() => {
        console.log('🔍 AuthProvider: State changed:', {
            user: user ? `${user.username || user.userId || 'unknown'} (${user.userId || 'no-id'})` : null,
            loading,
            isInitialized
        });
    }, [user, loading, isInitialized]);

    const login = async (data: LoginRequest) => {
        console.log('🔍 AuthProvider: Login attempt started');
        setLoading(true);

        try {
            // Step 1: Gọi API đăng nhập để lấy token
            const loginResponse = await authApiService.login(data);
            console.log('🔍 AuthProvider: Login response received:', loginResponse);

            // Extract token from response: { token: "...", login: true }
            const token = loginResponse?.token;
            console.log('🔍 AuthProvider: Extracted token:', token ? 'YES' : 'NO');

            if (!token) {
                throw new Error('No token received from login API');
            }

            // Step 2: Lưu token vào localStorage
            localStorage.setItem('auth_token', token);
            console.log('🔍 AuthProvider: Token saved to localStorage');

            // Step 3: Gọi API getProfile để lấy user data
            console.log('🔍 AuthProvider: Calling getProfile API...');
            const userData = await authApiService.getProfile();
            console.log('🔍 AuthProvider: Profile data received:', userData);

            // Step 4: Set user data and cache it
            setUser(userData);
            saveUserToCache(userData);
            console.log('🔍 AuthProvider: Login successful, user set and cached:', userData);

        } catch (error: any) {
            console.error('❌ AuthProvider: Login failed:', error);
            // Cleanup nếu có lỗi
            localStorage.removeItem('auth_token');
            clearUserCache();
            setUser(null);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterRequest) => {
        console.log('🔍 AuthProvider: Register attempt started');
        setLoading(true);

        try {
            // Step 1: Gọi API register để tạo user
            const userData = await authApiService.register(data);
            console.log('🔍 AuthProvider: Register successful, user created:', userData);

            // Step 2: Sau khi register thành công, tự động login để lấy token
            console.log('🔍 AuthProvider: Auto-login after register...');
            const loginData = {
                username: data.username,
                password: data.password
            };

            const loginResponse = await authApiService.login(loginData);
            console.log('🔍 AuthProvider: Auto-login response:', loginResponse);

            // Step 3: Lưu token
            const token = loginResponse?.token;
            if (token) {
                localStorage.setItem('auth_token', token);
                console.log('🔍 AuthProvider: Token saved after register');
            }

            // Step 4: Set user data and cache it (đã có từ register response)
            setUser(userData);
            saveUserToCache(userData);
            console.log('🔍 AuthProvider: Register + login successful, user cached');

        } catch (error: any) {
            console.error('❌ AuthProvider: Register failed:', error);
            localStorage.removeItem('auth_token');
            clearUserCache();
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
            setUser(null);
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            console.log('🔍 AuthProvider: Refreshing user data...');
            const userData = await authApiService.getProfile();
            setUser(userData);
            saveUserToCache(userData);
            console.log('🔍 AuthProvider: User data refreshed and cached');
        } catch (error: any) {
            console.error('Refresh user error:', error);
            
            // Check if it's a 401 error and handle it
            if (error?.response?.status === 401) {
                handle401Error();
            } else {
                localStorage.removeItem('auth_token');
                clearUserCache();
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