'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutContent from '@/components/layout/LayoutContent';
import { useAuth } from '@/hooks/useAuth';
import { useUserRanking } from '@/hooks/useUserRanking';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { globalRank, loading: rankingLoading, fetchUserRanking } = useUserRanking();
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

  // Fetch user ranking when component mounts
  useEffect(() => {
    if (user) {
      fetchUserRanking();
    }
  }, [user, fetchUserRanking]);

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
            className="bg-white bg-opacity-10 rounded-3xl px-10 py-8 mb-8"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="flex items-center justify-between">
              {/* Left side - User Info */}
              <div className="flex-1">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {user.fullName || user.username || 'FA Battle'}
                </h2>
                <p className="text-white text-sm my-2 opacity-30">
                  {user.email || 'user@example.com'}
                </p>
                <p className="text-white text-sm mb-6 opacity-30">
                  {user.university || 'Đại học Y Hà Nội'}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-yellow-400 hover:text-yellow-300 font-medium text-sm"
                >
                  Đăng xuất
                </button>
              </div>

              {/* Right side - Avatar and Level */}
              <div className="flex flex-col items-center relative">
                {/* Avatar with gradient ring */}
                <div className="w-28 h-28 rounded-full bg-white/10 p-2 mb-3 relative">
                  <div className="w-full h-full rounded-full  bg-gradient-to-t from-transparent to-white flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.fullName || user.username}
                        className="w-full h-full rounded-full object-fill"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                {/* Star icon positioned at bottom center of avatar */}
                {globalRank?.url && (
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <img 
                      src={globalRank.url} 
                      alt="Ranking Icon" 
                      className="w-8 h-8"
                    />
                  </div>
                )}
                </div>
                
                
                {/* Level Info */}
                <div className="flex items-center my-2">
                  <span className="text-white text-xs font-medium">
                    {globalRank?.title || '--. ---'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4">
            {/* Mua key */}
            <button
              onClick={() => router.push('/shop')}
              className="bg-white bg-opacity-10 rounded-3xl px-8 py-4 flex flex-col items-start space-y-2 hover:bg-opacity-5 duration-500 transition-all"
            >
              <img 
                src="/logos/account/buy-key.png" 
                alt="Mua key" 
                className="w-auto h-20"
              />
              <span className="text-white text-sm font-medium">Mua key</span>
            </button>

            {/* Liên hệ */}
            <button
              onClick={handleContact}
              className="bg-white bg-opacity-10 rounded-3xl px-8 py-4 flex flex-col items-start space-y-2 hover:bg-opacity-5 duration-500 transition-all"
            >
              <img 
                src="/logos/account/messenger.png" 
                alt="Liên hệ" 
                className="w-auto h-20"
              />
              <span className="text-white text-sm font-medium">Liên hệ</span>
            </button>

            {/* Báo lỗi */}
            <button
              onClick={handleReportError}
              className="bg-white bg-opacity-10 rounded-3xl px-8 py-4 flex flex-col items-start space-y-2 hover:bg-opacity-5 duration-500 transition-all"
            >
              <img 
                src="/logos/account/error.png" 
                alt="Báo lỗi" 
                className="w-auto h-20"
              />
              <span className="text-white text-sm font-medium">Báo lỗi</span>
            </button>
          </div>
        </div>
      </div>
    </LayoutContent>
  );
};

export default AccountPage;
