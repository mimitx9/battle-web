'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FireLoading from '@/components/ui/FireLoading';
import { useAuth } from '@/hooks/useAuth';
import { useFirePoints } from '@/hooks/useFirePoints';
import { QuizRoom } from '@/types';
import { startBackgroundMusic, stopBackgroundMusic, setBackgroundMusicEnabled, setSoundEnabled, isBackgroundMusicEnabled, isSoundEnabled } from '@/lib/soundUtils';

interface MobileHeaderProps {
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

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  currentRoom, 
  wsConnected = false, 
  roomWsConnected = false,
  userBag
}) => {
  const [isBackgroundMusicOn, setIsBackgroundMusicOn] = useState(false);
  const [isSoundEffectsOn, setIsSoundEffectsOn] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useAuth();
  const { firePoints } = useFirePoints();
  const router = useRouter();

  // Initialize sound settings
  useEffect(() => {
    setIsBackgroundMusicOn(isBackgroundMusicEnabled());
    setIsSoundEffectsOn(isSoundEnabled());
    
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
    setShowMenu(false);
  };

  return (
    <header className="h-16 flex items-center px-4 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#04002A' }}>
      {/* Left side - Fire and Key icons */}
      <div className="flex items-center space-x-3 flex-1">
        {/* Fire icon */}
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
        
        {/* Key icon */}
        <div 
          onClick={() => router.push('/shop')}
          className="flex items-center space-x-1 cursor-pointer"
        >
          <img 
            src="/logos/header/key.svg" 
            alt="Key" 
            className="w-5 h-5"
          />
          <span className="text-yellow-400 font-bold text-base">
            {userBag?.key || 0}
          </span>
        </div>

        {/* Connection status */}
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
      </div>

      {/* Center - Logo */}
      <div className="flex justify-center flex-1">
        <Link href="/mobile" className="flex items-center">
          <img 
            src="/logos/logos.png" 
            alt="Battle Logo" 
            className="h-10 w-auto"
          />
        </Link>
      </div>

      {/* Right side - Menu button */}
      <div className="flex items-center justify-end flex-1">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="relative"
        >
          {user && user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.fullName || user.username}
              className="w-8 h-8 rounded-full object-cover border-2 border-yellow-400"
            />
          ) : (
            <img 
              src="/logos/header/avatar-default.svg" 
              alt="Avatar" 
              className="w-8 h-8"
            />
          )}
        </button>

        {/* Mobile Menu Dropdown */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <div className="fixed top-16 right-4 w-64 rounded-xl z-50 shadow-lg"
              style={{ background: 'linear-gradient(to top, rgb(14, 4, 106),rgb(7, 1, 60))' }}
            >
              <div className="py-2">
                {/* Thông tin */}
                <Link 
                  href="/account" 
                  onClick={() => setShowMenu(false)}
                  className="flex items-center px-4 py-3 text-white opacity-100 hover:opacity-50 transition-all"
                >
                  <span className="font-medium text-sm">Hồ sơ</span>
                </Link>

                {/* Gift */}
                <Link 
                  href="/gift" 
                  onClick={() => setShowMenu(false)}
                  className="flex items-center px-4 py-3 text-white opacity-100 hover:opacity-50 transition-all"
                >
                  <span className="font-medium text-sm">Nhiệm vụ</span>
                </Link>

                {/* Shop */}
                <Link 
                  href="/shop" 
                  onClick={() => setShowMenu(false)}
                  className="flex items-center px-4 py-3 text-white opacity-100 hover:opacity-50 transition-all"
                >
                  <span className="font-medium text-sm">Cửa hàng</span>
                </Link>

                {/* Divider */}
                <div className="border-t border-white/20 my-2" />

                {/* Nhạc nền */}
                <div className="flex items-center justify-between px-4 py-3 text-white">
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
                <div className="flex items-center justify-between px-4 py-3 text-white">
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

                {/* Desktop version link */}
                <Link 
                  href="/" 
                  onClick={() => setShowMenu(false)}
                  className="flex items-center px-4 py-3 text-white opacity-100 hover:opacity-50 transition-all"
                >
                  <span className="font-medium text-sm">Phiên bản Desktop</span>
                </Link>

                {/* Divider */}
                <div className="border-t border-white/20 my-2" />

                {/* Đăng xuất */}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-white opacity-50 hover:opacity-100 transition-all"
                >
                  <span className="font-medium text-sm font-sans">Đăng xuất</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;

