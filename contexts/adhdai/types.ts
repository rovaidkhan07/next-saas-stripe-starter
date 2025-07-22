import { Task, Subtask } from '@/lib/api/tasks';
import { Timer } from '@/lib/api/timers';
import { UserSettings, UserStats } from '@/lib/api/settings';

export type TimerState = 'idle' | 'running' | 'paused' | 'completed' | 'break';

export type VideoAssistantState = 'idle' | 'connecting' | 'active' | 'error';

export interface VideoAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface VideoAssistantSession {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  messages: VideoAssistantMessage[];
  isActive: boolean;
}

export interface ADHDAIContextType {
  // Timer state
  timerState: TimerState;
  timeLeft: number;
  isBreak: boolean;
  activeTask: Task | null;
  completedPomodoros: number;
  
  // Tasks state
  tasks: Task[];
  selectedTask: Task | null;
  
  // User settings and stats
  settings: Partial<UserSettings>;
  stats: Partial<UserStats>;
  productivityScore: number;
  productivityMessage: string;
  streakMessage: string;
  
  // Timer actions
  startTimer: (taskId?: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  toggleTimer: (taskId?: string) => Promise<void>;
  resetTimer: () => void;
  startBreak: (isLongBreak?: boolean) => Promise<void>;
  skipBreak: () => void;
  
  // Task actions
  createTask: (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: number;
    subtasks?: Array<{ title: string; description?: string }>;
  }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string, completed: boolean) => Promise<void>;
  selectTask: (task: Task | null) => void;
  
  // Subtask actions
  createSubtask: (taskId: string, title: string, description?: string) => Promise<Subtask>;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<Subtask>;
  toggleSubtaskCompletion: (taskId: string, subtaskId: string, completed: boolean) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  
  // Settings actions
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
  
  // Video Assistant state
  videoAssistant: {
    state: VideoAssistantState;
    isActive: boolean;
    messages: VideoAssistantMessage[];
    currentSession: VideoAssistantSession | null;
    error: string | null;
  };
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Helper functions
  formatTime: (seconds: number) => string;
  getTaskProgress: (task: Task) => number;
  
  // Video Assistant actions
  startVideoAssistant: () => Promise<void>;
  stopVideoAssistant: () => Promise<void>;
  sendMessageToAssistant: (message: string) => Promise<void>;
  endVideoSession: () => Promise<void>;
}

export interface ADHDAIProviderProps {
  children: React.ReactNode;
}
