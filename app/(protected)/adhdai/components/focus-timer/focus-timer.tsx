'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

export function FocusTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_MINUTES * 60);
  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK_MINUTES);
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK_MINUTES);
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start or pause the timer
  const toggleTimer = () => {
    if (isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } else {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished, switch mode
            clearInterval(timerRef.current!);
            const newIsBreak = !isBreak;
            setIsBreak(newIsBreak);
            return (newIsBreak ? breakDuration : workDuration) * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setIsRunning(!isRunning);
  };

  // Reset the timer
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRunning(false);
    setTimeLeft((isBreak ? breakDuration : workDuration) * 60);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update timer when work/break durations change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft((isBreak ? breakDuration : workDuration) * 60);
    }
  }, [workDuration, breakDuration, isBreak, isRunning]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">
            {isBreak ? 'Break Time' : 'Focus Time'}
          </CardTitle>
          <CardDescription>
            {isBreak ? 'Take a short break' : 'Time to focus on your tasks'}
          </CardDescription>
        </div>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Timer Settings</DialogTitle>
              <DialogDescription>
                Adjust your work and break durations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="work-duration" className="text-right">
                  Work (minutes)
                </Label>
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  value={workDuration}
                  onChange={(e) => setWorkDuration(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="break-duration" className="text-right">
                  Break (minutes)
                </Label>
                <Input
                  id="break-duration"
                  type="number"
                  min="1"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
        <div className="text-7xl font-bold tracking-tighter">
          {formatTime(timeLeft)}
        </div>
        <div className="flex space-x-4">
          <Button 
            size="lg" 
            onClick={toggleTimer}
            className="w-24"
          >
            {isRunning ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={resetTimer}
            className="w-24"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
