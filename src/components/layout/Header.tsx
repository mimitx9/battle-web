'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useFirePoints } from '@/hooks/useFirePoints';
import { QuizRoom } from '@/types';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user } = useAuth();
  const { firePoints } = useFirePoints();
  const router = useRouter();

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
        {/* Fire icon */}
        <div className="flex items-center space-x-2">
          <img 
            src="/logos/header/fire.svg" 
            alt="Fire" 
            className="w-6 h-6"
          />
          <span className="text-orange-400 font-semibold text-lg">{firePoints}</span>
        </div>
        
        {/* Key icon */}
        <div className="flex items-center space-x-2">
          <img 
            src="/logos/header/key.svg" 
            alt="Key" 
            className="w-6 h-6"
          />
          <span className="text-yellow-400 font-semibold text-lg">
            {userBag?.key || 0}
          </span>
        </div>
      </div>

      {/* Center - Logo and Current Room Info */}
      <div className="flex justify-center w-1/3">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center mb-1">
            <img 
              src="/logos/logos.svg" 
              alt="BAXLE Logo" 
              className="h-12 w-auto"
            />
          </Link>
        </div>
      </div>

      {/* Right side - Gift, Shop, Avatar icons and Login/User actions */}
      <div className="flex items-center justify-end space-x-8 w-1/3">
        
        {/* Gift icon */}
        <Link href="/gift" className="cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="/logos/header/Gift.svg" 
            alt="Gift" 
            className="w-7 h-7"
          />
        </Link>
        
        {/* Shop icon */}
        <Link href="/shop" className="cursor-pointer hover:opacity-80 transition-opacity">
          <img 
            src="/logos/header/Shop.svg" 
            alt="Shop" 
            className="w-8 h-8"
          />
        </Link>
        
        {/* Avatar - Show default avatar when not logged in, user avatar when logged in */}
        <Link href={user ? "/account" : "/login"} className="cursor-pointer hover:opacity-80 transition-opacity bg-white rounded-full">
          {user && user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.fullName || user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <img 
              src="/logos/header/avatar-default.svg" 
              alt="Avatar" 
              className="w-8 h-8"
            />
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;