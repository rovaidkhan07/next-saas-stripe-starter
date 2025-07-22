import { apiClient } from './client';

export interface Timer {
  id: string;
  userId: string;
  taskId: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  isBreak: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  task?: {
    id: string;
    title: string;
  } | null;
}

export interface ExtendedTimer extends Timer {
  intervalId?: NodeJS.Timeout | null;
}

export const timersApi = {
  // Get all timers with optional filters
  getTimers: async (params?: {
    startDate?: string;
    endDate?: string;
    isBreak?: boolean;
    taskId?: string;
  }): Promise<Timer[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.isBreak !== undefined) queryParams.append('isBreak', String(params.isBreak));
    if (params?.taskId) queryParams.append('taskId', params.taskId);
    
    const queryString = queryParams.toString();
    const url = `adhdai/timers${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<Timer[]>(url);
  },

  // Get a single timer by ID
  getTimer: async (id: string): Promise<Timer> => {
    return apiClient.get<Timer>(`adhdai/timers/${id}`);
  },

  // Start a new timer
  startTimer: async (data: {
    taskId?: string;
    startTime: string;
    isBreak?: boolean;
  }): Promise<Timer> => {
    return apiClient.post<Timer>('adhdai/timers', {
      ...data,
      startTime: new Date(data.startTime).toISOString(),
    });
  },

  // Stop a timer
  stopTimer: async (
    id: string,
    endTime: string,
    duration: number,
    notes?: string
  ): Promise<Timer> => {
    return apiClient.patch<Timer>(`adhdai/timers/${id}`, {
      endTime: new Date(endTime).toISOString(),
      duration,
      ...(notes && { notes }),
    });
  },

  // Update timer notes
  updateTimerNotes: async (id: string, notes: string): Promise<Timer> => {
    return apiClient.patch<Timer>(`adhdai/timers/${id}`, { notes });
  },

  // Delete a timer
  deleteTimer: async (id: string): Promise<void> => {
    await apiClient.delete(`adhdai/timers/${id}`);
  },
};

export default timersApi;
