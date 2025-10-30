'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import FireLoading from '@/components/ui/FireLoading';
import { useAuth } from '@/hooks/useAuth';
import { useFirePoints } from '@/hooks/useFirePoints';
import { QuizRoom } from '@/types';
import { startBackgroundMusic, stopBackgroundMusic, setBackgroundMusicEnabled, setSoundEnabled, isBackgroundMusicEnabled, isSoundEnabled } from '@/lib/soundUtils';

interface HeaderProps {
  currentRoom?: QuizRoom | null;
  wsConnected?: boolean;
  roomWsConnected?: boolean;
  userBag?: {
    key?: number;
    battleHint?: number;
    battleSnow?: number;
    battleBlockTop1?: number;
    battleBlockBehind?: number;
  } | null;
}

const Header: React.FC<HeaderProps> = ({ 
  currentRoom, 
  wsConnected = false, 
  roomWsConnected = false,
  userBag
}) => {
  const [isBackgroundMusicOn, setIsBackgroundMusicOn] = useState(false);
  const [isSoundEffectsOn, setIsSoundEffectsOn] = useState(true);
  const { user, logout } = useAuth();
  const { firePoints } = useFirePoints();
  const router = useRouter();


  // Initialize sound settings
  useEffect(() => {
    setIsBackgroundMusicOn(isBackgroundMusicEnabled());
    setIsSoundEffectsOn(isSoundEnabled());
    
    // Auto start background music if enabled
    if (isBackgroundMusicEnabled()) {
      startBackgroundMusic();
    }
  }, []);

  // Handle background music toggle
  const handleBackgroundMusicToggle = () => {
    const newState = !isBackgroundMusicOn;
    setIsBackgroundMusicOn(newState);
    setBackgroundMusicEnabled(newState);
    
    if (newState) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  };

  // Handle sound effects toggle
  const handleSoundEffectsToggle = () => {
    const newState = !isSoundEffectsOn;
    setIsSoundEffectsOn(newState);
    setSoundEnabled(newState);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user is paid for AI correction access
  const checkAIAccess = () => {
    if (!user) return false;
    
    // Check if user is paid
    const isPaid = user.faTestInfo?.isPaid || 
                   user.subscriptionType === 'premium' || 
                   (user.faTestInfo?.plan && user.faTestInfo.plan !== 'FREE');
    
    if (!isPaid) {
      console.log('🔍 Header: Free user trying to access AI correction, showing upgrade modal');
      return false;
    }
    
    return true;
  };

  return (
    <header className="h-20 flex items-center px-8 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#04002A' }}>
      {/* Left side - Fire and Key icons */}
      <div className="flex items-center space-x-4 w-1/3">
        {/* Fire icon with loading circle */}
        <div className="relative group cursor-pointer">
          <div 
            onClick={() => window.open('https://m.me/appfaquiz?ref=streak', '_blank')}
            className="cursor-pointer"
          >
            <FireLoading 
              firePoints={firePoints} 
              maxPoints={180}
              size="sm"
              showNumber={true}
            />
          </div>
          {/* Tooltip */}
          <div className="absolute top-full left-0 mt-2 p-3 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none cursor-pointer"
          style={{ 
            background: 'linear-gradient(to top, rgb(14, 4, 106),rgb(7, 1, 60))',
            minWidth: '250px',
            maxWidth: '320px',
            whiteSpace: 'normal',
            wordWrap: 'break-word'
          }}>
            Streak là chuỗi làm bài liên tục của bạn. Làm càng lâu streak càng cao.
            <br /><br />
            180 streak = 1 key
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent" style={{ borderBottomColor: 'rgb(7, 1, 60)' }}></div>
          </div>
        </div>
        
        {/* Key icon */}
        <div className="relative group cursor-pointer">
          <div 
            onClick={() => router.push('/shop')}
            className="flex items-center space-x-1 cursor-pointer"
          >
            <img 
              src="/logos/header/key.svg" 
              alt="Key" 
              className="w-6 h-6"
            />
            <span className="text-yellow-400 font-bold text-sm">
              {userBag?.key || 0}
            </span>
          </div>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{ 
            background: 'linear-gradient(to top, rgb(14, 4, 106),rgb(7, 1, 60))',
            minWidth: '250px',
            maxWidth: '320px',
            whiteSpace: 'normal',
            wordWrap: 'break-word'
          }}>
            Key dùng mua đồ trong cửa hàng và mở khóa tính năng, nội dung trong app FA Streak, FA Class.
            <br /><br />
            100k = 100 key = 1800 streak
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent" style={{ borderBottomColor: 'rgb(7, 1, 60)' }}></div>
          </div>
        </div>
      </div>

      {/* Center - Logo and Current Room Info */}
      <div className="flex justify-center w-1/3">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center mb-1">
            <img 
              src="/logos/logos.png" 
              alt="Battle Logo" 
              className="h-12 w-auto"
            />
          </Link>
        </div>
      </div>

      {/* Right side - Gift, Shop, Avatar icons and Login/User actions */}
      <div className="flex items-center justify-end space-x-6 w-1/3">
        
        {/* Gift icon with tooltip */}
        <div className="relative group flex items-center">
          <Link href="/gift" className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity flex items-center">
            <img 
              src="/logos/header/Gift.svg" 
              alt="Gift" 
              className="w-8 h-8"
            />
          </Link>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
          style={{ background: 'linear-gradient(to top, rgb(14, 4, 106),rgb(7, 1, 60)' }}>
            Nhiệm vụ
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent" style={{ borderBottomColor: 'rgb(7, 1, 60)' }}></div>
          </div>
        </div>
        
        {/* Shop icon with tooltip */}
        <div className="relative group flex items-center">
          <Link href="/shop" className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity flex items-center">
            <img 
              src="/logos/header/Shop.svg" 
              alt="Shop" 
              className="w-8 h-8"
            />
          </Link>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap"
          style={{ background: 'linear-gradient(to top, rgb(14, 4, 106),rgb(7, 1, 60)' }}>
            Cửa hàng
            {/* Arrow pointing up */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent" style={{ borderBottomColor: 'rgb(7, 1, 60)' }}></div>
          </div>
        </div>
        
        {/* Avatar with dropdown menu */}
        <div className="relative group flex items-center">
          <button className="cursor-pointer transition-opacity bg-white rounded-full flex items-center">
            {user && user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.fullName || user.username}
                className="w-8 h-8 rounded-full object-cover bg-gradient-to-t from-transparent to-white"
              />
            ) : (
              <img 
                src="/logos/header/avatar-default.svg" 
                alt="Avatar" 
                className="w-8 h-8"
              />
            )}
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl z-50 opacity-0 shadow-lg group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto"
          style={{ background: 'linear-gradient(to top, rgb(14, 4, 106),rgb(7, 1, 60))' }}
          >
            {/* Arrow pointing up */}
            <div className="absolute -top-2 right-4 w-4 h-4 transform rotate-45" style={{ background: ' rgb(7, 1, 60)'}}></div>
              
            <div className="py-2">
              {/* Thông tin */}
              <Link 
                href="/account" 
                className="flex items-center px-4 py-2 text-white opacity-100 hover:opacity-50 transition-all duration-20"
              >
                <span className="font-medium text-sm">Hồ sơ</span>
              </Link>

              {/* Nhạc nền */}
              <div className="flex items-center justify-between px-4 py-2 text-white opacity-100 hover:opacity-50 transition-all duration-20">
                <span className="font-medium text-sm">Nhạc nền</span>
                <button
                  onClick={handleBackgroundMusicToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isBackgroundMusicOn ? '' : 'bg-white bg-opacity-20'
                  }`}
                  style={{
                    backgroundColor: isBackgroundMusicOn ? '#41C911' : undefined
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isBackgroundMusicOn ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Hiệu ứng */}
              <div className="flex items-center justify-between px-4 py-2 text-white opacity-100 hover:opacity-50 transition-all duration-200">
                <span className="font-medium text-sm">Hiệu ứng</span>
                <button
                  onClick={handleSoundEffectsToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isSoundEffectsOn ? '' : 'bg-white bg-opacity-20'
                  }`}
                  style={{
                    backgroundColor: isSoundEffectsOn ? '#41C911' : undefined
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isSoundEffectsOn ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {/* Đăng xuất */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-white  opacity-50 hover:opacity-100 transition-all duration-200"
              >
                <span className="font-medium text-sm font-sans">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;