'use client';

import React, { useState, useEffect } from 'react';

const NotificationSlider: React.FC = () => {
    const messages = [
        "Vui lòng kiểm tra micro, tai nghe/loa trước khi bấm nhận đề.",
        "Yêu cầu chụp hình khi thi chính thức, có thể bỏ qua khi thi thử.",
        "Một nụ cười tươi khi chụp hình sẽ giúp bạn thêm tự tin, giảm bớt áp lực."
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSliding, setIsSliding] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsSliding(true);
            setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % messages.length);
                setIsSliding(false);
            }, 500); // Thời gian slide
        }, 2000); // Thay đổi mỗi 2 giây

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center overflow-hidden">
                <p className={`text-blue-700 text-sm transition-transform duration-500 ease-in-out ${
                    isSliding ? 'translate-x-full' : 'translate-x-0'
                }`}>
                    {messages[currentIndex]}
                </p>
            </div>
        </div>
    );
};

export default NotificationSlider;
