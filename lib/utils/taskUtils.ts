import { Task, Subtask } from '@/lib/api/tasks';

/**
 * Calculate the progress percentage of a task based on its subtasks
 * @param task The task to calculate progress for
 * @returns A number between 0 and 100 representing the completion percentage
 */
export const calculateTaskProgress = (task: Task): number => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.completed ? 100 : 0;
  }
  
  const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
  return Math.round((completedSubtasks / task.subtasks.length) * 100);
};

/**
 * Filter tasks based on a search query
 * @param tasks Array of tasks to filter
 * @param query Search query string
 * @returns Filtered array of tasks
 */
export const filterTasksByQuery = (tasks: Task[], query: string): Task[] => {
  if (!query.trim()) return tasks;
  
  const lowerQuery = query.toLowerCase();
  
  return tasks.filter(task => 
    task.title.toLowerCase().includes(lowerQuery) ||
    (task.description?.toLowerCase().includes(lowerQuery) ?? false) ||
    task.subtasks?.some(subtask => 
      subtask.title.toLowerCase().includes(lowerQuery) ||
      (subtask.description?.toLowerCase().includes(lowerQuery) ?? false)
    )
  );
};

/**
 * Sort tasks by different criteria
 * @param tasks Array of tasks to sort
 * @param sortBy Sort criteria ('dueDate', 'priority', 'title', 'createdAt')
 * @param order Sort order ('asc' or 'desc')
 * @returns Sorted array of tasks
 */
export const sortTasks = (
  tasks: Task[], 
  sortBy: 'dueDate' | 'priority' | 'title' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
): Task[] => {
  const sorted = [...tasks];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'dueDate':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        comparison = dateA - dateB;
        break;
        
      case 'priority':
        // Higher priority (lower number) comes first
        comparison = a.priority - b.priority;
        break;
        
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
        
      case 'createdAt':
      default:
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        comparison = timeA - timeB;
        break;
    }
    
    // Handle the sort order
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
};

/**
 * Group tasks by status (completed/incomplete)
 * @param tasks Array of tasks to group
 * @returns Object with 'completed' and 'incomplete' task arrays
 */
export const groupTasksByStatus = (tasks: Task[]) => {
  return tasks.reduce<{ completed: Task[]; incomplete: Task[] }>(
    (acc, task) => {
      if (task.completed) {
        acc.completed.push(task);
      } else {
        acc.incomplete.push(task);
      }
      return acc;
    },
    { completed: [], incomplete: [] }
  );
};

/**
 * Get the priority label and color for a task
 * @param priority Priority level (1-3)
 * @returns Object with label and color properties
 */
export const getPriorityInfo = (priority: number) => {
  switch (priority) {
    case 1:
      return { label: 'High', color: 'text-red-500', bgColor: 'bg-red-100' };
    case 2:
      return { label: 'Medium', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    case 3:
      return { label: 'Low', color: 'text-green-500', bgColor: 'bg-green-100' };
    default:
      return { label: 'Medium', color: 'text-gray-500', bgColor: 'bg-gray-100' };
  }
};

/**
 * Format a date string for display
 * @param dateString ISO date string
 * @returns Formatted date string (e.g., "Today", "Tomorrow", "Mon, Jan 1")
 */
export const formatDueDate = (dateString: string | null): string => {
  if (!dateString) return 'No due date';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const date = new Date(dateString);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    // Check if the date is within the next 7 days
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    if (dateOnly > today && dateOnly < nextWeek) {
      // Return day name for dates in the next 7 days
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      // Return formatted date for other dates
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }
};

/**
 * Check if a task is overdue
 * @param task The task to check
 * @returns Boolean indicating if the task is overdue
 */
export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.completed) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  
  return dueDate < today;
};

/**
 * Get the number of completed subtasks for a task
 * @param task The task to check
 * @returns Number of completed subtasks
 */
export const getCompletedSubtasksCount = (task: Task): number => {
  if (!task.subtasks || task.subtasks.length === 0) return 0;
  return task.subtasks.filter(subtask => subtask.completed).length;
};

/**
 * Get the total number of subtasks for a task
 * @param task The task to check
 * @returns Total number of subtasks
 */
export const getTotalSubtasksCount = (task: Task): number => {
  return task.subtasks?.length || 0;
};
