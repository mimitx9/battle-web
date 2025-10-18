'use client';

import { useEffect, useState } from 'react';

interface UseProtectedAudioReturn {
    hasPlayedOnce: boolean;
    isPlaying: boolean;
    progress: number;
    currentTime: number;
    duration: number;
    handlePlay: () => void;
}

export function useProtectedAudio(
    audioRef: React.RefObject<HTMLAudioElement | null>,
    options: { src?: string; playOnce?: boolean } = {}
): UseProtectedAudioReturn {
    const { playOnce = true, src } = options;

    const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Reset trạng thái khi nguồn audio thay đổi
    useEffect(() => {
        console.log('🎵 Audio src changed:', src);
        setHasPlayedOnce(false);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);

        const audio = audioRef.current;
        if (audio && src) {
            audio.currentTime = 0;
            audio.load();

            // Force check duration sau khi load
            const checkDuration = setInterval(() => {
                if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                    console.log('🎵 Duration detected:', audio.duration);
                    setDuration(audio.duration);
                    clearInterval(checkDuration);
                }
            }, 100);

            // Cleanup sau 5 giây
            setTimeout(() => clearInterval(checkDuration), 5000);

            return () => clearInterval(checkDuration);
        }
    }, [src]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Load metadata để lấy duration
        const handleLoadedMetadata = () => {
            console.log('🎵 Audio metadata loaded, duration:', audio.duration);
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            setHasPlayedOnce(true);
            setIsPlaying(false);
            setProgress(100);
        };

        const handlePlayEvent = () => {
            console.log('🎵 Audio play event triggered');
            if (playOnce && hasPlayedOnce) {
                audio.pause();
                return;
            }
            setIsPlaying(true);
        };

        const handlePauseEvent = (e: Event) => {
            // Chặn pause khi đang phát (chỉ cho phép pause khi kết thúc)
            if (!hasPlayedOnce && audio.currentTime > 0 && audio.currentTime < audio.duration) {
                e.preventDefault();
                audio.play().catch(() => {
                    // Ignore autoplay errors
                });
            } else {
                setIsPlaying(false);
            }
        };

        const handleTimeUpdate = () => {
            const current = audio.currentTime;
            const total = audio.duration;

            setCurrentTime(current);

            if (total > 0) {
                const currentProgress = (current / total) * 100;
                setProgress(currentProgress);
                console.log(`🎵 Audio progress: ${currentProgress.toFixed(1)}% (${current.toFixed(1)}s/${total.toFixed(1)}s)`);
            }
        };

        // Chặn tua/seeking
        const handleSeeking = (e: Event) => {
            if (!hasPlayedOnce && audio.currentTime > 0) {
                e.preventDefault();
                const currentTime = audio.currentTime;
                setTimeout(() => {
                    audio.currentTime = currentTime;
                }, 0);
            }
        };

        // Chặn thay đổi tốc độ phát
        const handleRateChange = () => {
            if (!hasPlayedOnce && audio.playbackRate !== 1) {
                audio.playbackRate = 1;
            }
        };

        // Giữ âm lượng ở mức tối đa
        const handleVolumeChange = () => {
            if (audio.volume !== 1) {
                audio.volume = 1;
            }
        };

        // Chặn các phím tắt
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isPlaying && !hasPlayedOnce) {
                if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
                    e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('play', handlePlayEvent);
        audio.addEventListener('pause', handlePauseEvent);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('seeking', handleSeeking);
        audio.addEventListener('seeked', handleSeeking);
        audio.addEventListener('ratechange', handleRateChange);
        audio.addEventListener('volumechange', handleVolumeChange);
        document.addEventListener('keydown', handleKeyDown);

        // Trigger loadedmetadata if already loaded
        if (audio.readyState >= 1) {
            handleLoadedMetadata();
        }

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', handlePlayEvent);
            audio.removeEventListener('pause', handlePauseEvent);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('seeking', handleSeeking);
            audio.removeEventListener('seeked', handleSeeking);
            audio.removeEventListener('ratechange', handleRateChange);
            audio.removeEventListener('volumechange', handleVolumeChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [src]);

    const handlePlay = () => {
        if (audioRef.current && !hasPlayedOnce && !isPlaying) {
            audioRef.current.play().catch((error) => {
                console.error('Error playing audio:', error);
            });
        }
    };

    return { hasPlayedOnce, isPlaying, progress, currentTime, duration, handlePlay };
}