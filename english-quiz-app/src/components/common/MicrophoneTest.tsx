'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AudioVisualizer } from 'react-audio-visualize';

interface MicrophoneTestProps {
    onRecordingStart: () => void;
    onRecordingStop: () => void;
    isRecording: boolean;
    recordingBlob: Blob | null;
    countdownSeconds: number;
    showCountdown: boolean;
}

const MicrophoneTest: React.FC<MicrophoneTestProps> = ({
    onRecordingStart,
    onRecordingStop,
    isRecording,
    recordingBlob,
    countdownSeconds,
    showCountdown
}) => {
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [audioLevels, setAudioLevels] = useState<number[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastCountdownRef = useRef<number | null>(null);

    // Khởi tạo microphone và audio context
    useEffect(() => {
        const initMicrophone = async () => {
            try {
                console.log('🎤 Đang yêu cầu quyền truy cập microphone...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        channelCount: 1,
                        sampleRate: 48000
                    }
                });

                console.log('🎤 Đã có quyền truy cập microphone');
                setMediaStream(stream);

                // Tạo AudioContext để phân tích audio
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                
                // Đảm bảo AudioContext không bị suspend
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);

                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.3; // Giảm smoothing để phản ứng nhanh hơn
                analyser.minDecibels = -90;
                analyser.maxDecibels = -10;
                source.connect(analyser);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                setIsInitialized(true);

                console.log('🎤 AudioContext đã được khởi tạo, bắt đầu phân tích audio');

                // Bắt đầu phân tích audio levels
                updateAudioLevels();

            } catch (error) {
                console.error('❌ Không thể truy cập microphone:', error);
                setIsInitialized(false);
            }
        };

        initMicrophone();

        return () => {
            console.log('🧹 Dọn dẹp microphone và audio context');
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => {
                    track.stop();
                    console.log('🛑 Đã dừng track:', track.kind);
                });
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Cập nhật audio levels liên tục
    const updateAudioLevels = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Chuyển đổi thành mảng số cho visualization
        const levels = Array.from(dataArray).map(value => value / 255);
        
        // Debug (disabled by default): bật lại nếu cần điều tra âm lượng
        // if (Math.random() < 0.002) { // ~1/500 chance
        //     const maxLevel = Math.max(...levels);
        //     const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
        //     console.log(`🎤 Audio levels - Max: ${maxLevel.toFixed(3)}, Avg: ${avgLevel.toFixed(3)}`);
        // }
        
        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    };

    // Theo dõi trạng thái countdown để chỉ start khi chuyển từ >0 về 0
    useEffect(() => {
        if (!showCountdown) {
            lastCountdownRef.current = null;
            return;
        }
        if (lastCountdownRef.current === null) {
            lastCountdownRef.current = countdownSeconds;
            return;
        }
        const prev = lastCountdownRef.current;
        lastCountdownRef.current = countdownSeconds;
        if (isInitialized && !isRecording && prev > 0 && countdownSeconds === 0) {
            onRecordingStart();
        }
    }, [showCountdown, countdownSeconds, isRecording, isInitialized, onRecordingStart]);

    return (
        <div className="bg-white p-6 rounded-lg">
            {/* Waveform Visualization */}
            <div className="mb-6">
                <div className="bg-gray-100 rounded-lg p-4 h-32 flex items-center justify-center">
                    {isInitialized && audioLevels.length > 0 ? (
                        <div className="flex items-center space-x-1 h-full w-full">
                            {audioLevels.slice(0, 100).map((level, index) => {
                                // Tăng độ nhạy và làm cho sóng âm rõ ràng hơn
                                const scaledLevel = Math.min(level * 3, 1); // Tăng độ nhạy lên 3 lần
                                const height = Math.max(scaledLevel * 100, 2); // Tối thiểu 2% chiều cao
                                
                                return (
                                    <div
                                        key={index}
                                        className="rounded-sm transition-all duration-75"
                                        style={{
                                            width: '2px',
                                            height: `${height}%`,
                                            backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
                                            minHeight: '2px'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-gray-400 text-sm">
                            {isInitialized ? 'Đang phân tích audio...' : 'Đang khởi tạo microphone...'}
                        </div>
                    )}
                </div>
            </div>

            {/* Status Text */}
            <div className="text-center space-y-2">
                {showCountdown ? (
                    <div className="text-sm font-bold text-black">
                        HỆ THỐNG SẼ BẮT ĐẦU GHI ÂM SAU <span className="text-red-600">{countdownSeconds}</span> GIÂY
                    </div>
                ) : isRecording ? (
                    <>
                        <div className="text-sm font-bold" style={{ color: '#FFBA08' }}>
                            BÀI NÓI ĐANG ĐƯỢC THU ÂM TRỰC TIẾP.
                        </div>
                        <div className="text-sm font-bold" style={{ color: '#FFBA08' }}>
                            VUI LÒNG ĐỂ Ý SÓNG ÂM ĐỂ ĐIỀU CHỈNH MIC THU ÂM.
                        </div>
                    </>
                ) : (
                    <div className="text-sm font-bold text-gray-600">
                        Microphone đã sẵn sàng
                        {audioLevels.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                                Max level: {(Math.max(...audioLevels) * 100).toFixed(1)}%
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default MicrophoneTest;
