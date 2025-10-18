'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceInputConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  enableAutoStop?: boolean;
  autoStopDelay?: number;
}

export interface VoiceInputState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
}

export function useVoiceInput(config: VoiceInputConfig = {}) {
  const {
    language = 'vi-VN',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    enableAutoStop = true,
    autoStopDelay = 3000
  } = config;

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    error: null
  });

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setState(prev => ({ ...prev, isSupported: true }));
      
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          error: null,
          transcript: '',
          interimTranscript: ''
        }));
        finalTranscriptRef.current = '';
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            confidence = result[0].confidence || 0;
          } else {
            interimTranscript += transcript;
          }
        }

        finalTranscriptRef.current = finalTranscript;
        
        setState(prev => ({
          ...prev,
          transcript: finalTranscript,
          interimTranscript,
          confidence
        }));

        // Auto-stop after delay if enabled
        if (enableAutoStop && finalTranscript && !continuous) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
            stopListening();
          }, autoStopDelay);
        }
      };

      recognition.onerror = (event: any) => {
        let errorMessage = 'Có lỗi xảy ra với voice input';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'Không phát hiện giọng nói';
            break;
          case 'audio-capture':
            errorMessage = 'Không thể truy cập microphone';
            break;
          case 'not-allowed':
            errorMessage = 'Quyền truy cập microphone bị từ chối';
            break;
          case 'network':
            errorMessage = 'Lỗi kết nối mạng';
            break;
          case 'service-not-allowed':
            errorMessage = 'Dịch vụ voice recognition không khả dụng';
            break;
          default:
            errorMessage = `Lỗi không xác định: ${event.error}`;
        }

        setState(prev => ({ 
          ...prev, 
          isListening: false, 
          error: errorMessage 
        }));
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };

      recognitionRef.current = recognition;
    } else {
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        error: 'Trình duyệt không hỗ trợ voice recognition' 
      }));
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, maxAlternatives, enableAutoStop, autoStopDelay]);

  // Start listening
  const startListening = useCallback(() => {
    if (!state.isSupported || !recognitionRef.current) {
      setState(prev => ({ 
        ...prev, 
        error: 'Voice recognition không khả dụng' 
      }));
      return false;
    }

    try {
      recognitionRef.current.start();
      return true;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Không thể bắt đầu voice recognition' 
      }));
      return false;
    }
  }, [state.isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [state.isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      interimTranscript: '',
      confidence: 0
    }));
    finalTranscriptRef.current = '';
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get current transcript (final + interim)
  const getCurrentTranscript = useCallback(() => {
    return state.transcript + state.interimTranscript;
  }, [state.transcript, state.interimTranscript]);

  // Check if voice input is ready
  const isReady = state.isSupported && !state.error;

  return {
    // State
    ...state,
    isReady,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    clearError,
    
    // Utilities
    getCurrentTranscript
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

