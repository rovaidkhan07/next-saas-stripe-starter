'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useADHDAI } from '@/contexts/adhdai';
import { useAITaskBreakdown } from '@/hooks/useAITaskBreakdown';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { formatDueDate, isTaskOverdue, getPriorityInfo } from '@/lib/utils/taskUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Mic, Sparkles, Loader2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TaskManagerProps {
  className?: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ className }) => {
  const {
    tasks,
    selectedTask,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    createSubtask,
    updateSubtask,
    toggleSubtaskCompletion,
    deleteSubtask,
    selectTask,
  } = useADHDAI();

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3>(2);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState<Record<string, boolean>>({});
  
  const taskFormRef = useRef<HTMLDivElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // AI Task Breakdown
  const {
    suggestions,
    isGenerating,
    generateSubtasks,
    addSuggestion,
    addAllSuggestions,
    clearSuggestions,
    processNaturalLanguage,
  } = useAITaskBreakdown();

  // Voice Input
  const {
    isListening,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    onResult: (text, isFinal) => {
      if (isFinal) {
        if (isAddingSubtask && selectedTask) {
          setNewSubtaskTitle(text);
          subtaskInputRef.current?.focus();
        } else if (isCreatingTask) {
          setNewTaskTitle(text);
        }
        stopListening();
      }
    },
    onError: (error) => {
      console.error('Voice input error:', error);
    },
  });

  // Toggle task details (show/hide subtasks)
  const toggleTaskDetails = (taskId: string) => {
    setShowTaskDetails(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  // Handle voice input toggle
  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  // Handle creating a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskTitle.trim()) return;
    
    try {
      await createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
        dueDate: newTaskDueDate || undefined,
        priority: newTaskPriority,
      });
      
      // Reset form
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setNewTaskPriority(2);
      setIsCreatingTask(false);
      
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Handle adding a new subtask
  const handleAddSubtask = async (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    
    if (!newSubtaskTitle.trim()) return;
    
    try {
      await createSubtask(taskId, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      
      // Keep the subtask input focused after adding
      if (subtaskInputRef.current) {
        subtaskInputRef.current.focus();
      }
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  // Handle AI task breakdown
  const handleAITaskBreakdown = async (taskId: string, taskDescription: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const existingSubtasks = task?.subtasks?.map(st => st.title) || [];
      await generateSubtasks(taskDescription, existingSubtasks);
    } catch (error) {
      console.error('Error generating subtasks:', error);
    }
  };

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    task.subtasks?.some(subtask => 
      subtask.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subtask.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    )
  );

  // Group tasks by completion status
  const completedTasks = filteredTasks.filter(task => task.completed);
  const incompleteTasks = filteredTasks.filter(task => !task.completed);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsCreatingTask(!isCreatingTask)}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* New Task Form */}
      {isCreatingTask && (
        <div 
          ref={taskFormRef}
          className="bg-card p-4 rounded-lg border mb-6 animate-in fade-in"
        >
          <form onSubmit={handleCreateTask}>
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <div className="flex-1 space-y-2">
                  <Input
                    type="text"
                    placeholder="Task title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="text-base font-medium"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2">
                    <Input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="flex-1"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" type="button" className="w-32 justify-between">
                          {getPriorityInfo(newTaskPriority).label}
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setNewTaskPriority(1)}>
                          <span className="text-red-500 mr-2">•</span> High
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setNewTaskPriority(2)}>
                          <span className="text-yellow-500 mr-2">•</span> Medium
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setNewTaskPriority(3)}>
                          <span className="text-green-500 mr-2">•</span> Low
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreatingTask(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newTaskTitle.trim()}>
                  Add Task
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto pr-2">
        {incompleteTasks.length === 0 && !searchQuery ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {incompleteTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'bg-card border rounded-lg overflow-hidden transition-all',
                  selectedTask?.id === task.id && 'ring-2 ring-primary/50',
                  isTaskOverdue(task) && 'border-red-500/50'
                )}
              >
                <div className="p-4">
                  <div className="flex items-start">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={(checked) => 
                        toggleTaskCompletion(task.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div 
                      className="flex-1 ml-3 cursor-pointer"
                      onClick={() => selectTask(task)}
                    >
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`task-${task.id}`}
                          className={cn(
                            'text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                            task.completed && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </Label>
                        <div className="flex items-center space-x-2">
                          {task.dueDate && (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              isTaskOverdue(task) 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                                : 'bg-muted text-muted-foreground'
                            )}>
                              {formatDueDate(task.dueDate)}
                            </span>
                          )}
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              getPriorityInfo(task.priority).bgColor,
                              getPriorityInfo(task.priority).color
                            )}
                          >
                            {getPriorityInfo(task.priority).label}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskDetails(task.id);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {showTaskDetails[task.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                      
                      {/* Subtask progress */}
                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{
                                width: `${(task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100}%`
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.subtasks.filter(st => st.completed).length} of {task.subtasks.length} subtasks
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Subtasks */}
                  {(showTaskDetails[task.id] || task.subtasks?.some(st => !st.completed)) && (
                    <div className="mt-3 pl-7 space-y-2">
                      {task.subtasks?.map((subtask) => (
                        <div key={subtask.id} className="flex items-center">
                          <Checkbox
                            id={`subtask-${subtask.id}`}
                            checked={subtask.completed}
                            onCheckedChange={(checked) => 
                              toggleSubtaskCompletion(task.id, subtask.id, checked as boolean)
                            }
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor={`subtask-${subtask.id}`}
                            className={cn(
                              'ml-2 text-sm leading-none',
                              subtask.completed && 'line-through text-muted-foreground'
                            )}
                          >
                            {subtask.title}
                          </Label>
                        </div>
                      ))}
                      
                      {/* Add Subtask */}
                      {!isAddingSubtask ? (
                        <button
                          onClick={() => {
                            setIsAddingSubtask(true);
                            setTimeout(() => {
                              subtaskInputRef.current?.focus();
                            }, 0);
                          }}
                          className="flex items-center text-sm text-muted-foreground hover:text-foreground mt-1"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add subtask
                        </button>
                      ) : (
                        <form 
                          onSubmit={(e) => handleAddSubtask(e, task.id)}
                          className="flex items-center mt-1"
                        >
                          <Input
                            ref={subtaskInputRef}
                            type="text"
                            placeholder="Add a subtask"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            className="h-8 text-sm"
                            onBlur={() => {
                              if (!newSubtaskTitle.trim()) {
                                setIsAddingSubtask(false);
                              }
                            }}
                          />
                          <div className="flex ml-2">
                            {isVoiceSupported && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleVoiceInput();
                                }}
                              >
                                <Mic className={cn(
                                  "h-4 w-4",
                                  isListening && "text-red-500 animate-pulse"
                                )} />
                              </Button>
                            )}
                            <Button 
                              type="submit" 
                              size="sm" 
                              variant="ghost"
                              disabled={!newSubtaskTitle.trim()}
                            >
                              Add
                            </Button>
                          </div>
                        </form>
                      )}
                      
                      {/* AI Suggestions */}
                      {suggestions.length > 0 && (
                        <div className="mt-2 border-t pt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              AI Suggestions
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => addAllSuggestions()}
                                className="text-xs text-primary hover:underline"
                              >
                                Add all
                              </button>
                              <button
                                onClick={clearSuggestions}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {suggestions.map((suggestion, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-2 text-sm bg-muted/30 rounded"
                              >
                                <span>{suggestion.title}</span>
                                <button
                                  onClick={() => addSuggestion(suggestion)}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Task Actions */}
                <div className="border-t bg-muted/30 px-4 py-2 flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAITaskBreakdown(task.id, task.description || task.title)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                      )}
                      <span>AI Breakdown</span>
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Handle edit
                      }}
                    >
                      Edit
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Task</DialogTitle>
                        </DialogHeader>
                        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-2 mt-4">
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button 
                              variant="destructive"
                              onClick={() => deleteTask(task.id)}
                            >
                              Delete
                            </Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Completed ({completedTasks.length})
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-muted/30 border rounded-lg p-4 opacity-70"
                    >
                      <div className="flex items-center">
                        <Checkbox
                          id={`completed-task-${task.id}`}
                          checked={task.completed}
                          onCheckedChange={(checked) => 
                            toggleTaskCompletion(task.id, checked as boolean)
                          }
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`completed-task-${task.id}`}
                          className="ml-3 text-sm line-through text-muted-foreground"
                        >
                          {task.title}
                        </Label>
                        <div className="ml-auto flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(task.updatedAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground"
                            onClick={() => deleteTask(task.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;
