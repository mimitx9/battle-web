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
        relative rounded-lg p-4 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'bg-white/20 shadow-lg ring-2 ring-blue-400' 
          : 'bg-white/10 hover:bg-white/15'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: room.categoryBackgroundColor }}
        >
          {room.categoryIcon ? (
            <Image
              src={room.categoryIcon}
              alt={room.categoryTitle}
              width={24}
              height={24}
              className="w-6 h-6"
            />
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
          <h3 className="text-white font-medium text-sm mb-2 truncate">
            {room.categoryTitle}
          </h3>

          {/* Custom Progress Bar */}
          <div className="relative">
            {/* Progress Bar Container */}
            <div className="w-full h-6 rounded-full bg-[#4A4D60] relative overflow-hidden">
              {/* Filled Progress */}
              <div
                className="h-full rounded-full transition-all duration-300 bg-[#FFC11C]"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
              
              {/* Text overlay - always centered */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {isFull ? 'FULL' : `${room.currentPlayers}/${room.maxPlayers} SLOT`}
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
