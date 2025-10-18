import { useState, useRef, useCallback, useEffect } from 'react';

// Web Speech API type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI?: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface GoogleSpeechToTextConfig {
  language?: string;
  sampleRate?: number;
  enableInterimResults?: boolean;
  enableConfidence?: boolean;
}

interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface GoogleSpeechToTextState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
}

export function useGoogleSpeechToText(config: GoogleSpeechToTextConfig = {}) {
  const {
    language = 'en-US',
    sampleRate = 16000,
    enableInterimResults = true,
    enableConfidence = true
  } = config;

  const [state, setState] = useState<GoogleSpeechToTextState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    confidence: 0,
    error: null,
    isSupported: false
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartCountRef = useRef(0);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setState(prev => ({ ...prev, isSupported: true }));
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = enableInterimResults;
      recognition.lang = language;
      recognition.maxAlternatives = enableConfidence ? 1 : 0;
      
      // Set longer timeout for better reliability
      if ('serviceURI' in recognition) {
        (recognition as any).serviceURI = 'wss://www.google.com/speech-api/v2/websocket';
      }

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started successfully');
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          error: null,
          // Không reset transcript khi restart, chỉ reset interim
          interimTranscript: ''
        }));
        isActiveRef.current = true;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎤 Speech recognition result received:', event);
        let interimTranscript = '';
        let finalTranscript = '';
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          console.log(`🎤 Result ${i}:`, {
            transcript: transcript,
            isFinal: result.isFinal,
            confidence: result[0].confidence
          });
          
          if (result.isFinal) {
            finalTranscript += transcript;
            if (enableConfidence && result[0].confidence) {
              confidence = Math.max(confidence, result[0].confidence);
            }
          } else {
            interimTranscript += transcript;
          }
        }

        console.log('🎤 Updating transcription state:', {
          finalTranscript,
          interimTranscript,
          confidence
        });

        setState(prev => ({
          ...prev,
          transcript: prev.transcript + finalTranscript + ' ', // Thêm space để tách từ
          interimTranscript: interimTranscript,
          confidence: confidence
        }));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Downgrade no-speech to debug to avoid noisy console errors
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        } else {
          console.debug('Speech recognition notice (no-speech)');
        }
        
        // Handle specific errors
        if (event.error === 'no-speech') {
          // Auto-restart recognition after a short delay, but limit restarts
          if (restartCountRef.current < 3) {
            console.log(`No speech detected, restarting recognition... (attempt ${restartCountRef.current + 1}/3)`);
            restartCountRef.current++;
            
            restartTimeoutRef.current = setTimeout(() => {
              if (isActiveRef.current && recognitionRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('Failed to restart recognition:', e);
                }
              }
            }, 2000); // Longer delay for better stability
            return; // Don't set error for no-speech
          } else {
            console.log('Max restart attempts reached, stopping recognition');
            setState(prev => ({
              ...prev,
              error: 'No speech detected after multiple attempts',
              isListening: false
            }));
            isActiveRef.current = false;
            return;
          }
        }
        
        setState(prev => ({
          ...prev,
          error: `Speech recognition error: ${event.error}`,
          isListening: false
        }));
        isActiveRef.current = false;
      };

      recognition.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
        isActiveRef.current = false;
      };

      recognitionRef.current = recognition;
    } else {
      setState(prev => ({ 
        ...prev, 
        isSupported: false,
        error: 'Speech recognition not supported in this browser'
      }));
    }
  }, [language, enableInterimResults, enableConfidence]);

  const startListening = useCallback(async (existingStream?: MediaStream) => {
    console.log('🎤 Starting speech recognition...', {
      hasRecognition: !!recognitionRef.current,
      isSupported: state.isSupported,
      hasExistingStream: !!existingStream
    });

    if (!recognitionRef.current || !state.isSupported) {
      console.error('🎤 Speech recognition not available');
      setState(prev => ({ 
        ...prev, 
        error: 'Speech recognition not available'
      }));
      return;
    }

    try {
      // Use existing stream if provided, otherwise request new one
      if (existingStream) {
        console.log('🎤 Using existing stream for speech recognition');
        mediaStreamRef.current = existingStream;
      } else {
        console.log('🎤 Requesting new microphone stream for speech recognition');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: sampleRate,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        mediaStreamRef.current = stream;
      }
      
      // Reset state (chỉ reset interim và error, giữ lại transcript)
      setState(prev => ({
        ...prev,
        interimTranscript: '',
        confidence: 0,
        error: null
      }));

      // Start recognition
      console.log('🎤 Calling recognition.start()');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to access microphone',
        isListening: false
      }));
    }
  }, [state.isSupported, sampleRate]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isActiveRef.current) {
      recognitionRef.current.stop();
    }
    
    // Clear restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Reset restart count
    restartCountRef.current = 0;
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopListening();
    restartCountRef.current = 0; // Reset restart count
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      confidence: 0,
      error: null,
      isListening: false
    }));
  }, [stopListening]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: ''
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    ...state,
    startListening,
    stopListening,
    reset,
    clearTranscript,
    getFullTranscript: () => state.transcript + state.interimTranscript
  };
}

