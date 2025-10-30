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
  onOpenRooms?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  currentRoom, 
  wsConnected = false, 
  roomWsConnected = false,
  userBag,
  onOpenRooms
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
      {/* Left - Avatar/Menu */}
      <div className="flex items-center w-1/3">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="relative"
        >
          {user && user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.fullName || user.username}
              className="w-8 h-8 rounded-full object-cover cursor-pointer transition-opacity bg-white"
            />
          ) : (
            <img 
              src="/logos/header/avatar-default.svg" 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover cursor-pointer transition-opacity bg-gradient-to-t from-transparent to-white"
            />
          )}
        </button>
      </div>

      {/* Center - Logo */}
      <div className="flex items-center justify-center w-1/3">
        <Link href="/mobile" className="flex items-center">
          <img 
            src="/logos/logos.png" 
            alt="Battle Logo" 
            className="h-10 w-auto"
          />
        </Link>
      </div>

      {/* Right - Search */}
      <div className="flex items-center justify-end w-1/3">
        <button
          aria-label="Search Rooms"
          onClick={() => {
            if (onOpenRooms) onOpenRooms();
          }}
          className="relative w-10 h-10 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5"
            width="20"
            height="20"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.5306 11.5247C11.7901 11.2636 11.7893 10.8417 11.529 10.5815L10.1235 9.17686C10.8915 8.2158 11.3523 6.99444 11.3523 5.67297C11.3523 2.54283 8.80801 0 5.67613 0C2.54424 0 0 2.54283 0 5.67297C0 8.80311 2.54424 11.3459 5.67613 11.3459C6.99833 11.3459 8.22037 10.8854 9.18197 10.1246L10.5846 11.5264C10.846 11.7877 11.2701 11.787 11.5306 11.5247ZM5.67613 10.0111C3.28548 10.0111 1.33556 8.06229 1.33556 5.67297C1.33556 3.28365 3.28548 1.33482 5.67613 1.33482C8.06678 1.33482 10.0167 3.28365 10.0167 5.67297C10.0167 8.06229 8.06678 10.0111 5.67613 10.0111Z"
              fill="white"
              fillOpacity="0.3"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="fixed top-16 left-4 right-4 rounded-xl z-50 shadow-lg"
            style={{ background: 'linear-gradient(to top, rgb(14, 4, 106),rgb(7, 1, 60))' }}
          >
            <div className="py-2">
              {/* Fire + Key summary */}
              <div className="flex items-center justify-between px-4 py-3">
                <div 
                  onClick={() => window.open('https://m.me/appfaquiz?ref=streak', '_blank')}
                  className="cursor-pointer"
                >
                  <FireLoading 
                    firePoints={firePoints} 
                    maxPoints={180}
                    size="sm"
                    numberClassName="text-lg"
                    showNumber={true}
                  />
                </div>
                <button 
                  onClick={() => { setShowMenu(false); router.push('/shop'); }}
                  className="flex items-center space-x-2"
                >
                  <img 
                    src="/logos/header/key.svg" 
                    alt="Key" 
                    className="w-6 h-6"
                  />
                  <span className="text-yellow-400 text-xl">
                    {userBag?.key || 0}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 my-2" />

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
              <div className="border-t border-white/10 my-2" />

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
              <div className="border-t border-white/10 my-2" />

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
    </header>
  );
};

export default MobileHeader;

