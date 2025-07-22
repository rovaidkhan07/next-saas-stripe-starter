"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Loader2, Settings, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import Vapi from "@vapi-ai/web";

// Vapi AI Integration for rapid voice responses
// Uses Vapi's Web SDK for low-latency voice interactions

interface VapiVoiceAgentProps {
  onClose?: () => void;
  fullScreen?: boolean;
}

export default function VapiVoiceAgent({ onClose, fullScreen = false }: VapiVoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: string; content: string; timestamp: Date }>>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  
  // Vapi configuration
  const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "8e681f18-f286-40ca-8e81-879c64d29867";
  const vapiRef = useRef<any>(null);

  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    volume: 1.0,
    voice: "sarah" // Default voice
  });

  useEffect(() => {
    // Initialize Vapi SDK
    const initVapi = async () => {
      try {
        console.log('Initializing Vapi with public key:', VAPI_PUBLIC_KEY);
        vapiRef.current = new Vapi(VAPI_PUBLIC_KEY);
        setupVapiListeners();
        console.log('Vapi initialized successfully');
        setError(null);
      } catch (err) {
        console.error('Failed to initialize Vapi:', err);
        setError(`Failed to initialize Vapi: ${err.message}`);
      }
    };

    initVapi();

    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          console.error('Error stopping Vapi:', e);
        }
      }
    };
  }, []);

  const setupVapiListeners = () => {
    if (!vapiRef.current) return;

    vapiRef.current.on('call-start', () => {
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
      addMessage('system', 'Connected to ADHD AI Assistant');
    });

    vapiRef.current.on('call-end', () => {
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
      addMessage('system', 'Call ended');
    });

    vapiRef.current.on('speech-start', () => {
      setIsListening(true);
      setIsSpeaking(false);
    });

    vapiRef.current.on('speech-end', () => {
      setIsListening(false);
    });

    vapiRef.current.on('message', (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        if (message.role === 'user') {
          addMessage('user', message.transcript);
        } else if (message.role === 'assistant') {
          addMessage('assistant', message.transcript);
          setIsSpeaking(true);
          
          // Calculate response time
          const now = Date.now();
          const lastUserMessage = conversation.findLast(msg => msg.role === 'user');
          if (lastUserMessage) {
            const responseTime = now - lastUserMessage.timestamp.getTime();
            setResponseTime(responseTime);
          }
        }
      }
    });

    vapiRef.current.on('error', (error: any) => {
      console.error('Vapi error:', error);
      setError('Voice AI error occurred');
      setIsLoading(false);
    });
  };

  const addMessage = (role: string, content: string) => {
    setConversation(prev => [...prev, {
      role,
      content,
      timestamp: new Date()
    }]);
  };

  const startCall = async () => {
    if (!vapiRef.current) {
      setError('Voice AI not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the correct Vapi configuration structure
      const assistantConfig = {
        model: {
          provider: "openai",
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are Sarah, a specialized ADHD AI assistant. You ONLY help with ADHD-related topics.

YOUR STRICT SCOPE - ONLY respond to:
✅ ADHD symptoms and management
✅ Focus and concentration strategies
✅ Task organization and time management
✅ Executive function support
✅ ADHD medication questions (refer to doctor)
✅ Emotional regulation for ADHD
✅ Study/work productivity with ADHD
✅ ADHD coping mechanisms
✅ Mindfulness for ADHD
✅ ADHD-related stress and anxiety

❌ REFUSE to discuss:
- General health/medical advice unrelated to ADHD
- Non-ADHD mental health conditions
- General life advice not related to ADHD
- Entertainment, games, or casual conversation
- Technical support, coding, or other topics
- Politics, news, or current events

If asked about non-ADHD topics, respond: "I'm specifically designed to help with ADHD-related challenges. Let's focus on how I can support your ADHD management. What ADHD-related area would you like help with today?"

Keep responses under 50 words, actionable, and empathetic. Use a warm, encouraging tone.`
            }
          ]
        },
        voice: {
          provider: "11labs",
          voiceId: "EXAVITQu4vr4xnSDxMaL"
        },
        firstMessage: "Hi! I'm Sarah, your ADHD AI assistant. I'm here to help you stay focused and organized. How are you feeling today?",
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US"
        }
      };
      
      console.log('[VAPI] Starting call with config:', assistantConfig);
      await vapiRef.current.start(assistantConfig);
    } catch (err) {
      console.error('Failed to start call:', err);
      setError('Failed to start voice session');
      setIsLoading(false);
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setResponseTime(null);
  };

  return (
    <div className={`${fullScreen ? 'min-h-screen bg-gradient-main' : ''} text-white`}>
      <div className={`${fullScreen ? 'container mx-auto p-8' : 'max-w-4xl mx-auto p-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              ADHD AI Voice Assistant
            </h1>
            <p className="text-gray-400 mt-2">Powered by Vapi AI for rapid responses</p>
            {responseTime && (
              <Badge className="mt-2 bg-accent/20 text-accent border-accent/30">
                Response Time: {responseTime}ms
              </Badge>
            )}
          </div>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Controls */}
          <div className="lg:col-span-1">
            <Card className="bg-surface-light border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Voice Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                    isConnected 
                      ? isListening 
                        ? 'bg-accent animate-pulse shadow-lg shadow-accent/50' 
                        : isSpeaking 
                        ? 'bg-brand animate-pulse shadow-lg shadow-brand/50'
                        : 'bg-accent/60 shadow-lg shadow-accent/30'
                      : 'bg-surface'
                  }`}>
                    {isLoading ? (
                      <Loader2 className="animate-spin w-6 h-6 text-white" />
                    ) : isConnected ? (
                      isListening ? (
                        <Mic className="w-6 h-6 text-white" />
                      ) : (
                        <Volume2 className="w-6 h-6 text-white" />
                      )
                    ) : (
                      <Phone className="w-6 h-6 text-white" />
                    )}
                  </div>
                  
                  {!isConnected ? (
                    <Button
                      onClick={startCall}
                      disabled={isLoading}
                      className="w-full bg-gradient-gold hover:brightness-110 shadow-lg shadow-accent/50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Start Voice Session
                    </Button>
                  ) : (
                    <Button
                      onClick={endCall}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      <PhoneOff className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                  )}
                </div>

                {/* Voice Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Speed: {voiceSettings.speed.toFixed(1)}</label>
                    <Slider
                      value={[voiceSettings.speed]}
                      onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, speed: value }))}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Volume: {voiceSettings.volume.toFixed(1)}</label>
                    <Slider
                      value={[voiceSettings.volume]}
                      onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, volume: value }))}
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="text-center text-sm">
                  {error ? (
                    <div className="text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                      {error}
                    </div>
                  ) : isConnected ? (
                    <div className="text-accent">
                      {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready to chat'}
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      Click to start your voice session
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Area */}
          <div className="lg:col-span-2">
            <Card className="bg-surface-light border-white/10 backdrop-blur-xl h-96">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  Conversation with Sarah
                </CardTitle>
                <Button onClick={clearConversation} variant="ghost" size="sm">
                  Clear Chat
                </Button>
              </CardHeader>
              <CardContent className="h-64 overflow-y-auto space-y-3">
                {conversation.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <Mic className="w-12 h-12 mx-auto mb-4 text-accent" />
                    <p>Start a voice session to begin chatting with your ADHD AI assistant</p>
                  </div>
                ) : (
                  conversation.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : message.role === 'assistant'
                            ? 'bg-surface border border-white/10'
                            : 'bg-gray-500/20 text-gray-300 text-sm text-center'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs opacity-60 mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                onClick={() => isConnected && vapiRef.current?.say("Can you help me focus on my current task?")}
                disabled={!isConnected}
                variant="outline"
                className="text-accent border-accent/30 hover:bg-accent/10"
              >
                Need Focus Help
              </Button>
              <Button
                onClick={() => isConnected && vapiRef.current?.say("I'm feeling overwhelmed. Can you guide me?")}
                disabled={!isConnected}
                variant="outline"
                className="text-accent border-accent/30 hover:bg-accent/10"
              >
                Feeling Overwhelmed
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


