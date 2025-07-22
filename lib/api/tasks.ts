import { apiClient } from './client';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
}

export const tasksApi = {
  // Get all tasks
  getTasks: async (): Promise<Task[]> => {
    return apiClient.get<Task[]>('adhdai/tasks');
  },

  // Get a single task by ID
  getTask: async (id: string): Promise<Task> => {
    return apiClient.get<Task>(`adhdai/tasks/${id}`);
  },

  // Create a new task
  createTask: async (data: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: number;
    subtasks?: Array<{ title: string; description?: string; order?: number }>;
  }): Promise<Task> => {
    return apiClient.post<Task>('adhdai/tasks', data);
  },

  // Update a task
  updateTask: async (
    id: string,
    data: {
      title?: string;
      description?: string | null;
      dueDate?: string | null;
      priority?: number;
      completed?: boolean;
    }
  ): Promise<Task> => {
    return apiClient.patch<Task>(`adhdai/tasks/${id}`, data);
  },

  // Delete a task
  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`adhdai/tasks/${id}`);
  },

  // Create a subtask
  createSubtask: async (data: {
    taskId: string;
    title: string;
    description?: string;
    order?: number;
  }): Promise<Subtask> => {
    return apiClient.post<Subtask>('adhdai/subtasks', data);
  },

  // Update a subtask
  updateSubtask: async (
    id: string,
    data: {
      title?: string;
      description?: string | null;
      completed?: boolean;
      order?: number;
    }
  ): Promise<Subtask> => {
    return apiClient.patch<Subtask>(`adhdai/subtasks/${id}`, data);
  },

  // Delete a subtask
  deleteSubtask: async (id: string): Promise<void> => {
    await apiClient.delete(`adhdai/subtasks/${id}`);
  },

  // Toggle task completion
  toggleTaskCompletion: async (id: string, completed: boolean): Promise<Task> => {
    return apiClient.patch<Task>(`adhdai/tasks/${id}`, { completed });
  },

  // Toggle subtask completion
  toggleSubtaskCompletion: async (
    id: string,
    completed: boolean
  ): Promise<Subtask> => {
    return apiClient.patch<Subtask>(`adhdai/subtasks/${id}`, { completed });
  },
};

export default tasksApi;
