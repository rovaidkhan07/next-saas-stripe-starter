import { useState, useCallback } from 'react';
import { tasksApi } from '@/lib/api/tasks';

export interface AISubtaskSuggestion {
  title: string;
  description: string;
  order: number;
}

export const useAITaskBreakdown = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AISubtaskSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate subtask suggestions using AI
  const generateSubtasks = useCallback(async (taskDescription: string, existingSubtasks: string[] = []) => {
    if (!taskDescription.trim()) {
      setError('Task description is required');
      return [];
    }

    setIsGenerating(true);
    setError(null);

    try {
      // In a real implementation, this would call an AI service
      // For now, we'll simulate the AI response with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulated AI response - in a real app, this would come from an API call
      const mockAIResponse = [
        { 
          title: 'Research the topic', 
          description: 'Gather information and resources about the task',
          order: 1
        },
        { 
          title: 'Create an outline', 
          description: 'Structure the main points and subtopics',
          order: 2
        },
        { 
          title: 'Draft content', 
          description: 'Write the initial version based on the outline',
          order: 3
        },
        { 
          title: 'Review and revise', 
          description: 'Check for errors and improve the content',
          order: 4
        },
        { 
          title: 'Finalize and submit', 
          description: 'Make final adjustments and complete the task',
          order: 5
        },
      ];

      // Filter out any subtasks that are similar to existing ones
      const filteredSuggestions = mockAIResponse.filter(suggestion => 
        !existingSubtasks.some(
          existing => 
            existing.toLowerCase().includes(suggestion.title.toLowerCase()) ||
            suggestion.title.toLowerCase().includes(existing.toLowerCase())
        )
      );

      setSuggestions(filteredSuggestions);
      return filteredSuggestions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate subtask suggestions';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Add a single suggested subtask
  const addSuggestion = useCallback((suggestion: AISubtaskSuggestion) => {
    setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
    return suggestion;
  }, []);

  // Add all suggested subtasks
  const addAllSuggestions = useCallback(() => {
    const allSuggestions = [...suggestions];
    setSuggestions([]);
    return allSuggestions;
  }, [suggestions]);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Process natural language input to extract task details
  const processNaturalLanguage = useCallback(async (input: string) => {
    if (!input.trim()) {
      setError('Please enter a task description');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an NLP service
      // For now, we'll simulate the processing with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulated NLP processing - in a real app, this would come from an API call
      const processedTask = {
        title: input.split(' ').slice(0, 8).join(' ').replace(/[.,!?]$/, '') + (input.split(' ').length > 8 ? '...' : ''),
        description: input,
        priority: Math.min(Math.max(Math.floor(Math.random() * 3) + 1, 1), 3), // Random priority 1-3
      };

      return processedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process task';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get suggestions for improving a task
  const getTaskImprovementSuggestions = useCallback(async (taskTitle: string, taskDescription: string) => {
    if (!taskTitle.trim()) {
      setError('Task title is required');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call an AI service
      // For now, we'll simulate the AI response with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulated AI response - in a real app, this would come from an API call
      const suggestions = [
        'Break this task into smaller, more specific subtasks',
        'Add a due date to create urgency',
        'Set a priority level to help with task organization',
        'Add more detailed description or requirements',
        'Consider potential obstacles and plan how to overcome them'
      ];

      return suggestions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get improvement suggestions';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    suggestions,
    isLoading,
    isGenerating,
    error,
    
    // Actions
    generateSubtasks,
    addSuggestion,
    addAllSuggestions,
    clearSuggestions,
    processNaturalLanguage,
    getTaskImprovementSuggestions,
  };
};

export default useAITaskBreakdown;
