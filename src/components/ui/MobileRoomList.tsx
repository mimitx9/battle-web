'use client';

import React, { useState } from 'react';
import { QuizRoom } from '@/types';
import RoomCard from './RoomCard';

interface MobileRoomListProps {
  rooms: QuizRoom[];
  currentRoom?: QuizRoom | null;
  onRoomClick?: (room: QuizRoom) => void;
}

const MobileRoomList: React.FC<MobileRoomListProps> = ({ rooms, currentRoom, onRoomClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isHoveringContent, setIsHoveringContent] = useState(false);

  // Sắp xếp rooms: room đang join lên đầu
  const sortedRooms = React.useMemo(() => {
    if (!currentRoom) return rooms;
    
    const currentRoomIndex = rooms.findIndex(room => room.roomCode === currentRoom.roomCode);
    if (currentRoomIndex === -1) return rooms;
    
    const currentRoomItem = rooms[currentRoomIndex];
    const otherRooms = rooms.filter((_, index) => index !== currentRoomIndex);
    
    return [currentRoomItem, ...otherRooms];
  }, [rooms, currentRoom]);

  // Lọc rooms theo search term
  const filteredRooms = sortedRooms.filter(room =>
    room.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.categoryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.roomCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col relative pt-16 min-h-0 overflow-hidden">
      {/* Gradient Overlay */}
      <div 
        className={`absolute inset-0 z-40 transition-opacity duration-300 pointer-events-none ${
          (isSearchFocused || isHoveringContent) ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background: 'linear-gradient(to top, rgb(4, 0, 42),  rgba(4, 0, 42, 0.98), rgba(4, 0, 42, 0))'
        }}
      />

      <div className="flex-1 min-h-0 flex flex-col relative z-30">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Tìm phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onMouseEnter={() => setIsSearchFocused(true)}
              onMouseLeave={() => setIsSearchFocused(false)}
              className="bg-transparent text-white placeholder-white/40 px-6 py-4 text-md focus:outline-none border-0 border-b-2 border-white/10 focus:border-white/10 w-full"
            />
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
              width="20"
              height="20"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.5306 11.5247C11.7901 11.2636 11.7893 10.8417 11.529 10.5815L10.1235 9.17686C10.8915 8.2158 11.3523 6.99444 11.3523 5.67297C11.3523 2.54283 8.80801 0 5.67613 0C2.54424 0 0 2.54283 0 5.67297C0 8.80311 2.54424 11.3459 5.67613 11.3459C6.99833 11.3459 8.22037 10.8854 9.18197 10.1246L10.5846 11.5264C10.846 11.7877 11.2701 11.787 11.5306 11.5247ZM5.67613 10.0111C3.28548 10.0111 1.33556 8.06229 1.33556 5.67297C1.33556 3.28365 3.28548 1.33482 5.67613 1.33482C8.06678 1.33482 10.0167 3.28365 10.0167 5.67297C10.0167 8.06229 8.06678 10.0111 5.67613 10.0111Z"
                fill="white"
                fillOpacity="0.2"
              />
            </svg>
          </div>
        </div>

        {/* Room List */}
        <div 
          className="flex-1 space-y-4 py-6 min-h-0 max-h-[calc(100vh-100px)] overflow-y-auto touch-pan-y scrollbar-dark overscroll-y-auto"
          onMouseEnter={() => setIsHoveringContent(true)}
          onMouseLeave={() => setIsHoveringContent(false)}
        >
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <RoomCard
                key={room.roomCode || room.categoryCode}
                room={room}
                isSelected={currentRoom?.roomCode === room.roomCode}
                onClick={() => onRoomClick?.(room)}
              />
            ))
          ) : (
            <div className="text-center text-white/40 py-8">
              <p>Không tìm thấy room</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileRoomList;

