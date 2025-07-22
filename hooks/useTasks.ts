import { useState, useEffect, useCallback } from 'react';
import { tasksApi, Task, Subtask } from '@/lib/api/tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all tasks
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await tasksApi.getTasks();
      setTasks(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial tasks
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create a new task
  const createTask = useCallback(async (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: number;
    subtasks?: Array<{ title: string; description?: string }>;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const newTask = await tasksApi.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedTask = await tasksApi.updateTask(id, updates);
      
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, ...updatedTask } : task
        )
      );
      
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...prev, ...updatedTask } : null);
      }
      
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask]);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await tasksApi.deleteTask(id);
      
      setTasks(prev => prev.filter(task => task.id !== id));
      
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete task';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask]);

  // Toggle task completion
  const toggleTaskCompletion = useCallback(async (id: string, completed: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedTask = await tasksApi.toggleTaskCompletion(id, completed);
      
      setTasks(prev => 
        prev.map(task => 
          task.id === id ? { ...task, completed } : task
        )
      );
      
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...prev, completed } : null);
      }
      
      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update task status';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask]);

  // Create a subtask
  const createSubtask = useCallback(async (taskId: string, title: string, description?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const newSubtask = await tasksApi.createSubtask({
        taskId,
        title,
        description,
      });
      
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId
            ? {
                ...task,
                subtasks: [...(task.subtasks || []), newSubtask],
              }
            : task
        )
      );
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => 
          prev 
            ? {
                ...prev,
                subtasks: [...(prev.subtasks || []), newSubtask],
              }
            : null
        );
      }
      
      return newSubtask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create subtask';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask]);

  // Update a subtask
  const updateSubtask = useCallback(async (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedSubtask = await tasksApi.updateSubtask(subtaskId, updates);
      
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks?.map(subtask =>
                  subtask.id === subtaskId ? { ...subtask, ...updatedSubtask } : subtask
                ) || [],
              }
            : task
        )
      );
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => 
          prev
            ? {
                ...prev,
                subtasks: prev.subtasks?.map(subtask =>
                  subtask.id === subtaskId ? { ...subtask, ...updatedSubtask } : subtask
                ) || [],
              }
            : null
        );
      }
      
      return updatedSubtask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subtask';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask]);

  // Toggle subtask completion
  const toggleSubtaskCompletion = useCallback(async (taskId: string, subtaskId: string, completed: boolean) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedSubtask = await tasksApi.toggleSubtaskCompletion(subtaskId, completed);
      
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks?.map(subtask =>
                  subtask.id === subtaskId ? { ...subtask, completed } : subtask
                ) || [],
              }
            : task
        )
      );
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => 
          prev
            ? {
                ...prev,
                subtasks: prev.subtasks?.map(subtask =>
                  subtask.id === subtaskId ? { ...subtask, completed } : subtask
                ) || [],
              }
            : null
        );
      }
      
      // Check if all subtasks are completed and update parent task if needed
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const allSubtasksCompleted = task.subtasks?.every(st => st.completed) || false;
        if (allSubtasksCompleted !== task.completed) {
          await toggleTaskCompletion(taskId, allSubtasksCompleted);
        }
      }
      
      return updatedSubtask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subtask status';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask, tasks, toggleTaskCompletion]);

  // Delete a subtask
  const deleteSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await tasksApi.deleteSubtask(subtaskId);
      
      setTasks(prev => 
        prev.map(task => 
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks?.filter(subtask => subtask.id !== subtaskId) || [],
              }
            : task
        )
      );
      
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => 
          prev
            ? {
                ...prev,
                subtasks: prev.subtasks?.filter(subtask => subtask.id !== subtaskId) || [],
              }
            : null
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete subtask';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask]);

  // Get task progress
  const getTaskProgress = useCallback((task: Task) => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.completed ? 100 : 0;
    }
    
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  }, []);

  return {
    // State
    tasks,
    selectedTask,
    isLoading,
    error,
    
    // Actions
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    createSubtask,
    updateSubtask,
    toggleSubtaskCompletion,
    deleteSubtask,
    setSelectedTask,
    
    // Helpers
    getTaskProgress,
  };
};
