'use client';

import React from 'react';

interface AudioPlayerProps {
    isPlaying?: boolean;
    hasPlayedOnce?: boolean;
    progressPercent?: number; // 0-100
    currentTimeLabel?: string; // e.g. "00:08"
    totalTimeLabel?: string;   // e.g. "02:15"
    onPlayClick?: () => void;
    disabled?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    isPlaying = false,
    hasPlayedOnce = false,
    progressPercent = 0,
    currentTimeLabel = '00:00',
    totalTimeLabel = '00:00',
    onPlayClick,
    disabled = false
}) => {
    const percent = Number.isFinite(progressPercent) ? Math.max(0, Math.min(100, progressPercent)) : 0;

    return (
        <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-4">
            <button
                type="button"
                onClick={onPlayClick}
                disabled={disabled || hasPlayedOnce}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    disabled || hasPlayedOnce
                        ? 'bg-gray-300 text-white cursor-not-allowed'
                        : 'text-white hover:opacity-90'
                }`}
                style={{
                    backgroundColor: (disabled || hasPlayedOnce) ? undefined : '#FFBA08'
                }}
                aria-label={hasPlayedOnce ? 'Đã phát xong' : isPlaying ? 'Đang phát' : 'Phát audio'}
            >
                {isPlaying ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="h-2 bg-gray-200 rounded-xl overflow-hidden">
                    <div
                        className={`h-full ${hasPlayedOnce ? 'bg-green-500' : ''}`}
                        style={{ 
                            width: `${percent}%`,
                            backgroundColor: hasPlayedOnce ? undefined : '#FFBA08'
                        }}
                    />
                </div>
            </div>

            <div className="text-sm tabular-nums text-gray-600 text-right">
                {currentTimeLabel || '00:00'}
            </div>
            <div className="text-sm tabular-nums text-gray-400">/</div>
            <div className="text-sm tabular-nums text-gray-600">
                {totalTimeLabel || '00:00'}
            </div>
        </div>
    );
};

export default AudioPlayer;


