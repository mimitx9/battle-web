'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SaveNotificationProps {
    isVisible: boolean;
    message?: string;
}

const SaveNotification: React.FC<SaveNotificationProps> = ({ 
    isVisible, 
    message = "Đã lưu bài thành công!" 
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
            <div className="bg-green-500 text-white px-6 py-4 shadow-lg">
                <div className="flex items-center justify-center space-x-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{message}</span>
                </div>
            </div>
        </div>
    );
};

export default SaveNotification;
