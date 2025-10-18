'use client';

import React, { useState } from 'react';
import LoadingOverlay from './LoadingOverlay';

const LoadingDemo: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const simulateSubmit = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
        }, 5000); // 5 seconds
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Demo Loading Overlay
                </h1>
                
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Component này demo loading overlay khi submit quiz. 
                        Click button bên dưới để xem hiệu ứng loading.
                    </p>
                    
                    <button
                        onClick={simulateSubmit}
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Đang xử lý...' : 'Simulate Submit Quiz'}
                    </button>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Tính năng:</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                        <li>• Overlay toàn màn hình với background mờ</li>
                        <li>• Animation loading với spinner và dots</li>
                        <li>• Thông báo rõ ràng về việc AI đang chấm điểm</li>
                        <li>• Thông tin bổ sung để người dùng hiểu quá trình</li>
                        <li>• Responsive và đẹp mắt</li>
                    </ul>
                </div>
            </div>

            {/* Loading Overlay */}
            <LoadingOverlay
                isVisible={isLoading}
                message="Đang nộp bài thi..."
                subMessage="AI đang chấm điểm, vui lòng kiên nhẫn chờ đợi"
            />
        </div>
    );
};

export default LoadingDemo;
