'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, Mic, StopCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

type Subtask = {
  id: string;
  text: string;
  completed: boolean;
};

type Task = {
  id: string;
  text: string;
  completed: boolean;
  subtasks: Subtask[];
  createdAt: Date;
};

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          
          setNewTask(transcript);
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          toast({
            title: 'Error',
            description: 'Could not access your microphone. Please check permissions.',
            variant: 'destructive',
          });
        };
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          toast({
            title: 'Error',
            description: 'Could not start voice input. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Not supported',
          description: 'Speech recognition is not supported in your browser.',
          variant: 'destructive',
        });
      }
    }
  };

  const generateSubtasksWithAI = async (taskText: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call your AI service
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock AI response - in a real app, this would come from your AI service
      const mockSubtasks = [
        `Break down "${taskText}" into smaller steps`,
        'Research and gather information',
        'Create an outline or plan',
        'Execute the first step',
        'Review and refine',
      ];
      
      const newTask: Task = {
        id: Date.now().toString(),
        text: taskText,
        completed: false,
        subtasks: mockSubtasks.map((text, index) => ({
          id: `${Date.now()}-${index}`,
          text,
          completed: false,
        })),
        createdAt: new Date(),
      };
      
      setTasks(prev => [newTask, ...prev]);
      setNewTask('');
      
      toast({
        title: 'Task added',
        description: 'Your task has been broken down into subtasks.',
      });
    } catch (error) {
      console.error('Error generating subtasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate subtasks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    await generateSubtasksWithAI(newTask);
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
            }
          : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // Calculate completion percentage for a task
  const getTaskProgress = (task: Task) => {
    if (task.subtasks.length === 0) return task.completed ? 100 : 0;
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
          <CardDescription>
            Describe your task and we'll help you break it down into manageable steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="What do you need to do?"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={toggleListening}
                >
                  {isListening ? (
                    <StopCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <Button type="submit" disabled={isLoading || !newTask.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </>
                )}
              </Button>
            </div>
            {isListening && (
              <p className="text-sm text-muted-foreground">
                Listening... Speak now to add a task with your voice.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Tasks</h2>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tasks yet. Add one above to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="overflow-hidden">
                <div className="flex items-start p-4">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor={`task-${task.id}`}
                        className={`text-sm font-medium leading-none ${
                          task.completed ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {task.text}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {getTaskProgress(task)}% complete
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTask(task.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${getTaskProgress(task)}%` }}
                      />
                    </div>
                    
                    {task.subtasks.length > 0 && (
                      <div className="mt-3 space-y-2 pl-4 border-l-2 border-muted">
                        {task.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`subtask-${subtask.id}`}
                              checked={subtask.completed}
                              onCheckedChange={() =>
                                toggleSubtask(task.id, subtask.id)
                              }
                            />
                            <Label
                              htmlFor={`subtask-${subtask.id}`}
                              className={`text-sm ${
                                subtask.completed
                                  ? 'line-through text-muted-foreground'
                                  : ''
                              }`}
                            >
                              {subtask.text}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
