'use client';

import React, { useRef, useEffect, useState } from 'react';

interface QuestionAudioPlayerProps {
    src: string;
    className?: string;
}

const QuestionAudioPlayer: React.FC<QuestionAudioPlayerProps> = ({ 
    src, 
    className = '' 
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeking, setIsSeeking] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            if (!isSeeking) {
                setCurrentTime(audio.currentTime);
            }
        };

        const handlePlay = () => {
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        const handleSeeking = () => {
            setIsSeeking(true);
        };

        const handleSeeked = () => {
            setIsSeeking(false);
            setCurrentTime(audio.currentTime);
        };

        const handleLoadStart = () => {
            setIsLoading(true);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('seeking', handleSeeking);
        audio.addEventListener('seeked', handleSeeked);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('seeking', handleSeeking);
            audio.removeEventListener('seeked', handleSeeked);
        };
    }, [src, isSeeking]);

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handlePlayClick = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play().catch(console.error);
        }
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const percent = (clickX / width) * 100;
        const newTime = (percent / 100) * duration;
        
        // Set seeking state to prevent time update conflicts
        setIsSeeking(true);
        setCurrentTime(newTime);
        
        // Set audio time
        audio.currentTime = newTime;
        
        // Reset seeking state after a short delay
        setTimeout(() => {
            setIsSeeking(false);
        }, 100);
    };

    return (
        <div className={`w-full bg-white rounded-3xl border-2 border-gray-100 px-4 py-3 flex items-center gap-4 ${className}`}>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                style={{ display: 'none' }}
                controlsList="nodownload noplaybackrate noremoteplayback"
            />
            
            <button
                type="button"
                onClick={handlePlayClick}
                disabled={isLoading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                    isLoading
                        ? 'bg-gray-300 text-white cursor-not-allowed'
                        : 'text-white hover:opacity-90'
                }`}
                style={{
                    backgroundColor: isLoading ? undefined : '#FFBA08'
                }}
                aria-label={isLoading ? 'Đang tải...' : isPlaying ? 'Tạm dừng' : 'Phát audio'}
            >
                {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                ) : isPlaying ? (
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
                <div 
                    className="h-2 bg-gray-200 rounded-xl overflow-hidden cursor-pointer"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-yellow-400 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="text-sm tabular-nums text-gray-600 text-right">
                {formatTime(currentTime)}
            </div>
            <div className="text-sm tabular-nums text-gray-400">/</div>
            <div className="text-sm tabular-nums text-gray-600">
                {formatTime(duration)}
            </div>
        </div>
    );
};

export default QuestionAudioPlayer;
