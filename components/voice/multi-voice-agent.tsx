"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, Loader2, X, Volume2, Settings, User, Users, Phone, PhoneCall, PhoneOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Voice agent profiles with distinct personalities for ADHD support
// Updated with verified ElevenLabs voice IDs for proper male/female distinction
const VOICE_AGENTS = [
  {
    id: "sarah",
    name: "Sarah",
    gender: "female",
    personality: "Calm & Supportive",
    description: "Gentle guidance for overwhelming moments",
    color: "from-pink-500 to-rose-600",
    elevenLabsVoiceId: "EXAVITQu4vr4xnSDxMaL", // Using your .env VOICE_SARAH
    specialties: ["anxiety", "overwhelm", "emotional support"]
  },
  {
    id: "alex",
    name: "Alex",
    gender: "male", 
    personality: "Energetic & Motivating",
    description: "High-energy coach for productivity",
    color: "from-blue-500 to-cyan-600",
    elevenLabsVoiceId: "pNInz6obpgDQGcFmaJgB", // Using your .env VOICE_ALEX
    specialties: ["motivation", "energy", "goal-setting"]
  },
  {
    id: "maya",
    name: "Maya",
    gender: "female",
    personality: "Organized & Strategic",
    description: "Expert in task management and planning",
    color: "from-purple-500 to-indigo-600",
    elevenLabsVoiceId: "ThT5KcBeYPX3keUQqHPh", // FIXED: Using your .env VOICE_MAYA
    specialties: ["planning", "organization", "time-management"]
  },
  {
    id: "marcus",
    name: "Marcus",
    gender: "male",
    personality: "Wise & Patient",
    description: "Thoughtful mentor for difficult days",
    color: "from-green-500 to-emerald-600", 
    elevenLabsVoiceId: "yoZ06aMxZJJ28mfd3POQ", // Using your .env VOICE_MARCUS
    specialties: ["patience", "wisdom", "coping-strategies"]
  },
  {
    id: "zoe",
    name: "Zoe",
    gender: "female",
    personality: "Creative & Inspiring",
    description: "Sparks creativity and innovative thinking",
    color: "from-orange-500 to-amber-600",
    elevenLabsVoiceId: "pFGS62b2FfGhol4k2agY", // FIXED: Using your .env VOICE_ZOE
    specialties: ["creativity", "inspiration", "problem-solving"]
  },
  {
    id: "ryan",
    name: "Ryan",
    gender: "male",
    personality: "Tech-Savvy & Practical",
    description: "Practical solutions and productivity hacks",
    color: "from-slate-500 to-gray-600",
    elevenLabsVoiceId: "onwK4e9ZLuTAKqWW03F9", // Using your .env VOICE_RYAN
    specialties: ["productivity", "technology", "efficiency"]
  }
];

interface MultiVoiceAgentProps {
  onClose?: () => void;
  fullScreen?: boolean;
}

