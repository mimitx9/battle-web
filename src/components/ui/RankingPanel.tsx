'use client';

import React from 'react';

interface RankingEntry {
    userId: string;
    username: string;
    score: number;
    rank: number;
    avatar?: string;
}

interface RankingPanelProps {
  ranking: RankingEntry[];
  loading?: boolean;
  currentRoom?: string;
}

const RankingPanel: React.FC<RankingPanelProps> = ({ 
  ranking, 
  loading = false, 
  currentRoom 
}) => {
  if (loading) {
    return (
      <div className="rounded-lg p-4 h-full">
        <h3 className="text-white text-lg font-bold mb-4">Bảng xếp hạng</h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="rounded-lg p-4 h-full">
        <h3 className="text-white text-lg font-bold mb-4">Bảng xếp hạng</h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400 text-center">
            <p>Chưa tham gia room nào</p>
          </div>
        </div>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="rounded-lg p-4 h-full">
        <h3 className="text-white text-lg font-bold mb-4">Bảng xếp hạng</h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400 text-center">
            <p>Chưa có dữ liệu xếp hạng</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4 h-full">
      <h3 className="text-white text-lg font-bold mb-4">Bảng xếp hạng</h3>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {ranking.map((item, index) => (
          <div
            key={`${item.username}-${item.rank}`}
            className="flex items-center justify-between p-3 rounded-lg bg-white/10 hover:bg-white/15"
          >
            {/* Rank */}
            <div className="flex items-center space-x-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                ${item.rank === 1 ? 'bg-yellow-500 text-black' :
                  item.rank === 2 ? 'bg-gray-400 text-black' :
                  item.rank === 3 ? 'bg-orange-600 text-white' :
                  'bg-gray-600 text-white'
                }
              `}>
                {item.rank}
              </div>
              
              {/* Player name */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {item.username}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-400">
                {item.score}
              </div>
              <div className="text-xs text-gray-400">
                điểm
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Room info */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="text-xs text-gray-400 text-center">
          Room: {currentRoom}
        </div>
      </div>
    </div>
  );
};

export default RankingPanel;
