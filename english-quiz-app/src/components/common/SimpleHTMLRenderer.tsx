'use client';

import React from 'react';

interface SimpleHTMLRendererProps {
    html: string;
    className?: string;
}

const SimpleHTMLRenderer: React.FC<SimpleHTMLRendererProps> = ({ html, className }) => {
    // Tạo một DOM element tạm thời để xử lý HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Tìm tất cả thẻ img và thêm các thuộc tính tối ưu
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        
        // Thêm error handler để tránh loading liên tục
        img.addEventListener('error', (e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            console.warn('Failed to load image:', target.src);
        });

        // Thêm load handler
        img.addEventListener('load', () => {
            console.log('Image loaded successfully:', img.src);
        });
    });

    return (
        <div 
            className={className}
            dangerouslySetInnerHTML={{ __html: tempDiv.innerHTML }}
        />
    );
};

export default SimpleHTMLRenderer;
