'use client';

import React, {useState, useRef, useEffect, Suspense} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useAuth} from '@/hooks/useAuth';
import {quizApi} from '@/lib/api';
import NotificationSlider from '@/components/common/NotificationSlider';
import AttemptLimitModal from '@/components/common/AttemptLimitModal';
import {useAttemptLimit} from '@/hooks/useAttemptLimit';
import {useCamera} from '@/hooks/useCamera';
import {useProtectedAudio} from '@/hooks/useProtectedAudio';
import AudioPlayer from '@/components/common/AudioPlayer';
import { convertBlobToWav } from '@/lib/audioUtils';

const WaitingRoomContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {user, loading, isInitialized, incrementAttemptCount} = useAuth();
    const {showLimitModal, closeLimitModal, checkAttemptLimit} = useAttemptLimit();

    // Tất cả Hooks phải được khai báo ở đầu component
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState('');
    const [isPlayingSample, setIsPlayingSample] = useState(false);
    const [examId] = useState('449807');
    const [isCreatingAttempt, setIsCreatingAttempt] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Audio visualization states
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [audioLevels, setAudioLevels] = useState<number[]>([]);
    const [isAudioInitialized, setIsAudioInitialized] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Camera hook
    const {
        stream,
        isCameraOn,
        startCamera,
        stopCamera,
        capturedImage,
        setCapturedImage,
        showCaptureSuccess,
        setShowCaptureSuccess,
        cameraError,
        videoRef,
        canvasRef
    } = useCamera();

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sample audio states - không dùng protection
    const [sampleCurrentTime, setSampleCurrentTime] = useState(0);
    const [sampleDuration, setSampleDuration] = useState(0);
    const [sampleProgress, setSampleProgress] = useState(0);

    // Redirect đến login nếu không có user (sau khi đã initialized)
    useEffect(() => {
        if (isInitialized && !loading && !user) {
            console.log('🔒 WaitingRoom: Redirecting to login - no user found');
            // Thêm delay nhỏ để tránh redirect quá nhanh
            const timer = setTimeout(() => {
                router.push('/login');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isInitialized, loading, user, router]);

    // Mở camera khi component mount và có user
    useEffect(() => {
        if (user && !stream && !cameraError) {
            console.log('🚀 Auto-starting camera for user:', user.username);
            startCamera().catch(error => {
                console.error('❌ Auto-start camera failed:', error);
            });
        }
    }, [user, stream, cameraError]); // Include camera states để track changes

    // Fallback: Đảm bảo camera start sau khi component hoàn toàn mount
    useEffect(() => {
        const timer = setTimeout(() => {
            if (user && !stream && !cameraError) {
                console.log('🚀 Fallback: Starting camera after timeout');
                startCamera().catch(error => {
                    console.error('❌ Fallback camera start failed:', error);
                });
            }
        }, 1000); // Delay 1 giây

        return () => clearTimeout(timer);
    }, []); // Chỉ chạy một lần khi mount


    // Setup audio event listeners cho sample audio - với progress tracking
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            console.log('🎵 Sample audio metadata loaded, duration:', audio.duration);
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                setSampleDuration(audio.duration);
            }
        };

        const handleDurationChange = () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                console.log('🎵 Sample audio durationchange:', audio.duration);
                setSampleDuration(audio.duration);
            }
        };

        const handleCanPlay = () => {
            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                console.log('🎵 Sample audio canplay, duration:', audio.duration);
                setSampleDuration(audio.duration);
            }
        };

        const handleTimeUpdate = () => {
            const current = audio.currentTime;
            const total = audio.duration;

            setSampleCurrentTime(current);

            if (total > 0) {
                const currentProgress = (current / total) * 100;
                setSampleProgress(currentProgress);
                // Đảm bảo thiết lập tổng thời lượng khi metadata chưa sẵn sàng
                setSampleDuration(prev => (prev > 0 ? prev : total));
            }
        };

        const handlePlay = () => {
            console.log('🎵 Sample audio playing');
            setIsPlayingSample(true);
        };

        const handlePause = () => {
            console.log('🎵 Sample audio paused');
            setIsPlayingSample(false);
        };

        const handleEnded = () => {
            console.log('🎵 Sample audio ended');
            setIsPlayingSample(false);
            setSampleProgress(100);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);

        // Trigger loadedmetadata if already loaded
        if (audio.readyState >= 1) {
            handleLoadedMetadata();
        }

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // Reset states khi component unmount hoặc user thay đổi
    useEffect(() => {
        return () => {
            // Cleanup khi component unmount
            setIsCreatingAttempt(false);
            setIsNavigating(false);
            stopCamera(); // Tắt camera khi rời khỏi waiting room

            // Cleanup audio resources
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [stopCamera]);

    // Reset states khi user thay đổi (tránh state cũ từ user khác)
    useEffect(() => {
        setIsCreatingAttempt(false);
        setIsNavigating(false);
    }, [user?.userId]);

    // Fallback: nếu vẫn chưa có duration, chủ động load metadata bằng đối tượng Audio riêng
    useEffect(() => {
        if (sampleDuration > 0) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            if (cancelled || sampleDuration > 0) return;
            const probe = new Audio('/sample-audio.mp3');
            probe.preload = 'metadata';
            const onLoaded = () => {
                if (!cancelled && Number.isFinite(probe.duration) && probe.duration > 0) {
                    setSampleDuration(probe.duration);
                }
                probe.removeEventListener('loadedmetadata', onLoaded);
            };
            probe.addEventListener('loadedmetadata', onLoaded);
            try { probe.load(); } catch {}
        }, 1200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [sampleDuration]);

    // Khởi tạo microphone và audio context cho visualization
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
                analyser.smoothingTimeConstant = 0.3;
                analyser.minDecibels = -90;
                analyser.maxDecibels = -10;
                source.connect(analyser);

                audioContextRef.current = audioContext;
                analyserRef.current = analyser;
                setIsAudioInitialized(true);

                console.log('🎤 AudioContext đã được khởi tạo, bắt đầu phân tích audio');

                // Bắt đầu phân tích audio levels
                updateAudioLevels();

            } catch (error) {
                console.error('❌ Không thể truy cập microphone:', error);
                setIsAudioInitialized(false);
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
        
        setAudioLevels(levels);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    };

    // Hiển thị loading state nếu đang loading hoặc chưa initialized
    if (loading || !isInitialized) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-base font-medium">Đang tải thông tin người dùng...</p>
                </div>
            </div>
        );
    }

    // Hiển thị loading nếu đang redirect (đợi một chút để tránh redirect quá nhanh)
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-base font-medium">Đang chuyển hướng...</p>
                </div>
            </div>
        );
    }


    // const handleLogout = () => {
    //     alert('Đăng xuất thành công!');
    // };

    const handleTakePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to image data URL
        const imageDataUrl = canvas.toDataURL('image/png');
        setCapturedImage(imageDataUrl);

        // Lưu ảnh vào localStorage để sử dụng ở các trang quiz
        localStorage.setItem('user_captured_photo', imageDataUrl);

        // Hiển thị thông báo thành công
        setShowCaptureSuccess(true);

        // Tự động ẩn thông báo sau 3 giây
        setTimeout(() => {
            setShowCaptureSuccess(false);
        }, 3000);

        console.log('📸 Photo captured and saved to localStorage');
    };

    const handleRetakePhoto = () => {
        setCapturedImage(null);
        localStorage.removeItem('user_captured_photo');
        setShowCaptureSuccess(false);
        console.log('📸 Photo cleared, ready for retake');
    };

    const handlePlaySampleAudio = () => {
        if (audioRef.current) {
            // Nếu duration chưa được set, lấy lại từ thẻ audio khi người dùng tương tác
            if ((!Number.isFinite(sampleDuration) || sampleDuration === 0) &&
                Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
                setSampleDuration(audioRef.current.duration);
            }
            if (isPlayingSample) {
                audioRef.current.pause();
                setIsPlayingSample(false);
            } else {
                audioRef.current.play();
                setIsPlayingSample(true);
            }
        }
    };

    const handleRecord = async () => {
        try {
            // Nếu đang thu âm, dừng lại
            if (isRecording) {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
                setIsRecording(false);
                return;
            }

            // Xin phép sử dụng microphone
            console.log('🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });

            console.log('🎤 Microphone access granted, creating MediaRecorder...');

            // Kiểm tra định dạng được hỗ trợ
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' :
                    MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : 'audio/wav';

            console.log('🎤 Using MIME type:', mimeType);

            const mediaRecorder = new MediaRecorder(stream, {mimeType});
            mediaRecorderRef.current = mediaRecorder;

            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (event) => {
                console.log('🎤 Data available, chunk size:', event.data.size);
                chunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                console.log('🎤 Recording stopped, creating audio file...');
                const rawBlob = new Blob(chunks, {type: mimeType});
                console.log('🎤 Raw audio blob created:', { type: rawBlob.type, size: rawBlob.size });
                // Convert to WAV to satisfy backend requirement
                let blob: Blob = rawBlob;
                try {
                    blob = await convertBlobToWav(rawBlob);
                    console.log('🎤 Converted WAV blob:', { type: blob.type, size: blob.size });
                } catch (e) {
                    console.warn('⚠️ WAV conversion failed, using raw blob instead:', e);
                }

                if (blob.size > 0) {
                    setAudioBlob(blob);
                    const url = URL.createObjectURL(blob);
                    setAudioUrl(url);
                    console.log('🎤 Audio URL created:', url);
                } else {
                    console.error('🎤 Empty audio blob created');
                }

                // Dừng các track audio
                stream.getTracks().forEach(track => {
                    console.log('🎤 Stopping track:', track.kind);
                    track.stop();
                });
            };

            mediaRecorder.onerror = (event) => {
                console.error('🎤 MediaRecorder error:', event);
                setIsRecording(false);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.onstart = () => {
                console.log('🎤 Recording started');
                setIsRecording(true);
            };

            // Bắt đầu thu âm
            mediaRecorder.start();
            console.log('🎤 Starting recording...');

        } catch (error) {
            console.error('⚠️ Error recording audio:', error);
            setIsRecording(false);

            let errorMessage = 'Không thể truy cập microphone. ';
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    errorMessage += 'Vui lòng cấp quyền truy cập microphone trong trình duyệt.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage += 'Không tìm thấy microphone. Vui lòng kết nối microphone và thử lại.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage += 'Microphone đang được sử dụng bởi ứng dụng khác.';
                } else {
                    errorMessage += 'Vui lòng thử lại sau ít phút.';
                }
            }
            alert(errorMessage);
        }
    };


    const handleStartExam = async () => {
        // Kiểm tra nếu đang trong quá trình tạo quiz hoặc navigate
        if (isCreatingAttempt || isNavigating) {
            console.log('🚫 Quiz creation already in progress, ignoring duplicate call');
            return;
        }

        // Kiểm tra xem có attemptId từ clone không
        const attemptIdParam = searchParams.get('attemptId');
        const isClonedAttempt = attemptIdParam !== null;

        console.log('🔍 Attempt ID from URL:', attemptIdParam, 'isClonedAttempt:', isClonedAttempt);

        // Nếu không phải cloned attempt, kiểm tra giới hạn attempt
        if (!isClonedAttempt && !checkAttemptLimit(user)) {
            return; // Modal sẽ được hiển thị tự động
        }

        console.log('🚀 Starting quiz process...', isClonedAttempt ? '(cloned attempt)' : '(new attempt)');
        setIsCreatingAttempt(true);

        try {
            let attempt;

            if (isClonedAttempt) {
                // Nếu là cloned attempt, gọi getInProgressAttempt
                console.log('🔄 Getting in-progress attempt for cloned quiz...');
                attempt = await quizApi.getInProgressAttempt();
                console.log('✅ In-progress attempt retrieved successfully:', attempt);
            } else {
                // Nếu là attempt mới, tạo attempt mới
                console.log('🆕 Creating new quiz attempt...');
                attempt = await quizApi.createAttempt();
                console.log('✅ Quiz attempt created successfully:', attempt);

                // Tăng countAttempt trong cache ngay sau khi tạo thành công
                incrementAttemptCount();
            }

            // Đánh dấu đang navigate để tránh duplicate calls
            setIsNavigating(true);

            // Chuyển hướng đến trang quiz listening (bắt đầu từ listening)
            router.push('/quiz/listening');

        } catch (error) {
            console.error('❌ Error in quiz process:', error);

            // Reset states khi có lỗi
            setIsCreatingAttempt(false);
            setIsNavigating(false);

            // Hiển thị thông báo lỗi chi tiết hơn
            let errorMessage = 'Có lỗi xảy ra khi tạo bài thi. ';
            if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    errorMessage += 'Vui lòng kiểm tra kết nối mạng và thử lại.';
                } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
                    errorMessage += 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (error.message.includes('limit') || error.message.includes('403')) {
                    errorMessage += 'Bạn đã vượt quá giới hạn số lần thi.';
                } else {
                    errorMessage += 'Vui lòng thử lại sau ít phút.';
                }
            } else {
                errorMessage += 'Vui lòng thử lại sau ít phút.';
            }

            // Có thể thêm toast notification ở đây thay vì alert
            console.log('💬 Error message for user:', errorMessage);
            // alert(errorMessage);
        }
        // Không reset isCreatingAttempt ở đây vì sẽ được reset khi navigate
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Capture Success Notification */}
            {showCaptureSuccess && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-3 text-center font-medium">
                    <div className="flex items-center justify-center space-x-2">
                        <span>✅</span>
                        <span>Chụp ảnh thành công!</span>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Top Instruction */}
                <div className="text-center mb-6">
                    <p className="text-xs text-gray-600">Vui lòng cấp quyền sử dụng micro cho trình duyệt trước khi thi.</p>
                </div>

                {/* Top Section with Camera and User Info */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-start gap-12">
                        {/* Camera Placeholder */}
                        <div className="relative">
                            <div className="w-32 h-32 bg-gray-100 border-2 border-gray-300 rounded overflow-hidden relative">
                                {/* Video Camera */}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover absolute top-0 left-0"
                                    style={{ display: isCameraOn ? 'block' : 'none' }}
                                />

                                {/* Captured Image */}
                                {capturedImage && (
                                    <img
                                        src={capturedImage}
                                        alt="Captured photo"
                                        className="w-full h-full object-cover absolute top-0 left-0"
                                    />
                                )}

                                {/* Loading/Error states */}
                                {!isCameraOn && !cameraError && !capturedImage && (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">📷</div>
                                            <div className="text-xs">Đang tải camera...</div>
                                        </div>
                                    </div>
                                )}

                                {cameraError && !capturedImage && (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <div className="text-center">
                                            <div className="text-3xl mb-2">⚠️</div>
                                            <div className="text-xs">Lỗi camera</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Take Photo Button */}
                            <div className="mt-4 text-center">
                                {capturedImage ? (
                                    <button
                                        onClick={handleRetakePhoto}
                                        className="text-white px-8 py-2.5 rounded-full text-xs font-bold transition-colors"
                                        style={{ backgroundColor: '#FFBA08' }}
                                    >
                                        CHỤP LẠI
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleTakePhoto}
                                        disabled={!isCameraOn}
                                        className="text-white px-8 py-2.5 bg-red-500 rounded-full text-xs font-bold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        CHỤP HÌNH
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="space-y-3 pt-4">
                            <div className="flex gap-2">
                                <span className="text-xs text-gray-700">Họ tên:</span>
                                <span className="text-xs font-bold text-black">{user.fullName || user.username}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-xs text-gray-700">Tài khoản:</span>
                                <span className="text-xs font-bold text-black">{user.username.toUpperCase()}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-xs text-gray-700">Tài khoản:</span>
                                <span className="text-xs font-bold text-black">
                                    {user.faTestInfo?.isPaid
                                        ? (user.faTestInfo.plan === 'LIFETIME' ? 'Gói Trọn Đời' :
                                            user.faTestInfo.plan === 'YEARLY' ? 'Gói Năm' :
                                                user.faTestInfo.plan === 'MONTHLY' ? 'Gói Tháng' : 'Premium')
                                        : 'Miễn phí'
                                    }
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-xs text-gray-700">Mã đề thi:</span>
                                <span className="text-xs font-bold text-black">{examId}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Three Columns Section */}
                <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1fr_1fr] gap-0 mt-12">
                    {/* Section 1: Exam Structure */}
                    <div className="bg-white rounded-lg pl-2 pr-8 py-4">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: '#FFBA08' }}>
                                <span className="text-white font-bold text-lg">1</span>
                            </div>
                            <h2 className="text-sm font-bold text-black">CẤU TRÚC BÀI THI</h2>
                        </div>

                        <div className="space-y-3 text-xs">
                            <p className="text-black leading-relaxed">
                                Kỹ năng 1: NGHE – 3 phần <span className="text-gray-600">(47 phút)</span>
                            </p>
                            <p className="text-black leading-relaxed">
                                Kỹ năng 2: ĐỌC – 4 phần <span className="text-gray-600">(60 phút)</span>
                            </p>
                            <p className="text-black leading-relaxed">
                                Kỹ năng 3: VIẾT – 2 phần <span className="text-gray-600">(60 phút)</span>
                            </p>
                            <p className="text-black leading-relaxed">
                                Kỹ năng 4: NÓI – 3 phần <span className="text-gray-600">(12 phút)</span>
                            </p>
                        </div>
                    </div>

                    {/* Section 2: Sound Check */}
                    <div className="bg-white rounded-lg p-6">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: '#FFBA08' }}>
                                <span className="text-white font-bold text-lg">2</span>
                            </div>
                            <h2 className="text-sm font-bold text-black">KIỂM TRA ÂM THANH</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Step 1: Sample Audio */}
                            <div>
                                <p className="text-xs text-black mb-3 leading-relaxed">- Bước 1: Nghe đoạn audio mẫu bên dưới.</p>
                                <div className="p-4">
                                    <AudioPlayer
                                        onPlayClick={handlePlaySampleAudio}
                                        isPlaying={isPlayingSample}
                                        hasPlayedOnce={false}
                                        progressPercent={sampleProgress}
                                        currentTimeLabel={`${Math.floor(sampleCurrentTime / 60)}:${Math.floor(sampleCurrentTime % 60).toString().padStart(2, '0')}`}
                                        totalTimeLabel={`${Math.floor(sampleDuration / 60)}:${Math.floor(sampleDuration % 60).toString().padStart(2, '0')}`}
                                    />
                                </div>
                            </div>

                            {/* Step 2: Microphone Instructions */}
                            <div>
                                <p className="text-xs text-black leading-relaxed">- Bước 2: Đặt mic sát miệng.</p>
                            </div>

                            {/* Step 3: Recording */}
                            <div>
                                <p className="text-xs text-black mb-3 leading-relaxed">- Bước 3: Bấm "Thu âm" → sau đó "Nghe lại".</p>

                                {/* Waveform Visualization */}
                                <div className="mb-4">
                                    <div className="bg-gray-100 rounded-lg p-4 h-24 flex items-center justify-center">
                                        {isAudioInitialized && audioLevels.length > 0 ? (
                                            <div className="flex items-center space-x-1 h-full w-full">
                                                {audioLevels.slice(0, 80).map((level, index) => {
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
                                            <div className="text-gray-400 text-xs">
                                                {isAudioInitialized ? 'Đang phân tích audio...' : 'Đang khởi tạo microphone...'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Text */}
                                <div className="text-center mb-3">
                                    {isRecording ? (
                                        <div className="text-xs font-bold" style={{ color: '#FFBA08' }}>
                                            ĐANG THU ÂM - VUI LÒNG ĐỂ Ý SÓNG ÂM ĐỂ ĐIỀU CHỈNH MIC
                                        </div>
                                    ) : (
                                        <div className="text-xs font-bold text-gray-600">
                                            Microphone đã sẵn sàng
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mb-3">
                                    <button
                                        onClick={handleRecord}
                                        className={`px-6 py-2.5 rounded-full text-xs font-bold transition-colors ${
                                            isRecording
                                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                : 'bg-red-500 text-white hover:bg-red-600'
                                        }`}
                                    >
                                        {isRecording ? 'Đang thu...' : 'Thu âm'}
                                    </button>

                                    {audioUrl && !isRecording && (
                                        <button className="text-white px-6 py-2.5 rounded-full text-xs font-bold transition-colors"
                                        style={{ backgroundColor: '#FFBA08' }}>
                                            Nghe lại
                                        </button>
                                    )}
                                </div>

                                {/* Audio Player */}
                                {audioUrl && !isRecording && (
                                    <div className="mt-3">
                                        <audio
                                            controls
                                            src={audioUrl}
                                            className="w-full h-10"
                                            controlsList="nodownload noplaybackrate noremoteplayback"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Notes */}
                    <div className="bg-white rounded-lg p-6">
                        <div className="flex items-center mb-6">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" style={{ backgroundColor: '#FFBA08' }}>
                                <span className="text-white font-bold text-lg">3</span>
                            </div>
                            <h2 className="text-sm font-bold text-black">LƯU Ý</h2>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-black leading-relaxed">
                                - Khi hết thời gian mỗi kỹ năng, hệ thống tự động chuyển tiếp.
                            </p>
                            <p className="text-xs text-black leading-relaxed">
                                - Bấm "TIẾP TỤC" để sang part hoặc kỹ năng kế tiếp.
                            </p>

                            <button
                                onClick={handleStartExam}
                                disabled={isCreatingAttempt || isNavigating}
                                className={`px-8 py-4 rounded-full text-sm font-bold transition-colors w-full shadow-lg ${
                                    (isCreatingAttempt || isNavigating)
                                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                        : 'text-white hover:opacity-90'
                                }`}
                                style={{
                                    backgroundColor: (isCreatingAttempt || isNavigating) ? undefined : '#0D7ADE'
                                }}
                            >
                                {isCreatingAttempt ? 'ĐANG TẠO BÀI THI...' :
                                    isNavigating ? 'ĐANG CHUYỂN TRANG...' :
                                        'NHẬN ĐỀ'}
                            </button>

                            <p className="text-xs text-gray-600 text-center leading-relaxed">
                                hoặc quay lại <span
                                className="text-blue-600 cursor-pointer hover:text-blue-800"
                                onClick={() => router.push('/quiz/history')}
                            >
                                trang quản lý tài khoản
                            </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden elements */}
            <audio ref={audioRef} src="/sample-audio.mp3" preload="auto" style={{display: 'none'}} />

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} style={{display: 'none'}}></canvas>

            {/* Attempt Limit Modal */}
            <AttemptLimitModal
                isOpen={showLimitModal}
                onClose={closeLimitModal}
                currentAttempts={user?.countAttempt || 0}
                maxAttempts={1}
            />
        </div>
    );
};

const WaitingRoomPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 font-sans">
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-base font-medium">Đang tải trang...</p>
                </div>
            </div>
        }>
            <WaitingRoomContent />
        </Suspense>
    );
};

export default WaitingRoomPage;