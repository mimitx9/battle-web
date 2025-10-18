'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAttemptLimit } from '@/hooks/useAttemptLimit';
import AttemptLimitModal from '@/components/common/AttemptLimitModal';

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  // Attempt limit check for free users
  const { showLimitModal, closeLimitModal, checkAttemptLimit } = useAttemptLimit();

  // Check if user is paid for AI correction access
  const checkAIAccess = () => {
    if (!user) return false;
    
    // Check if user is paid
    const isPaid = user.faTestInfo?.isPaid || 
                   user.subscriptionType === 'premium' || 
                   (user.faTestInfo?.plan && user.faTestInfo.plan !== 'FREE');
    
    if (!isPaid) {
      console.log('🔍 Header: Free user trying to access AI correction, showing upgrade modal');
      checkAttemptLimit(user);
      return false;
    }
    
    return true;
  };

  return (
    <>
    <header className="bg-white border-b border-gray-100 h-20 flex items-center px-12 fixed top-0 left-0 right-0 z-50">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <img 
            src="/logos/logo.png" 
            alt="FA Streak Logo" 
            className="w-[188px] h-[30px]"
          />
        </Link>
      </div>

      {/* Navigation Links - Desktop */}
      <nav className="hidden lg:flex items-center space-x-12 flex-1 justify-center">
        {/* Trang chủ */}
        <div 
          className="relative"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button
            className="flex items-center space-x-1 text-gray-600 hover:text-black font-normal text-sm"
          >
            <span>Trang chủ</span>
            <svg 
              className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div 
              className="absolute top-5 left-0 w-48 bg-white rounded-2xl shadow-lg border border-gray-100  py-4 px-4 z-50"
            >
              <Link 
                href="/quiz-validation" 
                className="block px-2 py-2 text-gray-600 hover:text-black font-normal text-sm leading-none tracking-normal"
              >
                Thi thử
              </Link>
              <button 
                onClick={() => {
                  if (!user) {
                    router.push('/login');
                  } else {
                    router.push('/chat');
                  }
                }}
                className="block px-2 py-2 text-gray-600 hover:text-black font-normal text-sm leading-none tracking-normal"
              >
                AI chữa đề
              </button>
              <Link 
                href="/quiz/history" 
                className="block px-2 py-2 text-gray-600 hover:text-black font-normal text-sm leading-none tracking-normal"
              >
                Lịch sử làm bài
              </Link>
            </div>
          )}
        </div>

        {/* Nâng Pro */}
        <Link 
          href="/subscription" 
          className="flex items-center space-x-1 text-gray-600 hover:text-black font-normal text-sm"
        >
          Nâng Pro
        </Link>

        {/* Liên hệ */}
        <Link 
          href="https://m.me/appfastreak" 
          className="flex items-center space-x-1 text-gray-600 hover:text-black font-normal text-sm"
        >
          Liên hệ
        </Link>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden flex items-center space-x-4">
        <Link href="/subscription" className="text-gray-500 hover:text-gray-700 text-sm">
          Nâng Pro
        </Link>
        <Link href="https://m.me/appfastreak" className="text-gray-500 hover:text-gray-700 text-sm">
          Liên hệ
        </Link>
      </nav>

      {/* Action Button and User Avatar */}
      <div className="flex items-center space-x-4 justify-end">
        <Link href="/quiz-validation">
          <Button 
            className="text-white font-semibold text-sm px-6 py-3 tracking-wide rounded-full"
            style={{ 
              backgroundColor: '#FFBA08',
            }}
          >
            Thi thử
          </Button>
        </Link>
        
        {/* Login Button - Show when user is not logged in */}
        {!user && (
          <Link href="/login">
            <Button 
              className="text-gray-600 bg-white border border-gray-200 font-medium text-sm px-5 py-3 hover:bg-gray-50 rounded-full"
            >
              Đăng nhập
            </Button>
          </Link>
        )}
        
        {/* User Avatar - Show when user is logged in */}
        {user && (
          <Link href="/quiz/history" className="cursor-pointer">
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center overflow-hidden hover:bg-gray-100 transition-colors">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.fullName || user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-full h-full" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="25" cy="25" r="25" fill="#CCCCCC" fillOpacity="0.25"/>
                  <path d="M15.0156 23C15.0156 28.5188 19.4968 33 25.0156 33C30.5344 33 35.0156 28.5038 35.0156 23C35.0156 17.4812 30.5344 13 25.0156 13C19.4968 13 15.0156 17.4812 15.0156 23Z" fill="black" fillOpacity="0.25"/>
                  <path d="M25 36.5607C29.4407 36.5607 33.2629 38.6118 34.9951 41.5607C32.2664 43.7763 28.7888 45.1056 25 45.1056C21.2108 45.1055 17.7327 43.7767 15.0039 41.5607C16.736 38.6115 20.5591 36.5607 25 36.5607Z" fill="black" fillOpacity="0.25"/>
                </svg>
              )}
            </div>
          </Link>
        )}
      </div>
    </header>

    {/* Attempt Limit Modal */}
    <AttemptLimitModal
      isOpen={showLimitModal}
      onClose={closeLimitModal}
      currentAttempts={user?.countAttempt || 0}
      maxAttempts={1}
    />
    </>
  );
};

export default Header;