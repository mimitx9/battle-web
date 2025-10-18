'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface AttemptLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAttempts: number;
    maxAttempts: number;
    titleOverride?: string;
    descriptionOverride?: string;
}

const AttemptLimitModal: React.FC<AttemptLimitModalProps> = ({
    isOpen,
    onClose,
    currentAttempts,
    maxAttempts,
    titleOverride,
    descriptionOverride
}) => {
    const router = useRouter();

    const handleUpgrade = () => {
        onClose();
        router.push('/subscription');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full px-8 py-12">
                <div className="text-center">
                    {/* Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6">
                        <Image
                            src="/logos/android-chrome-512x512.png"
                            alt="Out of attempts"
                            width={56}
                            height={56}
                            className="h-16 w-16"
                            priority
                        />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {titleOverride || 'Đã hết lượt miễn phí'}
                    </h3>

                    {/* Description */}
                    <div className="text-md text-gray-600 mb-6">
                        <p>
                            {descriptionOverride || 'Nâng cấp gói PRO để làm đề không giới hạn'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handleUpgrade}
                            className="w-full h-12 sm:h-14 rounded-full text-white text-sm sm:text-base font-semibold transition-colors"
                            style={{ backgroundColor: '#FFBA08' }}
                        >
                            NÂNG CẤP PRO
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttemptLimitModal;
