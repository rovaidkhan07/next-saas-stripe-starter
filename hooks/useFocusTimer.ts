import { useState, useEffect, useCallback, useRef } from 'react';
import { timersApi, Timer } from '@/lib/api/timers';
import { settingsApi, UserSettings } from '@/lib/api/settings';

interface UseFocusTimerProps {
  onTimerComplete?: (completedTimer: Timer) => void;
  onBreakComplete?: () => void;
}

export const useFocusTimer = ({ onTimerComplete, onBreakComplete }: UseFocusTimerProps = {}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null);
  const [settings, setSettings] = useState<Partial<UserSettings>>({});
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const userSettings = await settingsApi.getSettings();
        setSettings(userSettings);
        setTimeLeft(userSettings.pomodoroDuration * 60);
      } catch (err) {
        setError('Failed to load timer settings');
        console.error('Error loading settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    // Clear any existing interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      handleTimerCompletion();
    }
  }, [timeLeft, isRunning]);

  const startTimer = useCallback(
    async (taskId?: string) => {
      try {
        const now = new Date().toISOString();
        const timer = await timersApi.startTimer({
          taskId,
          startTime: now,
          isBreak: false,
        });
        setActiveTimer(timer);
        setIsRunning(true);
        setTimeLeft((settings.pomodoroDuration || 25) * 60);
      } catch (err) {
        setError('Failed to start timer');
        console.error('Error starting timer:', err);
      }
    },
    [settings.pomodoroDuration]
  );

  const stopTimer = useCallback(async () => {
    if (!activeTimer) return;

    try {
      const now = new Date().toISOString();
      const endTime = new Date(now);
      const startTime = new Date(activeTimer.startTime);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const updatedTimer = await timersApi.stopTimer(activeTimer.id, now, duration);
      
      // Call the completion callback if provided
      if (onTimerComplete) {
        onTimerComplete(updatedTimer);
      }

      // Clear the interval if it exists
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setActiveTimer(null);
      setIsRunning(false);
      
      // Start a break if this was a work session
      if (!isBreak) {
        startBreak();
      }
      return updatedTimer;
    } catch (err) {
      setError('Failed to stop timer');
      console.error('Error stopping timer:', err);
      throw err;
    }
  }, [activeTimer, isBreak, onTimerComplete, onBreakComplete]);

  const toggleTimer = useCallback(async (taskId?: string) => {
    if (isRunning) {
      await stopTimer();
    } else {
      await startTimer(taskId);
    }
  }, [isRunning, startTimer, stopTimer]);

  const skipBreak = useCallback(() => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft((settings.pomodoroDuration ?? 25) * 60);
    
    if (onBreakComplete) {
      onBreakComplete();
    }
  }, [onBreakComplete, settings.pomodoroDuration]);

  const resetTimer = useCallback(() => {
    setTimeLeft(isBreak ? 
      (settings.shortBreakDuration * 60 || 5 * 60) : 
      (settings.pomodoroDuration * 60 || 25 * 60)
    );
    setIsRunning(false);
  }, [isBreak, settings.shortBreakDuration, settings.pomodoroDuration]);

  const startBreak = useCallback((isLongBreak = false) => {
    const breakDuration = isLongBreak 
      ? (settings.longBreakDuration ?? 15) * 60 
      : (settings.shortBreakDuration ?? 5) * 60;
    
    setTimeLeft(breakDuration);
    setIsBreak(true);
    setIsRunning(true);
    
    // If it's a long break, reset completed pomodoros
    if (isLongBreak) {
      setCompletedPomodoros(0);
    }
  }, [settings.longBreakDuration, settings.shortBreakDuration]);

  const handleTimerCompletion = useCallback(async () => {
    if (!activeTimer) return;
    
    try {
      const endTime = new Date();
      const startTime = new Date(activeTimer.startTime);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      await timersApi.stopTimer(
        activeTimer.id,
        endTime.toISOString(),
        duration
      );
      
      // If this was a work session, increment completed pomodoros
      if (!isBreak) {
        const newCount = completedPomodoros + 1;
        setCompletedPomodoros(newCount);
        
        // Trigger the onTimerComplete callback if this was a work session
        if (onTimerComplete) {
          onTimerComplete({
            ...activeTimer,
            endTime: endTime.toISOString(),
            duration,
          } as Timer);
        }
        
        // Start a break if enabled in settings
        if (settings.autoStartBreaks) {
          const isLongBreak = newCount >= (settings.longBreakInterval || 4);
          await startBreak(isLongBreak);
        } else {
          setIsRunning(false);
          setActiveTimer(null);
          setIsBreak(true);
          setTimeLeft(settings.shortBreakDuration * 60 || 5 * 60);
        }
      } else {
        // Break completed
        setIsRunning(false);
        setActiveTimer(null);
        setIsBreak(false);
        setTimeLeft(settings.pomodoroDuration * 60 || 25 * 60);
        
        // Auto-start next pomodoro if enabled
        if (settings.autoStartPomodoros) {
          await startTimer();
        }
        
        // Trigger the onBreakComplete callback
        if (onBreakComplete) {
          onBreakComplete();
        }
      }
    } catch (err) {
      setError('Failed to complete timer');
      console.error('Error completing timer:', err);
    }
  }, [
    activeTimer, 
    isBreak, 
    completedPomodoros, 
    settings.autoStartBreaks, 
    settings.autoStartPomodoros, 
    settings.longBreakInterval, 
    settings.shortBreakDuration, 
    settings.pomodoroDuration, 
    onTimerComplete, 
    onBreakComplete,
    startBreak,
    startTimer
  ]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // State
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isRunning,
    isBreak,
    activeTimer,
    completedPomodoros,
    settings,
    error,
    isLoading,
    
    // Actions
    startTimer,
    stopTimer,
    toggleTimer,
    skipBreak,
    resetTimer,
    startBreak,
    setTimeLeft,
    setIsBreak,
    
    // Helpers
    formatTime,
  };
};
