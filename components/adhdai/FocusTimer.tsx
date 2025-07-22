'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useADHDAI } from '@/contexts/adhdai';
import { formatTime } from '@/lib/utils/timerUtils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, RotateCcw, Timer, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const WORK_DURATIONS = [15, 20, 25, 30, 45, 60];
const BREAK_DURATIONS = [5, 10, 15, 20];
const LONG_BREAK_DURATIONS = [15, 20, 25, 30];

interface FocusTimerProps {
  className?: string;
}

const FocusTimer: React.FC<FocusTimerProps> = ({ className }) => {
  const {
    // Timer state
    timerState,
    timeLeft,
    isBreak,
    activeTask,
    completedPomodoros,
    
    // Timer actions
    startTimer,
    stopTimer,
    toggleTimer,
    resetTimer,
    startBreak,
    skipBreak,
    
    // Formatting
    formatTime,
  } = useADHDAI();
  
  const [workDuration, setWorkDuration] = useState(25); // in minutes
  const [shortBreakDuration, setShortBreakDuration] = useState(5); // in minutes
  const [longBreakDuration, setLongBreakDuration] = useState(15); // in minutes
  const [pomodorosBeforeLongBreak, setPomodorosBeforeLongBreak] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(true);
  
  // Animation refs
  const timerCircleRef = useRef<SVGCircleElement>(null);
  const animationRef = useRef<number>();
  const prevTimeLeftRef = useRef(timeLeft);
  
  // Calculate the radius and circumference of the timer circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  
  // Update the timer circle animation
  useEffect(() => {
    if (!timerCircleRef.current) return;
    
    // Calculate the stroke dashoffset based on time left
    const totalDuration = isBreak 
      ? (completedPomodoros > 0 && completedPomodoros % pomodorosBeforeLongBreak === 0 
          ? longBreakDuration 
          : shortBreakDuration) * 60 
      : workDuration * 60;
    
    const progress = timeLeft / totalDuration;
    const offset = circumference - progress * circumference;
    
    // Animate the transition
    const animate = () => {
      if (!timerCircleRef.current) return;
      
      timerCircleRef.current.style.transition = 'stroke-dashoffset 0.1s linear';
      timerCircleRef.current.style.strokeDashoffset = offset.toString();
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Only animate if timer is running
    if (timerState === 'running') {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // For non-running states, just set the position without animation
      timerCircleRef.current.style.transition = 'none';
      timerCircleRef.current.style.strokeDashoffset = offset.toString();
    }
    
    // Clean up animation frame on unmount or when dependencies change
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [timeLeft, isBreak, workDuration, shortBreakDuration, longBreakDuration, timerState, completedPomodoros, pomodorosBeforeLongBreak, circumference]);
  
  // Handle timer state changes
  useEffect(() => {
    // Reset the animation when the timer state changes
    if (prevTimeLeftRef.current !== timeLeft) {
      prevTimeLeftRef.current = timeLeft;
    }
  }, [timeLeft]);
  
  // Handle timer completion
  useEffect(() => {
    if (timerState === 'completed') {
      // Play a sound or show a notification
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(
            isBreak ? 'Break completed!' : 'Pomodoro completed!',
            {
              body: isBreak 
                ? 'Time to get back to work!' 
                : 'Time for a break!',
              icon: '/favicon.ico',
            }
          );
        }
      }
      
      // Auto-start break if enabled
      if (!isBreak && autoStartBreaks) {
        const isLongBreak = completedPomodoros > 0 && completedPomodoros % pomodorosBeforeLongBreak === 0;
        startBreak(isLongBreak);
      }
      
      // Auto-start next pomodoro if enabled and it was a break
      if (isBreak && autoStartPomodoros) {
        // Small delay before starting next pomodoro
        const timer = setTimeout(() => {
          startTimer();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [timerState, isBreak, autoStartBreaks, autoStartPomodoros, completedPomodoros, pomodorosBeforeLongBreak, startBreak, startTimer]);
  
  // Request notification permission on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);
  
  // Format the time for display
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Timer control handlers
  const handleStartPause = () => {
    if (timerState === 'idle' || timerState === 'paused') {
      startTimer();
    } else if (timerState === 'running') {
      stopTimer();
    }
  };
  
  const handleSkip = () => {
    if (isBreak) {
      skipBreak();
    } else {
      // For work timer, just reset to the beginning
      resetTimer();
    }
  };
  
  const handleStartBreak = (isLongBreak = false) => {
    startBreak(isLongBreak);
  };
  
  // Get the current timer mode and progress
  const getTimerMode = () => {
    if (isBreak) {
      return completedPomodoros > 0 && completedPomodoros % pomodorosBeforeLongBreak === 0
        ? 'Long Break'
        : 'Short Break';
    }
    return 'Focus Time';
  };
  
  const getProgressPercentage = () => {
    const totalDuration = isBreak 
      ? (completedPomodoros > 0 && completedPomodoros % pomodorosBeforeLongBreak === 0 
          ? longBreakDuration 
          : shortBreakDuration) * 60 
      : workDuration * 60;
    
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };
  
  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Timer Display */}
      <div className="relative w-64 h-64 mb-6">
        <svg className="w-full h-full" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="stroke-muted"
            strokeWidth="8"
            fill="none"
          />
          
          {/* Progress circle */}
          <circle
            ref={timerCircleRef}
            cx="150"
            cy="150"
            r={radius}
            className={cn(
              'transition-all duration-100 ease-linear',
              isBreak ? 'stroke-green-500' : 'stroke-primary',
              {
                'opacity-50': timerState === 'paused',
              }
            )}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            transform="rotate(-90 150 150)"
          />
          
          {/* Timer text */}
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            className="text-5xl font-bold fill-foreground"
            dy=".3em"
          >
            {displayTime}
          </text>
          
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            className="text-lg font-medium fill-muted-foreground"
          >
            {getTimerMode()}
          </text>
          
          {activeTask && (
            <text
              x="50%"
              y="70%"
              textAnchor="middle"
              className="text-sm fill-muted-foreground max-w-[80%] truncate"
            >
              {activeTask.title}
            </text>
          )}
        </svg>
        
        {/* Pomodoro count */}
        {!isBreak && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
            {Array.from({ length: pomodorosBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full',
                  i < completedPomodoros % pomodorosBeforeLongBreak
                    ? 'bg-primary'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Timer Controls */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleStartPause}
                disabled={timerState === 'completed'}
              >
                {timerState === 'running' ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{timerState === 'running' ? 'Pause' : 'Start'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={handleSkip}
                disabled={timerState === 'idle' || timerState === 'completed'}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Skip {isBreak ? 'Break' : 'Session'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={resetTimer}
                disabled={timerState === 'idle'}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStartBreak(false)}
          disabled={isBreak || timerState === 'running'}
          className="flex items-center"
        >
          <Coffee className="h-4 w-4 mr-1" />
          <span>Take a Break</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStartBreak(true)}
          disabled={isBreak || timerState === 'running'}
          className="flex items-center"
        >
          <Coffee className="h-4 w-4 mr-1" />
          <span>Long Break</span>
        </Button>
      </div>
      
      {/* Timer Settings */}
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Timer Settings</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Focus Duration</span>
              <span className="text-sm font-medium">{workDuration} min</span>
            </div>
            <Slider
              min={5}
              max={120}
              step={5}
              value={[workDuration]}
              onValueChange={([value]) => setWorkDuration(value)}
              disabled={timerState !== 'idle'}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Short Break</span>
              <span className="text-sm font-medium">{shortBreakDuration} min</span>
            </div>
            <Slider
              min={1}
              max={30}
              step={1}
              value={[shortBreakDuration]}
              onValueChange={([value]) => setShortBreakDuration(value)}
              disabled={timerState !== 'idle'}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Long Break</span>
              <span className="text-sm font-medium">{longBreakDuration} min</span>
            </div>
            <Slider
              min={5}
              max={60}
              step={5}
              value={[longBreakDuration]}
              onValueChange={([value]) => setLongBreakDuration(value)}
              disabled={timerState !== 'idle'}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Pomodoros Before Long Break</span>
              <span className="text-sm font-medium">{pomodorosBeforeLongBreak}</span>
            </div>
            <Slider
              min={1}
              max={8}
              step={1}
              value={[pomodorosBeforeLongBreak]}
              onValueChange={([value]) => setPomodorosBeforeLongBreak(value)}
              disabled={timerState !== 'idle'}
            />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm">Auto-start Breaks</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoStartBreaks}
                onChange={(e) => setAutoStartBreaks(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Auto-start Pomodoros</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoStartPomodoros}
                onChange={(e) => setAutoStartPomodoros(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Timer Presets */}
      <div className="mt-8 w-full max-w-md">
        <h3 className="text-sm font-medium mb-3">Quick Start</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Focus</h4>
            <div className="flex flex-wrap gap-2">
              {WORK_DURATIONS.map((duration) => (
                <Button
                  key={`work-${duration}`}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setWorkDuration(duration);
                    if (timerState === 'idle') {
                      startTimer();
                    }
                  }}
                  disabled={timerState === 'running'}
                >
                  {duration} min
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Break</h4>
            <div className="flex flex-wrap gap-2">
              {BREAK_DURATIONS.map((duration) => (
                <Button
                  key={`break-${duration}`}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setShortBreakDuration(duration);
                    if (timerState === 'idle' && !isBreak) {
                      startBreak(false);
                    }
                  }}
                  disabled={timerState === 'running' && !isBreak}
                >
                  {duration} min
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;
