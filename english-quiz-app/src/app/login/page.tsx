'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { trackUserLogin, trackPageViewCustom } from '@/lib/analytics';

const loginSchema = z.object({
  phone: z.string().min(1, 'Số điện thoại là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, user, loading: authLoading, isInitialized } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Track page view on mount
  useEffect(() => {
    trackPageViewCustom('login', 'auth');
  }, []);

  // Redirect nếu user đã đăng nhập
  useEffect(() => {
    console.log('🔍 LoginPage: Auth state:', { user, authLoading, isInitialized });

    if (isInitialized && !authLoading && user) {
      console.log('🔍 LoginPage: User already logged in, redirecting...');
      router.push('/quiz-validation');
    }
  }, [user, authLoading, isInitialized, router]);

  const onSubmit = async (data: LoginFormData) => {
    console.log('🔍 LoginPage: Login form submitted');
    setIsLoading(true);
    setError('');

    try {
      // Convert phone to username for API compatibility
      const loginData = { username: data.phone, password: data.password };
      await login(loginData);
      
      // Track successful login
      trackUserLogin('phone');
      
      console.log('🔍 LoginPage: Login successful, should redirect soon');
      // Redirect sẽ được handle bởi useEffect ở trên
    } catch (err: unknown) {
      console.error('❌ LoginPage: Login failed:', err);
      const error = err as { 
        response?: { 
          status?: number;
          data?: { 
            meta?: { 
              message?: string;
              code?: number;
            };
            message?: string;
          } 
        } 
      };
      
      // Xử lý lỗi 400 với message từ meta
      if (error.response?.status === 400 && error.response?.data?.meta?.message) {
        setError(error.response.data.meta.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Đăng nhập thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Hiển thị loading khi auth chưa initialize
  if (!isInitialized || authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
          <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
            <div className="mb-5 text-center">
              <h1 className="m-0 flex items-center justify-center gap-2 text-2xl font-semibold text-[#1a365d]">
                <span className="text-xl"></span>
                Đang tải...
              </h1>
            </div>
            <div className="text-center py-5">Đang kiểm tra trạng thái đăng nhập...</div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-white pt-20">
        {/* Login Modal */}
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-5">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center justify-center mb-8">
            {error && (
                  <div className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl mb-5 text-sm font-medium text-center">
                    {error}
                  </div>
              )}
              <div className="flex items-center">
                <Image 
                  src="/logos/falogin.png" 
                  alt="FA Streak Logo"
                  width={200}
                  height={50}
                  className="h-[50px] w-auto object-contain"
                />
              </div>
            </div>

            <form className="mb-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-5">
                <input
                    type="text"
                    id="phone"
                    placeholder="Số điện thoại"
                    {...register('phone')}
                    autoFocus={true}
                    className={`w-full px-8 py-5 rounded-full text-base bg-white box-border transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed border-2 ${errors.phone ? 'border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-100 focus:border-[#FFBA08] focus:ring-2 focus:ring-[#FFBA08]/10'}`}
                    disabled={isLoading}
                />
                {errors.phone && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.phone.message}</span>
                )}
              </div>

              <div className="mb-5">
                <div className="relative">
                  <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Mật khẩu"
                      {...register('password')}
                      className={`w-full px-8 py-5 pr-12 rounded-full text-base bg-white box-border transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed border-2 ${errors.password ? 'border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-100 focus:border-[#FFBA08] focus:ring-2 focus:ring-[#FFBA08]/10'}`}
                      disabled={isLoading}
                  />
                  <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                  >
                    <svg width="20" height="12" viewBox="0 0 29 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.8 0.200195C6.47005 0.200195 1.09405 8.7962 0.996049 8.9502C0.870049 9.1182 0.800049 9.3282 0.800049 9.5382C0.800049 9.7202 0.856049 9.8882 0.954049 10.0422C0.968049 10.0702 5.49005 18.8622 14.8 18.8622C24.082 18.8622 28.576 10.1682 28.632 10.0562L28.646 10.0422C28.744 9.8882 28.8 9.7202 28.8 9.5382C28.8 9.3282 28.73 9.1182 28.604 8.9642C28.5061 8.7962 23.13 0.200195 14.8 0.200195ZM14.8 3.0002C18.412 3.0002 21.338 5.9262 21.338 9.5382C21.338 13.1502 18.412 16.0762 14.8 16.0762C11.188 16.0762 8.26205 13.1362 8.26205 9.5382C8.26205 5.9402 11.188 3.0002 14.8 3.0002ZM14.8 6.7382C13.26 6.7382 12 7.9982 12 9.5382C12 11.0782 13.26 12.3382 14.8 12.3382C16.34 12.3382 17.6 11.0782 17.6 9.5382C17.6 7.9982 16.34 6.7382 14.8 6.7382Z" fill={showPassword ? '#FFBA08' : '#CCCCCC'}/>
                    </svg>
                  </button>
                </div>
                {errors.password && (
                    <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>
                )}
              </div>

              <div className="text-right mb-5">
                <a 
                  href="https://m.me/appfastreak?ref=password" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-[#FFBA08] transition"
                >
                  Quên mật khẩu?
                </a>
              </div>

              <button
                  type="submit"
                  className="w-full py-5 rounded-full text-white font-semibold uppercase transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FFBA08' }}
                  disabled={isLoading}
              >
                {isLoading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
              </button>
            </form>

            <Link href="/register" className="block text-center text-gray-500 text-sm leading-[1.5] hover:text-gray-700 transition">
              <p className="m-0">
                Chưa có tài khoản? <span className="text-[#FFBA08] font-semibold hover:text-[#e6a800] transition">ĐĂNG KÝ</span>
              </p>
            </Link>
          </div>
        </div>
      </div>
  );
};

export default LoginPage;