export default function MultiVoiceAgent({ onClose, fullScreen = false }: MultiVoiceAgentProps) {
  const [selectedAgent, setSelectedAgent] = useState(VOICE_AGENTS[0]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [isSupported, setIsSupported] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'agent';
    message: string;
    timestamp: Date;
    agent?: typeof VOICE_AGENTS[0];
  }>>([]);
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    stability: 0.75,
    clarity: 0.75
  });
  
  // Enhanced conversation state
  const [conversationMode, setConversationMode] = useState<'single' | 'continuous'>('single');
  const [isCallActive, setIsCallActive] = useState(false);
  const [responseQueue, setResponseQueue] = useState<string[]>([]);
  const [interruptionEnabled, setInterruptionEnabled] = useState(true);
  const [voiceActivity, setVoiceActivity] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Check browser compatibility
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setError("Voice features require HTTPS or localhost");
      setIsSupported(false);
      return;
    }

    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setError("Speech recognition not supported. Use Chrome or Edge for best experience.");
      setIsSupported(false);
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setLastTranscript(transcript);
      setVoiceActivity(false);
      
      // Don't stop listening in continuous mode
      if (conversationMode === 'single') {
        setListening(false);
      }
      
      setLoading(true);
      setError(null);
      
      // Add user message to conversation
      setConversationHistory(prev => [...prev, {
        type: 'user',
        message: transcript,
        timestamp: new Date()
      }]);
      
      try {
        console.log('Voice input received:', transcript);
        
        // Use enhanced voice processing API for better context awareness
        const enhancedRes = await fetch("/api/voice/enhanced-processing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            transcript,
            agent: selectedAgent,
            conversationContext: conversationHistory.slice(-10), // More context for better responses
            processingMode: conversationMode
          }),
        });
        
        let reply: string;
        let enhancedVoiceSettings = voiceSettings;
        
        if (enhancedRes.ok) {
          const enhancedData = await enhancedRes.json();
          reply = enhancedData.response;
          enhancedVoiceSettings = { ...voiceSettings, ...enhancedData.voiceSettings };
          console.log('Enhanced AI response:', reply, 'Voice settings:', enhancedData.voiceSettings);
        } else {
          // Fallback to original API
          const res = await fetch("/api/ai-chat/multi-voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              message: transcript,
              agent: selectedAgent,
              conversationHistory: conversationHistory.slice(-5)
            }),
          });
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          
          const data = await res.json();
          reply = data.reply || "I didn't understand that. Could you try again?";
          console.log('Fallback AI response:', reply);
        }
        
        // Add agent response to conversation
        setConversationHistory(prev => [...prev, {
          type: 'agent',
          message: reply,
          timestamp: new Date(),
          agent: selectedAgent
        }]);
        
        // Generate speech with enhanced voice settings
        await generateSpeechWithElevenLabs(reply, selectedAgent, enhancedVoiceSettings);
        
        // In continuous mode, restart listening after response
        if (conversationMode === 'continuous' && isCallActive) {
          setTimeout(() => {
            if (recognitionRef.current && !listening) {
              try {
                recognitionRef.current.start();
                setListening(true);
                setVoiceActivity(true);
              } catch (e) {
                console.log('Recognition restart failed:', e);
              }
            }
          }, 1000); // Brief pause before restarting
        }
        
      } catch (err) {
        console.error('Multi-voice agent error:', err);
        const errorMsg = `${selectedAgent.name} is having trouble right now. Please try again.`;
        setError(errorMsg);
        // Fallback to browser speech synthesis
        await fallbackSpeak(errorMsg);
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
          errorMessage = "Microphone not accessible. Please check permissions.";
          break;
        case 'not-allowed':
          errorMessage = "Microphone access denied. Please allow access and try again.";
          break;
        case 'network':
          errorMessage = "Network error. Check your internet connection.";
          break;
        case 'aborted':
          errorMessage = "Speech recognition was stopped.";
          break;
        default:
          errorMessage = `Speech error: ${e.error || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      setListening(false);
      setLoading(false);
    };

    recognitionRef.current = recognition;
  }, [selectedAgent, conversationHistory]);

  const generateSpeechWithElevenLabs = async (text: string, agent: typeof VOICE_AGENTS[0], customVoiceSettings?: any) => {
    try {
      console.log(`Generating speech for ${agent.name} (${agent.gender}) with voice ID: ${agent.elevenLabsVoiceId}`);
      
      const settings = customVoiceSettings || voiceSettings;
      
      const response = await fetch("/api/elevenlabs/generate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice_id: agent.elevenLabsVoiceId,
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.clarity,
            speed: settings.speed
          }
        }),
      });

      if (!response.ok) {
        throw new Error('ElevenLabs API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      
      // Clean up URL after playing
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
    } catch (error) {
      console.error('ElevenLabs speech generation failed:', error);
      // Fallback to browser speech synthesis
      await fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = voiceSettings.speed;
      utterance.pitch = selectedAgent.gender === 'female' ? 1.2 : 0.8;
      utterance.volume = 0.8;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      window.speechSynthesis.speak(utterance);
    });
  };

  // Phone call-like controls for continuous conversation
  const startCall = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    
    setIsCallActive(true);
    setConversationMode('continuous');
    setError(null);
    
    // Start with agent greeting
    const greeting = `Hi! I'm ${selectedAgent.name}, your ${selectedAgent.personality.toLowerCase()} assistant. I'm here for a natural conversation. How are you feeling today?`;
    
    setConversationHistory(prev => [...prev, {
      type: 'agent',
      message: greeting,
      timestamp: new Date(),
      agent: selectedAgent
    }]);
    
    // Speak greeting and then start listening
    generateSpeechWithElevenLabs(greeting, selectedAgent).then(() => {
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setListening(true);
          setVoiceActivity(true);
        }
      }, 500);
    });
  }, [selectedAgent, isSupported]);
  
  const endCall = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsCallActive(false);
    setConversationMode('single');
    setListening(false);
    setVoiceActivity(false);
    setLoading(false);
    
    // Add goodbye message
    const goodbye = `Thanks for our conversation! I'm always here when you need support. Take care!`;
    setConversationHistory(prev => [...prev, {
      type: 'agent',
      message: goodbye,
      timestamp: new Date(),
      agent: selectedAgent
    }]);
    
    generateSpeechWithElevenLabs(goodbye, selectedAgent);
  }, [selectedAgent]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      setVoiceActivity(false);
    } else {
      setError(null);
      recognitionRef.current.start();
      setListening(true);
      setVoiceActivity(true);
    }
  }, [listening, isSupported]);

  const switchAgent = (agentId: string) => {
    const agent = VOICE_AGENTS.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setError(null);
      // Add agent switch message to conversation
      setConversationHistory(prev => [...prev, {
        type: 'agent',
        message: `Hi! I'm ${agent.name}, your ${agent.personality.toLowerCase()} assistant. ${agent.description}. How can I help you today?`,
        timestamp: new Date(),
        agent
      }]);
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setLastTranscript("");
    setError(null);
  };

  return (
    <div className={`${fullScreen ? 'min-h-screen bg-gradient-main' : ''} text-white`}>
      <div className={`${fullScreen ? 'container mx-auto p-8' : 'max-w-4xl mx-auto p-4'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              ADHD AI Multi-Voice Assistant
            </h1>
            <p className="text-gray-400 mt-2">Choose your AI companion and start a conversation</p>
          </div>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Agent Selection */}
          <div className="lg:col-span-1">
            <Card className="bg-surface-light border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Choose Your AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {VOICE_AGENTS.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => switchAgent(agent.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedAgent.id === agent.id
                        ? `bg-gradient-gold border-accent/30 shadow-lg shadow-accent/25`
                        : 'bg-surface-light border-white/10 hover:border-accent/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{agent.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {agent.gender} • {agent.personality}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300">{agent.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card className="bg-surface-light border-white/10 backdrop-blur-xl mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Voice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <label className="text-sm font-medium">Stability: {voiceSettings.stability.toFixed(2)}</label>
                  <Slider
                    value={[voiceSettings.stability]}
                    onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, stability: value }))}
                    min={0}
                    max={1}
                    step={0.05}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Clarity: {voiceSettings.clarity.toFixed(2)}</label>
                  <Slider
                    value={[voiceSettings.clarity]}
                    onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, clarity: value }))}
                    min={0}
                    max={1}
                    step={0.05}
                    className="mt-2"
                  />
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
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Chatting with {selectedAgent.name}
                </CardTitle>
                <Button onClick={clearConversation} variant="ghost" size="sm">
                  Clear Chat
                </Button>
              </CardHeader>
              <CardContent className="h-64 overflow-y-auto space-y-3">
                {conversationHistory.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Start a conversation by clicking the microphone below</p>
                  </div>
                ) : (
                  conversationHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : `bg-gradient-to-r ${msg.agent?.color || selectedAgent.color} text-white`
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {msg.type === 'user' ? 'You' : msg.agent?.name || selectedAgent.name} • {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Enhanced Voice Controls */}
            <div className="mt-4 flex flex-col items-center gap-4">
              {/* Call Mode Toggle */}
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConversationMode(conversationMode === 'single' ? 'continuous' : 'single')}
                  className={`${conversationMode === 'continuous' ? 'bg-accent/20 border-accent' : ''}`}
                >
                  <Radio className="w-4 h-4 mr-2" />
                  {conversationMode === 'single' ? 'Single Mode' : 'Call Mode'}
                </Button>
              </div>
              
              {/* Phone Call Controls */}
              {conversationMode === 'continuous' ? (
                <div className="flex items-center gap-4">
                  {!isCallActive ? (
                    <Button
                      onClick={startCall}
                      disabled={loading || !isSupported}
                      className="w-16 h-16 rounded-full bg-gradient-gold hover:brightness-110 shadow-lg shadow-accent/50 transition-all duration-300 hover:scale-110"
                    >
                      <PhoneCall className="w-6 h-6" />
                    </Button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          voiceActivity ? 'bg-accent animate-pulse' : 'bg-surface'
                        } transition-all duration-300`}>
                          {loading ? (
                            <Loader2 className="animate-spin w-6 h-6 text-white" />
                          ) : voiceActivity ? (
                            <Mic className="w-6 h-6 text-white" />
                          ) : (
                            <Volume2 className="w-6 h-6 text-white" />
                          )}
                        </div>
                        {(listening || voiceActivity) && (
                          <div className="absolute -inset-2 rounded-full border-2 border-accent animate-ping" />
                        )}
                      </div>
                      
                      <Button
                        onClick={endCall}
                        className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 shadow-lg transition-all duration-300"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Single Mode Controls */
                <div className="relative">
                  <Button
                    onClick={toggleListening}
                    disabled={loading || !isSupported}
                    className={`w-16 h-16 rounded-full transition-all duration-300 ${
                      listening
                        ? `bg-gradient-to-r ${selectedAgent.color} animate-pulse shadow-lg`
                        : loading
                        ? 'bg-blue-500/20 border-blue-500'
                        : `bg-gradient-to-r ${selectedAgent.color} hover:scale-110 shadow-lg`
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-6 h-6" />
                    ) : listening ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </Button>
                  
                  {listening && (
                    <div className="absolute -inset-2 rounded-full border-2 border-white/50 animate-ping" />
                  )}
                </div>
              )}

              {/* Enhanced Status Display */}
              <div className="text-center">
                {isCallActive && (
                  <div className="mb-2">
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">Call Active with {selectedAgent.name}</span>
                    </div>
                  </div>
                )}
                
                {loading && (
                  <p className="text-blue-400 animate-pulse">{selectedAgent.name} is thinking...</p>
                )}
                {listening && (
                  <p className="text-red-400 animate-pulse">
                    {conversationMode === 'continuous' ? 'Listening continuously...' : 'Listening to you...'}
                  </p>
                )}
                {voiceActivity && !listening && (
                  <p className="text-blue-400 animate-pulse">Processing your voice...</p>
                )}
                {!loading && !listening && !error && !isCallActive && (
                  <p className="text-gray-400">
                    {conversationMode === 'continuous' 
                      ? `Start a call with ${selectedAgent.name}` 
                      : `Click to talk with ${selectedAgent.name}`}
                  </p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-w-md">
                  <div className="flex items-start gap-2 text-red-400">
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Enhanced Information Display */}
              {conversationMode === 'continuous' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 max-w-md text-center">
                  <p className="text-blue-400 text-sm">
                    📞 Call Mode: Natural two-way conversation like a phone call
                  </p>
                </div>
              )}
              
              {/* Browser Compatibility Notice */}
              {!isSupported && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 max-w-md text-center">
                  <p className="text-yellow-400 text-sm">
                    💡 For best experience, use Chrome or Edge browser on HTTPS
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
