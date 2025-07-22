"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { 
  Clock, 
  Plus, 
  Bell, 
  Zap, 
  Target, 
  Brain,
  Play,
  Pause,
  Square,
  MessageCircle,
  X,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import VoiceAgent from "@/components/voice/voice-agent";

type Mood = 'energized' | 'focused' | 'neutral' | 'struggling';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface FocusSession {
  duration: number;
  completed: boolean;
  startTime?: Date;
}

export function FocusFlowDashboard() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [moodFeedback, setMoodFeedback] = useState<string>("");
  const [focusTime, setFocusTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusSession, setFocusSession] = useState<FocusSession>({ duration: 25 * 60, completed: false });
  const [streak, setStreak] = useState(7);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Review project requirements', completed: false, priority: 'high' },
    { id: '2', title: 'Complete dashboard design', completed: true, priority: 'medium' },
    { id: '3', title: 'Test voice integration', completed: false, priority: 'low' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(3);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
  }, []);

  // Update current time every second
  useEffect(() => {
    if (!mounted) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Complete session handler
  const completeSession = useCallback(() => {
    setFocusSession(prev => ({ ...prev, completed: true }));
    setCompletedSessions(prev => prev + 1);
    setStreak(prev => prev + 1);
    setIsTimerRunning(false);
    // Show completion feedback
    setMoodFeedback("🎉 Focus session completed! Great work!");
  }, []);

  // Focus timer countdown
  useEffect(() => {
    if (!mounted) return;
    
    let interval: NodeJS.Timeout;
    if (isTimerRunning && focusTime > 0) {
      interval = setInterval(() => {
        setFocusTime(time => {
          if (time <= 1) {
            // Timer completed!
            completeSession();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, focusTime, mounted, completeSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMoodSelect = useCallback((mood: Mood) => {
    setSelectedMood(mood);
    // Provide contextual feedback based on mood
    const feedbackMessages = {
      energized: "Great energy! Perfect time for challenging tasks. 🚀",
      focused: "You're in the zone! Let's tackle some deep work. 🎯",
      neutral: "Steady as she goes. A good time for routine tasks. ⚖️",
      struggling: "It's okay to have tough days. Let's start small. 💙"
    };
    setMoodFeedback(feedbackMessages[mood]);
    
    // Auto-suggest focus session duration based on mood
    const suggestedDurations = {
      energized: 45 * 60, // 45 minutes
      focused: 25 * 60,   // 25 minutes (Pomodoro)
      neutral: 20 * 60,   // 20 minutes
      struggling: 10 * 60 // 10 minutes
    };
    setFocusTime(suggestedDurations[mood]);
  }, []);

  const toggleTimer = useCallback(() => {
    if (!isTimerRunning) {
      // Starting a new session
      setFocusSession(prev => ({ ...prev, startTime: new Date() }));
    }
    setIsTimerRunning(!isTimerRunning);
  }, [isTimerRunning]);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setFocusTime(selectedMood ? {
      energized: 45 * 60,
      focused: 25 * 60,
      neutral: 20 * 60,
      struggling: 10 * 60
    }[selectedMood] : 25 * 60);
    setFocusSession(prev => ({ ...prev, completed: false, startTime: undefined }));
  }, [selectedMood]);



  // Task management functions
  const addTask = useCallback(() => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        priority: 'medium'
      };
      setTasks(prev => [...prev, newTask]);
      setNewTaskTitle("");
      setShowTaskModal(false);
    }
  }, [newTaskTitle]);

  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const getMoodIcon = (mood: Mood) => {
    switch (mood) {
      case 'energized':
        return <Zap className="w-8 h-8 text-green-400" />;
      case 'focused':
        return <Target className="w-8 h-8 text-blue-400" />;
      case 'neutral':
        return <Brain className="w-8 h-8 text-yellow-400" />;
      case 'struggling':
        return <AlertTriangle className="w-8 h-8 text-red-400" />;
    }
  };

  // Show loading state until mounted
  if (!mounted || !currentTime) {
    return (
      <div className="min-h-screen bg-gradient-main text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main text-white relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-accent rounded-full opacity-60 animate-bounce" />
        <div className="absolute top-40 right-32 w-1 h-1 bg-brand rounded-full opacity-80 animate-pulse" />
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-accent rounded-full opacity-70 animate-bounce" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-brand rounded-full opacity-60 animate-pulse" />
      </div>
      {/* Navigation */}
      <nav className="flex items-center justify-between p-8 backdrop-blur-xl bg-black/20 border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl flex items-center justify-center shadow-lg shadow-accent/25">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              FocusFlow
            </h1>
            <p className="text-sm text-gray-400">ADHD Productivity Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-lg font-mono font-medium">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-gray-400">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          <div className="relative cursor-pointer">
            <Bell className="w-6 h-6 text-gray-400 hover:text-white transition-colors" />
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
          </div>
          <div className="w-10 h-10 bg-gradient-gold-alt rounded-full border-2 border-white/20 cursor-pointer" />
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8 relative z-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">
            Welcome back, {session?.user?.name || 'Focus Champion'}! 👋
          </h2>
          <p className="text-xl text-gray-300">
            Your focus streak is on fire! Let's keep the momentum going.
          </p>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Mood Check-in Card */}
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                How are you feeling?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around gap-3 mt-4">
                {(['energized', 'focused', 'neutral', 'struggling'] as Mood[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => handleMoodSelect(mood)}
                    className={`w-15 h-15 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 bg-white/5 border-2 hover:scale-110 hover:bg-white/10 ${
                      selectedMood === mood ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-400/25' : 'border-transparent'
                    }`}
                    title={`I'm feeling ${mood}`}
                  >
                    {getMoodIcon(mood)}
                  </button>
                ))}
              </div>
              {moodFeedback && (
                <div className="mt-4 p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
                  <p className="text-sm text-cyan-300 text-center">{moodFeedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Focus Session Card */}
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                Focus Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-bold font-mono text-center my-6 bg-gradient-to-br from-cyan-400 to-purple-600 bg-clip-text text-transparent">
                {formatTime(focusTime)}
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-purple-600 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${((selectedMood ? {
                      energized: 45 * 60,
                      focused: 25 * 60,
                      neutral: 20 * 60,
                      struggling: 10 * 60
                    }[selectedMood] : 25 * 60) - focusTime) / (selectedMood ? {
                      energized: 45 * 60,
                      focused: 25 * 60,
                      neutral: 20 * 60,
                      struggling: 10 * 60
                    }[selectedMood] : 25 * 60) * 100}%` 
                  }}
                />
              </div>
              
              <div className="flex gap-3 justify-center mb-4">
                <Button
                  onClick={toggleTimer}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6"
                >
                  {isTimerRunning ? (
                    <><Pause className="w-4 h-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Start</>
                  )}
                </Button>
                <Button
                  onClick={resetTimer}
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/15"
                >
                  <Square className="w-4 h-4 mr-2" /> Reset
                </Button>
                {focusTime === 0 && (
                  <Button
                    onClick={completeSession}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Target className="w-4 h-4 mr-2" /> Complete
                  </Button>
                )}
              </div>
              
              <div className="text-center text-sm text-gray-400">
                Sessions today: <Badge variant="secondary">{completedSessions}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:bg-white/8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                Focus Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-7xl font-extrabold text-center my-4 bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent">
                {streak}
              </div>
              <div className="text-center text-gray-400 text-lg">
                Days in a row
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button 
            onClick={() => setShowTaskModal(true)}
            className="h-20 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg"
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Task
          </Button>
          <Button 
            onClick={toggleTimer}
            className="h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg"
          >
            <Target className="w-6 h-6 mr-2" />
            {isTimerRunning ? 'Pause Focus' : 'Start Focus'}
          </Button>
          <Button 
            onClick={() => window.location.href = '/adhdai'}
            className="h-20 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-lg"
          >
            <Brain className="w-6 h-6 mr-2" />
            ADHD AI
          </Button>
          <Button 
            onClick={() => {
              setMoodFeedback("Take a deep breath. You've got this! Try a 5-minute focus session.");
              setFocusTime(5 * 60);
            }}
            className="h-20 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg"
          >
            <AlertTriangle className="w-6 h-6 mr-2" />
            Need Help
          </Button>
        </div>

        {/* Task Management Section */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Today's Tasks
          </h3>
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                  task.completed 
                    ? 'bg-green-500/10 border-green-500/30 text-green-300' 
                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-400 hover:border-cyan-400'
                      }`}
                    >
                      {task.completed && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={task.completed ? 'line-through opacity-60' : ''}>
                      {task.title}
                    </span>
                    <Badge 
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => deleteTask(task.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-8 left-8 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/70 z-50"
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </button>

      {/* Panic Button */}
      <button className="fixed bottom-8 right-8 w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/70 z-50 animate-pulse">
        <AlertTriangle className="w-9 h-9 text-white" />
      </button>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Task</h3>
              <Button
                onClick={() => setShowTaskModal(false)}
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowTaskModal(false)}
                  variant="ghost"
                  className="hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addTask}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Add Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Chat Modal with Voice Agent */}
      {isChatOpen && (
        <div className="fixed bottom-32 right-8 w-96 h-96 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col z-50">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              AI Coach
            </h3>
            <Button
              onClick={() => setIsChatOpen(false)}
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-5 flex flex-col items-center justify-center">
            <div className="text-center text-gray-400 mb-6">
              <Brain className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <p className="font-medium">Your ADHD AI Assistant</p>
              <p className="text-sm mt-2">Click the microphone to talk with me!</p>
            </div>
            
            {/* Voice Agent Integration */}
            <div className="flex flex-col items-center gap-4">
              <VoiceAgent />
              <p className="text-xs text-gray-500 text-center">
                I can help with focus tips, task planning,<br />and productivity strategies.
              </p>
            </div>
            
            {/* Quick AI Prompts */}
            <div className="mt-4 space-y-2 w-full">
              <Button
                onClick={() => {
                  setMoodFeedback("Try the 2-minute rule: if a task takes less than 2 minutes, do it now!");
                }}
                variant="ghost"
                size="sm"
                className="w-full text-xs hover:bg-white/10 text-gray-300"
              >
                💡 Give me a productivity tip
              </Button>
              <Button
                onClick={() => {
                  const incompleteTasks = tasks.filter(t => !t.completed).length;
                  setMoodFeedback(`You have ${incompleteTasks} tasks remaining. Let's tackle the most important one first!`);
                }}
                variant="ghost"
                size="sm"
                className="w-full text-xs hover:bg-white/10 text-gray-300"
              >
                📋 Review my tasks
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
