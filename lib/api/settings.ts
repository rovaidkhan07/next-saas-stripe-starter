import { apiClient } from './client';

export interface UserSettings {
  id: string;
  userId: string;
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notifications: boolean;
  sound: boolean;
  theme: 'system' | 'light' | 'dark';
  dailyGoal: number;
  weeklyGoal: number;
  taskReminders: boolean;
  breakReminders: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  completedPomodoros: number;
  totalFocusTime: number;
  completedTasks: number;
  currentStreak: number;
  longestStreak: number;
  lastActive: string | null;
}

export const settingsApi = {
  // Get user settings
  getSettings: async (): Promise<UserSettings> => {
    return apiClient.get<UserSettings>('adhdai/settings');
  },

  // Update user settings
  updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
    return apiClient.patch<UserSettings>('adhdai/settings', data);
  },

  // Get user statistics
  getStats: async (startDate: string, endDate: string): Promise<UserStats> => {
    return apiClient.post<UserStats>('adhdai/settings/stats', {
      startDate,
      endDate,
    });
  },

  // Get today's statistics
  getTodaysStats: async (): Promise<UserStats> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return settingsApi.getStats(today.toISOString(), tomorrow.toISOString());
  },

  // Get this week's statistics
  getThisWeeksStats: async (): Promise<UserStats> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the first day of the week (Sunday)
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    
    // Get the last day of the week (Saturday)
    const lastDayOfWeek = new Date(today);
    lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    lastDayOfWeek.setHours(23, 59, 59, 999);
    
    return settingsApi.getStats(
      firstDayOfWeek.toISOString(),
      lastDayOfWeek.toISOString()
    );
  },
};

export default settingsApi;
