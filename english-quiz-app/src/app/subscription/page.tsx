'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Logo paths from public folder
const logos = [
    '/logos/logo1.svg',
    '/logos/logo2.svg',
    '/logos/logo3.svg',
    '/logos/logo4.svg',
    '/logos/logo5.svg',
    '/logos/logo6.svg'
];

type LocalPlan = {
    id: 'basic' | 'premium' | 'vip';
    name: string;
    priceText: string;
    features: string[];
    theme: 'light' | 'dark';
};

const LOCAL_PLANS: LocalPlan[] = [
    {
        id: 'basic',
        name: 'Free',
        priceText: 'Miễn phí',
        features: ['1 lượt làm đề', '1 lượt chấm đề', '1 lượt chữa đề bằng AI'],
        theme: 'light'
    },
    {
        id: 'premium',
        name: 'Pro',
        priceText: '699k/tháng',
        features: ['Không giới hạn đề', 'Không giới hạn chấm', 'Không giới hạn AI chữa'],
        theme: 'dark'
    },
    {
        id: 'vip',
        name: 'Max',
        priceText: '899k/3 tháng',
        features: ['Không giới hạn đề', 'Không giới hạn chấm', 'Giảng viên Streak chữa'],
        theme: 'dark'
    }
];

const SubscriptionPage = () => {
    const router = useRouter();

    const handleSelectPlan = (planId: LocalPlan['id']) => {
        if (planId === 'basic') {
            router.push('/waiting-room');
            return;
        }

        const messengerLinks = {
            basic: 'https://m.me/appfastreak?ref=vstep1',
            premium: 'https://m.me/appfastreak?ref=vstep2',
            vip: 'https://m.me/appfastreak?ref=vstep3'
        } as const;
        const link = messengerLinks[planId];
        if (link) window.open(link, '_blank');
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
                {/* Hero */}
                <div className="text-center mb-16 sm:mb-20">
                    <h2 className="text-3xl sm:text-4xl font-medium text-black mb-6">
                        Làm đề không giới hạn
                    </h2>
                    <p className="text-base text-black/50">
                        Đặc quyền của các gói Pro
                    </p>
                </div>

                {/* Pricing cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto">
                    {LOCAL_PLANS.map((plan) => {
                        const isDark = plan.theme === 'dark';
                        return (
                            <div
                                key={plan.id}
                                className={
                                    isDark
                                        ? 'rounded-3xl bg-black text-white p-8 sm:p-10 shadow-lg flex flex-col min-h-[500px]'
                                        : 'rounded-3xl border border-gray-200 bg-white p-8 sm:p-10 shadow-sm flex flex-col min-h-[500px]'
                                }
                            >
                                <div className={isDark ? 'font-medium text-lg' : 'text-black font-medium text-lg'} style={{ color: isDark ? '#FFBA08' : undefined }}>
                                    {plan.name}
                                </div>
                                <div className={isDark ? 'text-3xl sm:text-4xl font-semibold mt-4' : 'text-3xl sm:text-4xl font-semibold mt-4'}>
                                    {plan.priceText}
                                </div>
                                <ul className="mt-8 space-y-4 flex-grow">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-3">
                                            <svg
                                                className="flex-shrink-0 mt-0.5"
                                                style={{ color: '#FFBA08' }}
                                                width="20"
                                                height="20"
                                                viewBox="0 0 20 20"
                                                fill="none"
                                            >
                                                <path
                                                    d="M16.6667 5L7.50004 14.1667L3.33337 10"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                            <span className={isDark ? 'text-white text-sm sm:text-base' : 'text-black/70 text-sm sm:text-base'}>
                        {f}
                      </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-10">
                                    <button
                                        className="w-full h-12 sm:h-14 rounded-full text-white text-sm sm:text-base font-semibold transition-colors"
                                        style={{ backgroundColor: '#FFBA08' }}
                                        onClick={() => handleSelectPlan(plan.id)}
                                    >
                                        {plan.id === 'basic' ? 'Thi thử' : 'Nâng Pro'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Logos section */}
                <div className="mt-24 sm:mt-32">
                    <p className="text-center text-black/60 text-sm sm:text-base">
                        Tổng hợp các đề mới nhất đến từ các trường
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center items-center gap-6 sm:gap-8 lg:gap-12">
                        {logos.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt={`logo-${i+1}`}
                                className="h-16 sm:h-24 w-auto object-contain"
                            />
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-32 sm:mt-40 text-center">
                    <h3 className="text-2xl sm:text-3xl font-semibold">Câu hỏi thường gặp</h3>
                    <p className="text-gray-500 mt-3 text-sm sm:text-base">
                        Cần tư vấn thêm?{' '}
                        <a
                            className="hover:underline font-medium"
                            style={{ color: '#FFBA08' }}
                            href="https://m.me/appfastreak"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Liên hệ ngay
                        </a>
                    </p>

                    <div className="mt-8 sm:mt-10 max-w-2xl mx-auto text-left divide-y divide-gray-200">
                        {[
                            {
                                q: 'FA Streak có lừa đảo không?',
                                a: 'Có chứ, Đọc review trên GG Play hoặc Appstore để biết tụi mình đã lừa được bao người thi đậu nha. Hẹ hẹ'
                            },
                            { q: 'Bao giờ tài khoản của tôi được kích hoạt?', a: 'Ngay sau khi xác nhận thanh toán trên page FA Streak' },
                            { q: 'Nếu bị lỗi thanh toán phải làm sao?', a: 'Bạn nhắn ngay cho page FA Streak, đội ngũ sẽ hỗ trợ trong tíc tắc.' },
                            { q: 'AI chữa đề là như thế nào?', a: 'Là con Streak sa sả sẽ vừa chửi vừa phân tích bài làm và gợi ý cách sửa chi tiết cho bạn' },
                            { q: 'Giảng viên chữa đề là ra sao?', a: 'Gói Max có giảng viên của Streak chữa thủ công 1-1, phản hồi chi tiết bài làm siêu kĩ cho bạn, nói chung là hết nước chấm' },
                            { q: 'Khi gặp vấn đề tôi cần liên hệ đến ai?', a: 'Fanpage FA Streak luôn trực 24/7. Bấm liên hệ nhắn tin trực tiếp nha' }
                        ].map(({ q, a }) => (
                            <details key={q} className="py-4 sm:py-5 group">
                                <summary className="cursor-pointer list-none flex items-center justify-between text-left font-medium text-sm sm:text-base">
                                    <span>{q}</span>
                                    <svg
                                        className="flex-shrink-0 ml-4 transform transition-transform group-open:rotate-180"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                    >
                                        <path
                                            d="M5 7.5L10 12.5L15 7.5"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </summary>
                                <p className="mt-3 text-black/60 text-xs sm:text-sm pr-6">{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;