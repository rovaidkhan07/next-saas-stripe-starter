import { useState, useEffect, useCallback } from 'react';
import { settingsApi, UserSettings, UserStats } from '@/lib/api/settings';

export const useUserSettings = () => {
  const [settings, setSettings] = useState<Partial<UserSettings>>({});
  const [stats, setStats] = useState<Partial<UserStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user settings
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await settingsApi.getSettings();
      setSettings(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial settings
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Update user settings
  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedSettings = await settingsApi.updateSettings(updates);
      setSettings(prev => ({ ...prev, ...updatedSettings }));
      return updatedSettings;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user statistics
  const loadStats = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await settingsApi.getStats(startDate.toISOString(), endDate.toISOString());
      setStats(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load today's statistics
  const loadTodaysStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return loadStats(today, tomorrow);
  }, [loadStats]);

  // Load this week's statistics
  const loadThisWeeksStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the first day of the week (Sunday)
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    
    // Get the last day of the week (Saturday)
    const lastDayOfWeek = new Date(today);
    lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));
    lastDayOfWeek.setHours(23, 59, 59, 999);
    
    return loadStats(firstDayOfWeek, lastDayOfWeek);
  }, [loadStats]);

  // Format time in hours and minutes
  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Calculate productivity score (0-100)
  const calculateProductivityScore = useCallback((stats: Partial<UserStats>) => {
    const { completedPomodoros = 0, totalFocusTime = 0, completedTasks = 0 } = stats;
    
    // Weights for different metrics (adjust as needed)
    const WEIGHTS = {
      pomodoros: 0.4,
      focusTime: 0.4,
      tasks: 0.2,
    };
    
    // Normalize values (adjust max values based on your app's scale)
    const pomodoroScore = Math.min(completedPomodoros / 10, 1) * 100; // Max 10 pomodoros = 100%
    const focusTimeScore = Math.min(totalFocusTime / (60 * 8), 1) * 100; // Max 8 hours = 100%
    const taskScore = Math.min(completedTasks / 5, 1) * 100; // Max 5 tasks = 100%
    
    // Calculate weighted score
    const score = 
      (pomodoroScore * WEIGHTS.pomodoros) +
      (focusTimeScore * WEIGHTS.focusTime) +
      (taskScore * WEIGHTS.tasks);
    
    return Math.round(score);
  }, []);

  // Get current productivity score
  const productivityScore = calculateProductivityScore(stats);

  // Get productivity level (low, medium, high)
  const getProductivityLevel = useCallback((score: number) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }, []);

  // Get productivity message based on score
  const getProductivityMessage = useCallback((score: number) => {
    const level = getProductivityLevel(score);
    
    const messages = {
      high: [
        'Amazing work! You\'re on fire today! 🔥',
        'Incredible productivity! Keep it up! 🚀',
        'You\'re crushing it! 💪',
      ],
      medium: [
        'Good job! You\'re making solid progress. 👍',
        'Keep going! You\'re on the right track. 👏',
        'Nice work! Every bit of progress counts. 🌟',
      ],
      low: [
        'Every journey starts with a single step. You\'ve got this! 💫',
        'It\'s okay to start small. What matters is that you start. 🌱',
        'Progress, not perfection. Keep going! 🌈',
      ],
    };
    
    const levelMessages = messages[level as keyof typeof messages];
    return levelMessages[Math.floor(Math.random() * levelMessages.length)];
  }, [getProductivityLevel]);

  // Get current productivity message
  const productivityMessage = getProductivityMessage(productivityScore);

  // Get current streak message
  const getStreakMessage = useCallback((currentStreak: number, longestStreak: number) => {
    if (currentStreak === 0) {
      return 'Start a new streak by completing a task today!';
    }
    
    if (currentStreak === 1) {
      return 'You\'re on a 1-day streak! Keep it going tomorrow!';
    }
    
    if (currentStreak === longestStreak) {
      return `🔥 ${currentStreak}-day streak! That's your best so far!`;
    }
    
    return `🔥 ${currentStreak}-day streak! Your best is ${longestStreak} days.`;
  }, []);

  // Get current streak message
  const streakMessage = getStreakMessage(stats.currentStreak || 0, stats.longestStreak || 0);

  return {
    // State
    settings,
    stats,
    isLoading,
    error,
    productivityScore,
    productivityLevel: getProductivityLevel(productivityScore),
    productivityMessage,
    streakMessage,
    
    // Actions
    loadSettings,
    updateSettings,
    loadStats,
    loadTodaysStats,
    loadThisWeeksStats,
    
    // Helpers
    formatTime,
    calculateProductivityScore,
    getProductivityLevel,
    getProductivityMessage,
    getStreakMessage,
  };
};
