import { Timer } from '@/lib/api/timers';

/**
 * Format seconds into a human-readable time string (MM:SS)
 * @param seconds Number of seconds
 * @returns Formatted time string (e.g., "25:00", "05:30")
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format milliseconds into a human-readable duration string
 * @param ms Milliseconds
 * @returns Formatted duration string (e.g., "2h 30m", "45m 30s")
 */
export const formatDuration = (ms: number): string => {
  if (!ms && ms !== 0) return '0s';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  const parts = [];
  
  if (days > 0) parts.push(`${days}d`);
  if (remainingHours > 0) parts.push(`${remainingHours}h`);
  if (remainingMinutes > 0 && days === 0) parts.push(`${remainingMinutes}m`);
  if (remainingSeconds > 0 && hours === 0 && days === 0) parts.push(`${remainingSeconds}s`);
  
  return parts.length > 0 ? parts.join(' ') : '0s';
};

/**
 * Calculate the total focused time from an array of timers
 * @param timers Array of timer objects
 * @param onlyCompleted Whether to only include completed timers
 * @returns Total focused time in milliseconds
 */
export const calculateTotalFocusedTime = (timers: Timer[], onlyCompleted: boolean = true): number => {
  return timers.reduce((total, timer) => {
    // If we only want completed timers and this one isn't completed, skip it
    if (onlyCompleted && (!timer.endTime || !timer.duration)) {
      return total;
    }
    
    // If we have a duration, use that (preferred)
    if (timer.duration) {
      return total + (timer.duration * 1000); // Convert seconds to milliseconds
    }
    
    // Otherwise calculate the duration from start and end times
    if (timer.startTime && timer.endTime) {
      const start = new Date(timer.startTime).getTime();
      const end = new Date(timer.endTime).getTime();
      return total + (end - start);
    }
    
    return total;
  }, 0);
};

/**
 * Group timers by day
 * @param timers Array of timer objects
 * @returns Object with dates as keys and arrays of timers as values
 */
export const groupTimersByDay = (timers: Timer[]) => {
  return timers.reduce<Record<string, Timer[]>>((acc, timer) => {
    if (!timer.startTime) return acc;
    
    const date = new Date(timer.startTime);
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    
    acc[dateString].push(timer);
    return acc;
  }, {});
};

/**
 * Get the most recent timer
 * @param timers Array of timer objects
 * @returns The most recent timer or null if no timers exist
 */
export const getMostRecentTimer = (timers: Timer[]): Timer | null => {
  if (timers.length === 0) return null;
  
  return [...timers].sort((a, b) => {
    const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
    const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
    return timeB - timeA; // Sort in descending order (newest first)
  })[0];
};

/**
 * Get the total number of completed pomodoros
 * @param timers Array of timer objects
 * @returns Number of completed pomodoros (timers that are not breaks)
 */
export const getCompletedPomodoros = (timers: Timer[]): number => {
  return timers.filter(timer => !timer.isBreak && timer.endTime).length;
};

/**
 * Calculate the average focus session length
 * @param timers Array of timer objects
 * @returns Average session length in minutes
 */
export const calculateAverageSessionLength = (timers: Timer[]): number => {
  const completedTimers = timers.filter(timer => 
    !timer.isBreak && timer.endTime && timer.duration
  );
  
  if (completedTimers.length === 0) return 0;
  
  const totalMinutes = completedTimers.reduce((sum, timer) => {
    return sum + (timer.duration || 0) / 60; // Convert seconds to minutes
  }, 0);
  
  return Math.round(totalMinutes / completedTimers.length);
};

/**
 * Get the most productive day of the week based on focused time
 * @param timers Array of timer objects
 * @returns Object with day name and total focused time in minutes
 */
export const getMostProductiveDay = (timers: Timer[]) => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const dayTotals = timers.reduce<Record<string, number>>((acc, timer) => {
    if (!timer.startTime) return acc;
    
    const date = new Date(timer.startTime);
    const dayName = daysOfWeek[date.getDay()];
    const duration = timer.duration || 0; // in seconds
    
    acc[dayName] = (acc[dayName] || 0) + duration;
    return acc;
  }, {});
  
  if (Object.keys(dayTotals).length === 0) {
    return { day: 'No data', minutes: 0 };
  }
  
  // Find the day with the most focused time
  const [day, seconds] = Object.entries(dayTotals).reduce((max, current) => {
    return current[1] > max[1] ? current : max;
  }, ['', 0]);
  
  return {
    day,
    minutes: Math.round(seconds / 60) // Convert seconds to minutes
  };
};

/**
 * Get the current streak of days with at least one completed pomodoro
 * @param timers Array of timer objects
 * @returns Current streak in days
 */
export const getCurrentStreak = (timers: Timer[]): number => {
  // Filter for completed pomodoros and get unique dates
  const completedDates = new Set(
    timers
      .filter(timer => !timer.isBreak && timer.endTime)
      .map(timer => {
        const date = new Date(timer.endTime!);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      })
  );
  
  const dates = Array.from(completedDates).sort().reverse(); // Newest first
  
  if (dates.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Check if today has a completed pomodoro
  const today = currentDate.toISOString().split('T')[0];
  const hasToday = dates.some(date => date.startsWith(today));
  
  // If today doesn't have a completed pomodoro, check yesterday
  if (!hasToday) {
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  // Count consecutive days with completed pomodoros
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (dates.some(date => date.startsWith(dateStr))) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};
