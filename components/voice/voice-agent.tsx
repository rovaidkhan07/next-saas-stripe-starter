"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// This component provides a simple in-browser voice agent powered by the Web Speech API.
// It records the user's voice, converts it to text (if supported), sends the transcript
// to an /api/ai-chat endpoint (to be implemented server-side), then reads the AI response
// aloud using the Speech Synthesis API. All functionality runs client-side only.
//
// NOTE: For best results use Chrome or Edge as they have the most complete Speech API support.

export default function VoiceAgent() {
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError("Voice features require HTTPS or localhost");
      setIsSupported(false);
      return;
    }

    // Dynamically grab WebKit implementation if needed
    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setError("Speech recognition not supported in this browser. Try Chrome or Edge.");
      setIsSupported(false);
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setLastTranscript(transcript);
      setListening(false);
      setLoading(true);
      setError(null);
      
      try {
        console.log('Voice input received:', transcript);
        const res = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: transcript }),
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        const reply = data.reply || "I didn't understand that. Could you try again?";
        console.log('AI response:', reply);
        
        // Speak the response
        await speak(reply);
        
      } catch (err) {
        console.error('Voice agent error:', err);
        const errorMsg = "Sorry, I'm having trouble right now. Please try again.";
        setError(errorMsg);
        await speak(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e);
      let errorMessage = "Speech recognition error";
      
      switch (e.error) {
        case 'no-speech':
          errorMessage = "No speech detected. Try speaking closer to your microphone.";
          break;
        case 'audio-capture':
          errorMessage = "Microphone not accessible. Please check your microphone permissions.";
          break;
        case 'not-allowed':
          errorMessage = "Microphone access denied. Please allow microphone access and try again.";
          break;
        case 'network':
          errorMessage = "Network error. Please check your internet connection.";
          break;
        case 'aborted':
          errorMessage = "Speech recognition was stopped.";
          break;
        default:
          errorMessage = `Speech recognition error: ${e.error || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      setListening(false);
      setLoading(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setError(null);
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 max-w-xs">
      <div className="relative">
        <Button 
          onClick={toggleListening} 
          variant="outline" 
          size="icon" 
          disabled={loading || !isSupported}
          className={`w-12 h-12 rounded-full transition-all duration-300 ${
            listening 
              ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
              : loading 
              ? 'bg-accent/20 border-accent text-accent'
              : 'hover:bg-accent/20 hover:border-accent hover:text-accent'
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : listening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
          <span className="sr-only">{listening ? "Stop listening" : "Start voice chat"}</span>
        </Button>
        
        {/* Listening indicator */}
        {listening && (
          <div className="absolute -inset-1 rounded-full border-2 border-red-400 animate-ping" />
        )}
      </div>
      
      {/* Status text */}
      <div className="text-center">
        {loading && (
          <p className="text-xs text-blue-400 animate-pulse">Processing...</p>
        )}
        {listening && (
          <p className="text-xs text-red-400 animate-pulse">Listening...</p>
        )}
        {!loading && !listening && !error && (
          <p className="text-xs text-gray-400">Click to talk</p>
        )}
      </div>
      
      {/* Last transcript */}
      {lastTranscript && !error && (
        <div className="text-xs text-gray-300 bg-white/5 rounded-lg p-2 max-w-full">
          <span className="text-gray-500">You said:</span> "{lastTranscript}"
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg p-2 max-w-full">
          <X className="size-3 mt-0.5 flex-shrink-0" /> 
          <span className="text-left">{error}</span>
        </div>
      )}
      
      {/* Browser compatibility notice */}
      {!isSupported && (
        <div className="text-xs text-yellow-400 bg-yellow-500/10 rounded-lg p-2 max-w-full text-center">
          💡 For best voice experience, use Chrome or Edge browser on HTTPS
        </div>
      )}
    </div>
  );
}
