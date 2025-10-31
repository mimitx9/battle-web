import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { masterApiService } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Image from 'next/image';

const loginSchema = z.object({
  phone: z.string().min(1, 'Số điện thoại là bắt buộc'),
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
});

const registerSchema = z.object({
  phone: z.string().min(1, 'Số điện thoại là bắt buộc'),
  fullName: z.string().min(1, 'Họ tên là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  universityId: z.string().min(1, 'Vui lòng chọn trường'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface HomeLoginFormProps {
  onSuccess?: () => void;
}

const HomeLoginForm: React.FC<HomeLoginFormProps> = ({ onSuccess }) => {
  const { login, register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [universities, setUniversities] = useState<Array<{ text: string; code: string; image?: string }>>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState<{ text: string; code: string; image?: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(isRegisterMode ? registerSchema : loginSchema),
  });

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const res = await masterApiService.getUniversities();
        setUniversities(res.data || []);
      } catch (e) {
        // fallback: để trống, user sẽ không thể submit do schema bắt buộc
        setUniversities([]);
      } finally {
        setLoadingUniversities(false);
      }
    };
    fetchUniversities();
  }, []);

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    setIsLoading(true);
    setError('');

    try {
      if (isRegisterMode) {
        // Xử lý đăng ký
        const registerData = data as RegisterFormData;
        const username = registerData.phone;
        const email = `${username}@no-email.local`;
        const universityIdValue = Number((registerData as any).universityId);
        if (Number.isNaN(universityIdValue)) {
          throw new Error('Vui lòng chọn trường hợp lệ');
        }

        await registerUser({
          email,
          username,
          password: registerData.password,
          fullName: registerData.fullName,
          universityId: universityIdValue,
        });
      } else {
        // Xử lý đăng nhập
        const loginData = data as LoginFormData;
        await login({
          username: loginData.phone,
          password: loginData.password
        });
      }
      
      reset();
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: { meta?: { message?: string; code?: number }; message?: string };
        };
      };
      
      if (error.response?.status === 400 && error.response?.data?.meta?.message) {
        setError(error.response.data.meta.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(isRegisterMode ? 'Đăng ký thất bại' : 'Đăng nhập thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setShowPassword(false);
    reset();
  };

  return (
    <div className="min-h-screen">
      {/* Login Modal */}
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center mb-8">
            {error && (
              <div className="bg-red-50 text-red-600 px-5 py-3 rounded-3xl mb-5 text-sm font-medium text-center">
                {error}
              </div>
            )}
            <div className="flex items-center">
              <Image 
                src="/logos/falogin.png"
                alt="FA Battle Logo"
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

            {/* Hiển thị trường họ tên khi ở chế độ đăng ký */}
            {isRegisterMode && (
              <div className="mb-5">
                <input
                  type="text"
                  id="fullName"
                  placeholder="Họ tên"
                {...register('fullName')}
                className={`w-full px-8 py-5 rounded-full text-base bg-white box-border transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed border-2 ${(errors as any).fullName ? 'border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-100 focus:border-[#FFBA08] focus:ring-2 focus:ring-[#FFBA08]/10'}`}
                disabled={isLoading}
              />
              {(errors as any).fullName && (
                <span className="text-red-500 text-xs mt-1 block">{(errors as any).fullName.message}</span>
              )}
              </div>
            )}

            {isRegisterMode && (
              <div className="mb-5 relative">
                {/* Hiển thị như input */}
                <button
                  type="button"
                  className={`w-full text-left px-8 py-5 rounded-full text-base bg-white box-border transition focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed border-2 ${((errors as any).universityId) ? 'border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-100 focus:border-[#FFBA08] focus:ring-2 focus:ring-[#FFBA08]/10'}`}
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  disabled={isLoading || loadingUniversities}
                >
                  {selectedUniversity ? selectedUniversity.text : (loadingUniversities ? 'Đang tải danh sách trường...' : 'Chọn trường đại học')}
                </button>

                {/* Dropdown panel */}
                {isDropdownOpen && (
                  <div className="absolute z-20 mt-2 w-full bg-white rounded-2xl shadow-lg border border-gray-100">
                    <div className="p-3 border-b border-gray-100">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm tên trường..."
                        className="w-full px-4 py-3 rounded-full text-sm bg-white border-2 border-gray-100 focus:border-[#FFBA08] focus:ring-2 focus:ring-[#FFBA08]/10 outline-none"
                      />
                    </div>
                    <div className="max-h-64 overflow-auto">
                      {universities
                        .filter((u) => u.text.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((u) => (
                          <div
                            key={u.code}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedUniversity(u);
                              setValue('universityId' as any, u.code, { shouldValidate: true, shouldDirty: true });
                              setIsDropdownOpen(false);
                            }}
                          >
                            {u.text}
                          </div>
                        ))}
                      {universities.filter((u) => u.text.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">Không tìm thấy trường phù hợp</div>
                      )}
                    </div>
                  </div>
                )}
                {/* input ẩn để RHF nắm giá trị */}
                <input type="hidden" {...register('universityId')} />
                {(errors as any).universityId && (
                  <span className="text-red-500 text-xs mt-1 block">{(errors as any).universityId.message}</span>
                )}
              </div>
            )}

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

            {/* Chỉ hiển thị "Quên mật khẩu" khi ở chế độ đăng nhập */}
            {!isRegisterMode && (
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
            )}

            <button
              type="submit"
              className="w-full py-5 tracking-wide rounded-full text-white uppercase transition disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-b from-[#FFD700] to-[#FF8C00] shadow-lg shadow-[#FFBA08]/30"
              disabled={isLoading}
            >
              {isLoading 
                ? (isRegisterMode ? 'Đang đăng ký...' : 'Đang đăng nhập...') 
                : (isRegisterMode ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP')
              }
            </button>
          </form>

          <div className="text-center text-gray-500 text-sm leading-[1.5]">
            <p className="m-0">
              {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} 
              <span 
                className="text-[#FFBA08] hover:text-[#e6a800] transition cursor-pointer font-semibold"
                onClick={switchMode}
              >
                {isRegisterMode ? ' ĐĂNG NHẬP' : ' ĐĂNG KÝ'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeLoginForm;
