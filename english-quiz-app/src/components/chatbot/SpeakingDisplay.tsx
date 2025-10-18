'use client';

import React, {useMemo, useRef} from 'react';
import AudioPlayer from '@/components/common/AudioPlayer';
import {useProtectedAudio} from '@/hooks/useProtectedAudio';

interface SpeakingDisplayProps {
    speakingTasks: any[];
    className?: string;
}

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const s = Math.floor(seconds % 60)
        .toString()
        .padStart(2, '0');
    return `${m}:${s}`;
};

// New: child component to avoid calling hooks inside array map
const SpeakingTask: React.FC<{ task: any }> = ({task}) => {
    const audioUrl: string | undefined = useMemo(() => {
        const url = task?.userAnswer || task?.audioUrl;
        if (typeof url === 'string' && /^(https?:)?\/.+/.test(url)) return url;
        return undefined;
    }, [task]);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const {hasPlayedOnce, isPlaying, progress, currentTime, duration, handlePlay} = useProtectedAudio(
        audioRef as React.RefObject<HTMLAudioElement | null>,
        {playOnce: true, src: audioUrl}
    );

    return (
        <div className="bg-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-600">Part {task.taskNumber}</h3>
            </div>
            <div className="mb-4">
                <div className="">
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{__html: task.questionText}}/>
                </div>
            </div>

            {/* Audio answer */}
            <div className="mb-4">
                <div className="mt-5">
                    {audioUrl ? (
                        <>
                            <audio ref={audioRef} src={audioUrl} preload="metadata" hidden/>
                            <AudioPlayer
                                isPlaying={isPlaying}
                                hasPlayedOnce={hasPlayedOnce}
                                progressPercent={progress}
                                currentTimeLabel={formatTime(currentTime)}
                                totalTimeLabel={formatTime(duration)}
                                onPlayClick={handlePlay}
                            />
                        </>
                    ) : (
                        <div className="p-6 bg-gray-100 rounded-2xl mt-8 mb-16">
                            <div className="whitespace-pre-wrap text-sm text-gray-600">
                                {task.transcript || task.userAnswer || 'Chưa có bài làm'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SpeakingDisplay: React.FC<SpeakingDisplayProps> = ({speakingTasks, className = ''}) => {
    return (
        <div className={` flex flex-col h-full ${className}`}>
            <div className="flex-1 overflow-y-auto p-6">
                <div>
                    <div className="mb-6">
                        <h2 className="text-3xl font-semibold text-gray-200 mb-2">Speaking</h2>
                    </div>
                    {speakingTasks.length > 0 ? (
                        <div className="space-y-6">
                            {speakingTasks.map((task: any, index: number) => (
                                <SpeakingTask key={index} task={task}/>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Không có dữ liệu speaking để hiển thị</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpeakingDisplay;
