import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const useVoiceInput = ({
  onResult,
  onError,
  continuous = false,
  lang = 'en-US', 
  interimResults = true
}: {
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: SpeechRecognitionErrorEvent) => void;
  continuous?: boolean;
  lang?: string;
  interimResults?: boolean;
} = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    
    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    // Event handlers
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update the final transcript
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        if (onResult) {
          onResult(finalTranscriptRef.current, true);
        }
      } else if (interimTranscript && onResult) {
        onResult(finalTranscriptRef.current + interimTranscript, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech was detected',
        'audio-capture': 'No microphone was found',
        'not-allowed': 'Permission to use microphone was denied',
        'aborted': 'Speech recognition was aborted',
        'network': 'Network error occurred',
        'not-allowed': 'Microphone permission was denied',
        'service-not-allowed': 'Browser doesn\'t support speech recognition',
        'bad-grammar': 'Error in speech recognition grammar',
        'language-not-supported': 'Language not supported'
      };
      
      const errorMessage = errorMessages[event.error] || 'Error occurred in speech recognition';
      setError(errorMessage);
      
      if (onError) {
        onError(event);
      }
      
      // Show error toast
      toast.error('Voice Input Error', {
        description: errorMessage,
      });
      
      stopListening();
    };

    recognition.onend = () => {
      if (isListening) {
        // If continuous mode is on and we're still supposed to be listening, restart
        if (continuous) {
          recognition.start();
        } else {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, interimResults, lang, onError, onResult]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, isSupported]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      // Reset the final transcript
      finalTranscriptRef.current = '';
      
      // Request permission and start listening
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          recognitionRef.current?.start();
          setIsListening(true);
          setError(null);
          
          // Show a toast when starting to listen
          toast.info('Listening...', {
            description: 'Speak now',
            duration: 2000,
          });
        })
        .catch((err) => {
          console.error('Error accessing microphone:', err);
          setError('Could not access microphone. Please check your permissions.');
          toast.error('Microphone Access', {
            description: 'Could not access microphone. Please check your permissions.',
          });
        });
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start speech recognition');
      toast.error('Speech Recognition', {
        description: 'Failed to start speech recognition',
      });
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Show a toast when stopping
      if (finalTranscriptRef.current.trim()) {
        toast.success('Voice input captured', {
          description: 'Processing your request...',
          duration: 2000,
        });
      }
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError('Failed to stop speech recognition');
    }
  }, []);

  // Reset the transcript
  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    if (onResult) {
      onResult('', true);
    }
  }, [onResult]);

  // Handle language change
  const setLanguage = useCallback((language: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, []);

  return {
    // State
    isListening,
    isSupported,
    error,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    setLanguage,
  };
};

export default useVoiceInput;
