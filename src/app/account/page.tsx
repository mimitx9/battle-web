'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutContent from '@/components/layout/LayoutContent';
import { useAuth } from '@/hooks/useAuth';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleContact = () => {
    window.open('https://m.me/appfaquiz?ref=battle', '_blank');
  };

  const handleReportError = () => {
    window.open('https://m.me/appfaquiz?ref=battle', '_blank');
  };

  if (!user) {
    return (
      <LayoutContent>
        <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: '#04002A' }}>
          <div className="max-w-md mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">
              Vui lòng đăng nhập
            </h1>
            <Link href="/login" className="text-orange-400 hover:text-orange-300">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </LayoutContent>
    );
  }

  return (
    <LayoutContent>
      <div className="min-h-screen pt-20 pb-8" style={{ backgroundColor: '#04002A' }}>
        {/* Main Content */}
        <div className="max-w-3xl mx-auto px-4 pt-20">
          {/* User Profile Card */}
          <div 
            className="bg-white bg-opacity-10 rounded-2xl p-6 mb-8"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="flex items-center justify-between">
              {/* Left side - User Info */}
              <div className="flex-1">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {user.fullName || user.username || 'Người dùng'}
                </h2>
                <p className="text-white text-sm mb-1">
                  {user.email || 'user@example.com'}
                </p>
                <p className="text-white text-sm mb-4">
                  {user.university || 'Đại học Y Hà Nội'}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-orange-400 hover:text-orange-300 font-medium"
                  style={{ color: '#FFBA08' }}
                >
                  Đăng xuất
                </button>
              </div>

              {/* Right side - Avatar and Level */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center mb-3">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName || user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Level Info */}
                <div className="flex items-center space-x-1 mb-2">
                  <img 
                    src="/logos/header/fire.svg" 
                    alt="Star" 
                    className="w-4 h-4"
                  />
                  <span className="text-white text-sm font-medium">
                    Lv 10. Vàng V
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-32 h-2 bg-purple-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: '62.5%' }}
                  ></div>
                </div>
                <div className="flex items-center justify-between w-32 mt-1">
                  <span className="text-white text-xs">250/400</span>
                  <img 
                    src="/logos/header/key.svg" 
                    alt="Diamond" 
                    className="w-3 h-3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            {/* Mua key */}
            <button
              onClick={() => router.push('/shop')}
              className="bg-white bg-opacity-10 rounded-xl p-6 flex flex-col items-center space-y-3 hover:bg-opacity-20 transition-all"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <img 
                src="/logos/account/buy-key.svg" 
                alt="Mua key" 
                className="w-12 h-12"
              />
              <span className="text-white font-medium">Mua key</span>
            </button>

            {/* Liên hệ */}
            <button
              onClick={handleContact}
              className="bg-white bg-opacity-10 rounded-xl p-6 flex flex-col items-center space-y-3 hover:bg-opacity-20 transition-all"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <img 
                src="/logos/account/messenger.svg" 
                alt="Liên hệ" 
                className="w-12 h-12"
              />
              <span className="text-white font-medium">Liên hệ</span>
            </button>

            {/* Báo lỗi */}
            <button
              onClick={handleReportError}
              className="bg-white bg-opacity-10 rounded-xl p-6 flex flex-col items-center space-y-3 hover:bg-opacity-20 transition-all"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <img 
                src="/logos/account/error.svg" 
                alt="Báo lỗi" 
                className="w-12 h-12"
              />
              <span className="text-white font-medium">Báo lỗi</span>
            </button>
          </div>
        </div>
      </div>
    </LayoutContent>
  );
};

export default AccountPage;
