'use client';

import React from 'react';
import LayoutContent from '@/components/layout/LayoutContent';

const GiftPage: React.FC = () => {
  return (
    <LayoutContent>
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ backgroundColor: '#04002A' }}>
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Nhiệm vụ
          </h1>
          <p className="text-gray-500 mb-8">
            Sắp ra mắt...
          </p>
        </div>
      </div>
    </LayoutContent>
  );
};

export default GiftPage;
