'use client';

import React, { useState, useEffect } from 'react';
import LayoutContent from '@/components/layout/LayoutContent';
import Image from 'next/image';

const ShopPage: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 phút tính bằng giây

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const shopItems = [
    {
      id: 1,
      icon: '/logos/battle/idea.svg',
      title: 'GỢI Ý ĐÁP ÁN',
      description: '5 lượt',
      price: 5,
      gradient: 'linear-gradient(135deg, #FFD406 0%, #FF8C00 100%)'
    },
    {
      id: 2,
      icon: '/logos/battle/snowflake.svg',
      title: 'ĐÓNG BĂNG ĐIỂM',
      description: '1 lượt',
      price: 10,
      gradient: 'linear-gradient(135deg, #644EFD 0%, #0A0158 100%)'
    },
    {
      id: 3,
      icon: '/logos/battle/Ellipse 128.svg',
      title: 'CHẶN ĐIỂM TOP TRÊN',
      description: '1 lượt',
      price: 10,
      gradient: 'linear-gradient(135deg, #E05B00 0%, #250000 100%)'
    }
  ];


  return (
      <LayoutContent>
        <div
            className="min-h-screen pt-20 pb-8 px-4"
            style={{
              background: 'linear-gradient(135deg, #04002A 0%, #1a0033 50%, #04002A 100%)'
            }}
        >
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Banner khuyến mãi */}
            <div className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    x2 key khi mua lần đầu
                  </h2>
                  <div className="text-2xl font-bold text-white mb-6">
                    <span className="text-yellow-400">100k</span>
                    <span className="mx-3 text-gray-400">~</span>
                    <span className="line-through text-gray-500">400</span>
                    <span className="text-white ml-3">200 key</span>
                  </div>

                  <div className="text-gray-300 text-lg mb-6">
                    Còn {formatTime(timeLeft)} phút
                  </div>

                  <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold py-3 px-8 rounded-full hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 shadow-lg text-lg">
                    100K
                  </button>
                </div>

                <div className="flex-shrink-0 ml-8">
                  <Image src="/logos/header/key.svg" alt="Key" width={120} height={120} />
                </div>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center space-x-3">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            </div>

            {/* Shop items */}
            <div className="grid grid-cols-3 gap-6">
              {shopItems.map((item) => (
                  <div
                      key={item.id}
                      className="bg-gradient-to-b from-slate-700 to-slate-900 rounded-2xl p-6 text-center border border-slate-600 hover:border-slate-500 transition-all duration-200 relative overflow-hidden"
                  >
                    <div className="w-28 h-28 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg" style={{ background: item.gradient }}>
                      <Image src={item.icon} alt={item.title} width={56} height={56} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-300 mb-4">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-center mb-6">
                      <Image src="/logos/header/key.svg" alt="Key" width={24} height={24} />
                      <span className="text-white font-bold ml-2 text-lg">{item.price}</span>
                    </div>
                    <button className="w-16 h-16 mx-auto rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg" style={{ background: 'linear-gradient(135deg, #FFD406 0%, #FF8C00 100%)' }}>
                      <Image src="/logos/battle/shopping.svg" alt="Shopping" width={24} height={24} />
                    </button>
                  </div>
              ))}
            </div>

            {/* Success Banner */}
            <div className="mt-8 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 flex items-center justify-between border border-green-500">
              <div className="text-white font-semibold text-lg">
                Mua thành công! Vô tài khoản coi số lượt nha
              </div>
              <button className="bg-green-500 hover:bg-green-400 rounded-full p-3 transition-colors duration-200 flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </LayoutContent>
  );
};

export default ShopPage;