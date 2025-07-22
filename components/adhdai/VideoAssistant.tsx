'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/shared/icons';
import { useToast } from '@/components/ui/use-toast';
import { useADHDAI } from '@/contexts/adhdai';
import { Textarea } from '@/components/ui/textarea';

type VideoAssistantProps = {
  className?: string;
};

export function VideoAssistant({ className = '' }: VideoAssistantProps) {
  const { toast } = useToast();
  const {
    videoAssistant,
    startVideoAssistant,
    stopVideoAssistant,
    sendMessageToAssistant,
    endVideoSession,
  } = useADHDAI();
  
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { state, messages, currentSession, error } = videoAssistant;
  const isActive = state === 'active';
  const isLoading = state === 'connecting';
  
  // Initialize video stream when active
  useEffect(() => {
    if (isActive && videoRef.current) {
      // The stream is managed by the context
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error('Error accessing media devices:', err);
          toast({
            title: 'Error',
            description: 'Could not access camera/microphone. Please check permissions.',
            variant: 'destructive',
          });
        });
    }
    
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
  }, [isActive, toast]);
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Assistant Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  const toggleVideoAssistant = async () => {
    if (isActive) {
      await stopVideoAssistant();
    } else {
      await startVideoAssistant();
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    await sendMessageToAssistant(message);
    setMessage('');
  };
  
  const handleEndSession = async () => {
    await endVideoSession();
  };

  return (
    <div className={`relative flex flex-col rounded-lg border bg-background overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="text-lg font-semibold">ADHD Video Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            {isMinimized ? (
              <Icons.maximize2 className="h-4 w-4" />
            ) : (
              <Icons.minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant={isActive ? 'destructive' : 'default'}
            size="sm"
            onClick={toggleVideoAssistant}
            disabled={isLoading}
            className="h-8"
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-3 w-3 animate-spin" />
            ) : isActive ? (
              <Icons.videoOff className="mr-2 h-3 w-3" />
            ) : (
              <Icons.video className="mr-2 h-3 w-3" />
            )}
            {isLoading ? 'Connecting...' : isActive ? 'Stop' : 'Start'}
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {isActive ? (
            <div className="flex flex-col h-[500px]">
              <div className="relative flex-1 overflow-hidden">
                <div className="absolute inset-0 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                </div>
                
                {/* Messages overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="max-h-32 overflow-y-auto mb-2 space-y-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background text-foreground border'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="min-h-10 max-h-24 resize-none"
                      rows={1}
                    />
                    <Button type="submit" size="icon" className="h-10 w-10">
                      <Icons.send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              
              <div className="border-t p-2 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/images/avatar.png" alt="AI Assistant" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">ADHD Assistant</p>
                    <p className="text-xs text-muted-foreground">
                      {currentSession?.startedAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEndSession}
                  className="h-8 text-xs"
                >
                  End Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icons.bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-medium">ADHD Video Assistant</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Get personalized help and stay on track with our AI-powered assistant
                </p>
              </div>
              <Button
                onClick={toggleVideoAssistant}
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.video className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Starting...' : 'Start Video Assistant'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VideoAssistant;
