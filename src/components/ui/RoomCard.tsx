'use client';

import React from 'react';
import Image from 'next/image';
import { QuizRoom } from '@/types';

interface RoomCardProps {
  room: QuizRoom;
  isSelected?: boolean;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, isSelected = false, onClick }) => {
  const isFull = room.currentPlayers >= room.maxPlayers;
  const progressPercentage = (room.currentPlayers / room.maxPlayers) * 100;

  return (
    <div
      className={`
        relative rounded-2xl p-4 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'bg-white/10' 
          : 'bg-transparent hover:bg-white/10'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center space-x-5">
        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: room.categoryBackgroundColor }}
        >
          {room.categoryIcon ? (
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <Image
                src={room.categoryIcon}
                alt={room.categoryTitle}
                width={48}
                height={48}
                className="w-12 h-12 object-cover"
                style={{ 
                  objectPosition: 'center -13.5px',
                  transform: 'scale(1.5)',
                  transformOrigin: 'center center'
                }}
              />
            </div>
          ) : (
            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {room.categoryTitle.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-white font-medium text-xs mb-2.5 truncate">
            {room.categoryTitle}
          </h3>

          {/* Custom Progress Bar */}
          <div className="relative">
            {/* Progress Bar Container */}
            <div className="w-full h-3.5 rounded-full bg-white/10 relative overflow-hidden">
              {/* Filled Progress */}
              <div
                className="h-full rounded-full transition-all duration-300 bg-[#FFC11C]"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
              
              {/* Text overlay - always centered */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold tracking-widest">
                  {isFull ? 'FULL' : `${room.currentPlayers} / ${room.maxPlayers} SLOT`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RoomCard;
