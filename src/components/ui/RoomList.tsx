'use client';

import React, { useState } from 'react';
import { QuizRoom } from '@/types';
import RoomCard from './RoomCard';

interface RoomListProps {
  rooms: QuizRoom[];
  onRoomClick?: (room: QuizRoom) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onRoomClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc rooms theo search term
  const filteredRooms = rooms.filter(room =>
    room.categoryTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-white text-xl font-bold">Giải</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 text-white placeholder-gray-400 px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <svg
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <RoomCard
              key={room.roomCode || room.categoryCode}
              room={room}
              isSelected={false}
              onClick={() => onRoomClick?.(room)}
            />
          ))
        ) : (
          <div className="text-center text-gray-400 py-8">
            <p>Không tìm thấy room nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomList;
