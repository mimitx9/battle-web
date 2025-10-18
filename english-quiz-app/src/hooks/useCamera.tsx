'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCameraReturn {
    stream: MediaStream | null;
    isCameraOn: boolean;
    startCamera: () => Promise<void>;
    stopCamera: () => void;
    capturedImage: string | null;
    setCapturedImage: (image: string | null) => void;
    showCaptureSuccess: boolean;
    setShowCaptureSuccess: (show: boolean) => void;
    cameraError: string | null;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const useCamera = (): UseCameraReturn => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [showCaptureSuccess, setShowCaptureSuccess] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = useCallback(async () => {
        try {
            console.log('🎥 Starting camera...');
            setCameraError(null); // Clear previous errors
            
            // Kiểm tra đầy đủ hỗ trợ browser
            if (!navigator.mediaDevices) {
                throw new Error('Browser không hỗ trợ MediaDevices API');
            }
            
            if (!navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser không hỗ trợ getUserMedia API');
            }
            
            // Kiểm tra HTTPS requirement (trừ localhost)
            const isSecureContext = window.isSecureContext;
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (!isSecureContext && !isLocalhost) {
                throw new Error('Camera chỉ hoạt động trên HTTPS hoặc localhost');
            }
            
            console.log('🎥 Browser support check passed. Checking camera availability...');

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });
            
            console.log('🎥 Camera stream obtained:', mediaStream);
            setStream(mediaStream);
            console.log('🎥 Setting isCameraOn to true');
            setIsCameraOn(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                console.log('🎥 Video element updated with stream');
                
                // Đợi video load
                videoRef.current.onloadedmetadata = () => {
                    console.log('🎥 Video metadata loaded');
                    if (videoRef.current) {
                        videoRef.current.play().catch(error => {
                            console.error('❌ Error playing video:', error);
                        });
                    }
                };
            }
        } catch (error) {
            console.error('❌ Error accessing camera:', error);
            setIsCameraOn(false);
            setStream(null);
            
            // Log thông tin debug chi tiết
            console.log('🔍 Debug info:', {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                isSecureContext: window.isSecureContext,
                protocol: window.location.protocol,
                hostname: window.location.hostname,
                mediaDevicesSupported: !!navigator.mediaDevices,
                getUserMediaSupported: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            });
            
            let errorMessage = 'Không thể truy cập camera. ';
            let actionSuggestion = '';
            
            if (error instanceof Error) {
                console.log('🔍 Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
                
                switch (error.name) {
                    case 'NotAllowedError':
                        errorMessage += 'Cần cho phép truy cập camera.';
                        actionSuggestion = 'Vui lòng click vào biểu tượng camera trên thanh địa chỉ và chọn "Cho phép luôn".';
                        break;
                    case 'NotFoundError':
                        errorMessage += 'Không tìm thấy camera.';
                        actionSuggestion = 'Vui lòng kiểm tra camera có được kết nối không.';
                        break;
                    case 'NotReadableError':
                        errorMessage += 'Camera đang được sử dụng bởi ứng dụng khác.';
                        actionSuggestion = 'Vui lòng đóng các ứng dụng đang sử dụng camera và thử lại.';
                        break;
                    case 'OverconstrainedError':
                        errorMessage += 'Camera không hỗ trợ cấu hình được yêu cầu.';
                        actionSuggestion = 'Thử tải lại trang hoặc sử dụng camera khác.';
                        break;
                    default:
                        errorMessage += error.message;
                        actionSuggestion = 'Vui lòng thử tải lại trang hoặc kiểm tra cài đặt camera của bạn.';
                }
            }
            
            const fullMessage = `${errorMessage}${actionSuggestion ? `\n\nLời khuyên: ${actionSuggestion}` : ''}`;
            setCameraError(fullMessage);
            alert(fullMessage);
        }
    }, []);

    const stopCamera = useCallback(() => {
        console.log('🎥 Stopping camera...');
        
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('🎥 Track stopped:', track.kind);
            });
            setStream(null);
        }
        
        setIsCameraOn(false);
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        console.log('🎥 Camera stopped successfully');
    }, [stream]);

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            console.log('🎥 useCamera cleanup on unmount');
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Effect để đồng bộ isCameraOn với stream state
    useEffect(() => {
        if (stream && !isCameraOn) {
            console.log('🎥 Stream exists but isCameraOn is false, setting to true');
            setIsCameraOn(true);
        } else if (!stream && isCameraOn) {
            console.log('🎥 No stream but isCameraOn is true, setting to false');
            setIsCameraOn(false);
        }
    }, [stream, isCameraOn]);

    // Effect để cập nhật video khi stream thay đổi
    useEffect(() => {
        if (stream && videoRef.current) {
            console.log('🎥 Updating video with new stream');
            videoRef.current.srcObject = stream;
            
            videoRef.current.onloadedmetadata = () => {
                console.log('🎥 Video metadata loaded in effect');
                if (videoRef.current) {
                    videoRef.current.play().catch(error => {
                        console.error('❌ Error playing video in effect:', error);
                    });
                }
            };
        }
    }, [stream]);

    return {
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
    };
};
