'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { useTasks } from '@/hooks/useTasks';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Task, Subtask } from '@/lib/api/tasks';
import { UserSettings, UserStats } from '@/lib/api/settings';
import { Timer } from '@/lib/api/timers';
import { ADHDAIContextType, ADHDAIProviderProps, VideoAssistantState, VideoAssistantMessage, VideoAssistantSession } from './types';
import { v4 as uuidv4 } from 'uuid';

// Create the context with a default value
const ADHDAIContext = createContext<ADHDAIContextType | undefined>(undefined);

// Custom hook to use the ADHDAI context
export const useADHDAI = (): ADHDAIContextType => {
  const context = useContext(ADHDAIContext);
  if (context === undefined) {
    throw new Error('useADHDAI must be used within an ADHDAIProvider');
  }
  return context;
};

export const ADHDAIProvider: React.FC<ADHDAIProviderProps> = ({ children }) => {
  // Use our custom hooks
  const {
    // Timer state
    timeLeft,
    isRunning,
    isBreak,
    activeTimer,
    completedPomodoros,
    
    // Timer actions
    startTimer: startTimerHook,
    stopTimer: stopTimerHook,
    toggleTimer: toggleTimerHook,
    resetTimer,
    startBreak,
    skipBreak,
    
    // Formatting
    formatTime,
  } = useFocusTimer({
    onTimerComplete: (completedTimer) => {
      // Handle when a timer completes (e.g., show notification, update stats)
      console.log('Timer completed:', completedTimer);
      reloadTasks();
      reloadSettings();
    },
    onBreakComplete: () => {
      // Handle when a break completes
      console.log('Break completed');
      reloadSettings();
    },
  });

  const {
    // Tasks state
    tasks,
    selectedTask,
    
    // Tasks actions
    createTask: createTaskHook,
    updateTask: updateTaskHook,
    deleteTask: deleteTaskHook,
    toggleTaskCompletion: toggleTaskCompletionHook,
    createSubtask: createSubtaskHook,
    updateSubtask: updateSubtaskHook,
    toggleSubtaskCompletion: toggleSubtaskCompletionHook,
    deleteSubtask: deleteSubtaskHook,
    setSelectedTask,
    loadTasks: reloadTasks,
    
    // Helpers
    getTaskProgress,
  } = useTasks();

  const {
    // Settings state
    settings,
    stats,
    productivityScore,
    productivityMessage,
    streakMessage,
    
    // Settings actions
    updateSettings: updateSettingsHook,
    loadSettings: reloadSettings,
    loadTodaysStats,
    loadThisWeeksStats,
    
    // Formatting
    formatTime: formatTimeFromSettings,
  } = useUserSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Video Assistant state
  const [videoAssistantState, setVideoAssistantState] = useState<VideoAssistantState>('idle');
  const [videoAssistantMessages, setVideoAssistantMessages] = useState<VideoAssistantMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<VideoAssistantSession | null>(null);
  const [videoAssistantError, setVideoAssistantError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          reloadTasks(),
          reloadSettings(),
          loadTodaysStats(),
          loadThisWeeksStats(),
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [reloadTasks, reloadSettings, loadTodaysStats, loadThisWeeksStats]);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      // Clean up media streams
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Timer state
  const getTimerState = (): 'idle' | 'running' | 'paused' | 'completed' | 'break' => {
    if (isBreak) return 'break';
    if (isRunning) return 'running';
    if (timeLeft <= 0) return 'completed';
    return 'idle';
  };

  // Wrapper functions to ensure proper error handling and state updates
  const startTimer = useCallback(async (taskId?: string) => {
    try {
      await startTimerHook(taskId);
      // If we started a timer with a task, make sure it's selected
      if (taskId && (!selectedTask || selectedTask.id !== taskId)) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
        }
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      throw error;
    }
  }, [startTimerHook, selectedTask, tasks, setSelectedTask]);

  const stopTimer = useCallback(async () => {
    try {
      await stopTimerHook();
    } catch (error) {
      console.error('Error stopping timer:', error);
      throw error;
    }
  }, [stopTimerHook]);

  const toggleTimer = useCallback(async (taskId?: string) => {
    try {
      await toggleTimerHook(taskId);
      // If we're starting a timer with a task, make sure it's selected
      if (taskId && isRunning && (!selectedTask || selectedTask.id !== taskId)) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
        }
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
      throw error;
    }
  }, [toggleTimerHook, isRunning, selectedTask, tasks, setSelectedTask]);

  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: number;
    subtasks?: Array<{ title: string; description?: string }>;
  }) => {
    try {
      const newTask = await createTaskHook(taskData);
      await reloadTasks(); // Refresh the tasks list
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }, [createTaskHook, reloadTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await updateTaskHook(id, updates);
      await reloadTasks(); // Refresh the tasks list
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [updateTaskHook, reloadTasks]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await deleteTaskHook(id);
      // If the deleted task was selected, clear the selection
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
      await reloadTasks(); // Refresh the tasks list
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }, [deleteTaskHook, selectedTask, setSelectedTask, reloadTasks]);

  const toggleTaskCompletion = useCallback(async (id: string, completed: boolean) => {
    try {
      await toggleTaskCompletionHook(id, completed);
      await reloadTasks(); // Refresh the tasks list
      await reloadSettings(); // Refresh stats
    } catch (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  }, [toggleTaskCompletionHook, reloadTasks, reloadSettings]);

  const createSubtask = useCallback(async (taskId: string, title: string, description?: string) => {
    try {
      const newSubtask = await createSubtaskHook(taskId, title, description);
      await reloadTasks(); // Refresh the tasks list
      return newSubtask;
    } catch (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }
  }, [createSubtaskHook, reloadTasks]);

  const updateSubtask = useCallback(async (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    try {
      const updatedSubtask = await updateSubtaskHook(taskId, subtaskId, updates);
      await reloadTasks(); // Refresh the tasks list
      return updatedSubtask;
    } catch (error) {
      console.error('Error updating subtask:', error);
      throw error;
    }
  }, [updateSubtaskHook, reloadTasks]);

  const toggleSubtaskCompletion = useCallback(async (taskId: string, subtaskId: string, completed: boolean) => {
    try {
      await toggleSubtaskCompletionHook(taskId, subtaskId, completed);
      await reloadTasks(); // Refresh the tasks list
      await reloadSettings(); // Refresh stats
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      throw error;
    }
  }, [toggleSubtaskCompletionHook, reloadTasks, reloadSettings]);

  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    try {
      await deleteSubtaskHook(taskId, subtaskId);
      await reloadTasks(); // Refresh the tasks list
    } catch (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  }, [deleteSubtaskHook, reloadTasks]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      await updateSettingsHook(updates);
      await reloadSettings(); // Refresh settings
      await loadTodaysStats(); // Refresh today's stats
      await loadThisWeeksStats(); // Refresh this week's stats
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, [updateSettingsHook, reloadSettings, loadTodaysStats, loadThisWeeksStats]);

  // Video Assistant functions
  const startVideoAssistant = useCallback(async () => {
    try {
      setVideoAssistantState('connecting');
      setVideoAssistantError(null);
      
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      mediaStreamRef.current = stream;
      
      // Create a new session
      const newSession: VideoAssistantSession = {
        id: uuidv4(),
        startedAt: new Date(),
        messages: [],
        isActive: true,
      };
      
      setCurrentSession(newSession);
      setVideoAssistantState('active');
      
      // Add welcome message
      const welcomeMessage: VideoAssistantMessage = {
        id: uuidv4(),
        sender: 'assistant',
        content: "Hello! I'm your ADHD assistant. How can I help you stay focused today?",
        timestamp: new Date(),
      };
      
      setVideoAssistantMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('Error starting video assistant:', error);
      setVideoAssistantState('error');
      setVideoAssistantError('Could not access camera/microphone. Please check permissions.');
    }
  }, []);
  
  const stopVideoAssistant = useCallback(async () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setVideoAssistantState('idle');
    setVideoAssistantMessages([]);
    setVideoAssistantError(null);
    
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        endedAt: new Date(),
        isActive: false,
      });
    }
  }, [currentSession]);
  
  const sendMessageToAssistant = useCallback(async (message: string) => {
    if (!currentSession || videoAssistantState !== 'active') return;
    
    // Add user message
    const userMessage: VideoAssistantMessage = {
      id: uuidv4(),
      sender: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setVideoAssistantMessages(prev => [...prev, userMessage]);
    
    try {
      // TODO: Integrate with D-ID API or your backend service
      // For now, simulate a response
      setTimeout(() => {
        const responseMessage: VideoAssistantMessage = {
          id: uuidv4(),
          sender: 'assistant',
          content: `I received your message: "${message}". This is a simulated response.`,
          timestamp: new Date(),
        };
        setVideoAssistantMessages(prev => [...prev, responseMessage]);
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message to assistant:', error);
      setVideoAssistantError('Failed to send message to assistant');
    }
  }, [currentSession, videoAssistantState]);
  
  const endVideoSession = useCallback(async () => {
    await stopVideoAssistant();
    setCurrentSession(null);
  }, [stopVideoAssistant]);

  // Context value
  const contextValue: ADHDAIContextType = {
    // Timer state
    timerState: getTimerState(),
    timeLeft,
    isBreak,
    activeTask: activeTimer?.taskId ? tasks.find(t => t.id === activeTimer.taskId) || null : null,
    completedPomodoros,
    
    // Tasks state
    tasks,
    selectedTask,
    
    // User settings and stats
    settings,
    stats,
    productivityScore,
    productivityMessage,
    streakMessage,
    
    // Video Assistant state
    videoAssistant: {
      state: videoAssistantState,
      isActive: videoAssistantState === 'active',
      messages: videoAssistantMessages,
      currentSession,
      error: videoAssistantError,
    },
    
    // Timer actions
    startTimer,
    stopTimer,
    toggleTimer,
    resetTimer,
    startBreak: (isLongBreak = false) => {
      startBreak(isLongBreak);
      return Promise.resolve();
    },
    skipBreak,
    
    // Task actions
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    selectTask: setSelectedTask,
    
    // Subtask actions
    createSubtask,
    updateSubtask,
    toggleSubtaskCompletion,
    deleteSubtask,
    
    // Settings actions
    updateSettings,
    reloadSettings: async () => {
      await reloadSettings();
      return Promise.resolve();
    },
    
    // UI state
    isLoading,
    error,
    
    // Helper functions
    formatTime,
    getTaskProgress,
    
    // Video Assistant actions
    startVideoAssistant,
    stopVideoAssistant,
    sendMessageToAssistant,
    endVideoSession,
  };

  return (
    <ADHDAIContext.Provider value={contextValue}>
      {children}
    </ADHDAIContext.Provider>
  );
};

export default ADHDAIContext;
