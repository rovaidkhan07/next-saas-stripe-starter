'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Calendar, CheckCircle, Clock, Target } from 'lucide-react';

type DailyStats = {
  date: string;
  completed: number;
  total: number;
};

type ProductivityData = {
  day: string;
  focusTime: number;
  completedTasks: number;
};

export function ProgressTracker() {
  // Mock data - in a real app, this would come from your database
  const weeklyData: ProductivityData[] = [
    { day: 'Mon', focusTime: 120, completedTasks: 3 },
    { day: 'Tue', focusTime: 90, completedTasks: 5 },
    { day: 'Wed', focusTime: 45, completedTasks: 2 },
    { day: 'Thu', focusTime: 180, completedTasks: 6 },
    { day: 'Fri', focusTime: 60, completedTasks: 4 },
    { day: 'Sat', focusTime: 30, completedTasks: 1 },
    { day: 'Sun', focusTime: 0, completedTasks: 0 },
  ];

  const dailyStats: DailyStats = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    completed: 18,
    total: 30,
  };

  const completionPercentage = Math.round((dailyStats.completed / dailyStats.total) * 100);
  const averageFocusTime = Math.round(weeklyData.reduce((sum, day) => sum + day.focusTime, 0) / 7);
  const totalTasksCompleted = weeklyData.reduce((sum, day) => sum + day.completedTasks, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today's Progress</CardDescription>
            <CardTitle className="text-4xl">{completionPercentage}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {dailyStats.completed} of {dailyStats.total} tasks completed
            </div>
            <Progress value={completionPercentage} className="h-2 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Daily Focus</CardDescription>
            <CardTitle className="text-4xl flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              {averageFocusTime}m
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Average daily focus time this week
            </div>
            <div className="mt-1 text-sm">
              <span className="text-green-500">+15%</span> from last week
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Weekly Tasks</CardDescription>
            <CardTitle className="text-4xl flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              {totalTasksCompleted}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Tasks completed this week
            </div>
            <div className="mt-1 text-sm">
              <span className="text-green-500">+5</span> from last week
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Productivity</CardTitle>
          <CardDescription>
            Your focus time and completed tasks over the past week
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background p-4 border rounded-lg shadow-lg">
                        <p className="font-medium">{payload[0].payload.day}</p>
                        <p className="text-sm">
                          <span className="text-[#8884d8]">Focus Time:</span> {payload[0].payload.focusTime} min
                        </p>
                        <p className="text-sm">
                          <span className="text-[#82ca9d]">Tasks Completed:</span> {payload[0].payload.completedTasks}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="focusTime" 
                name="Focus Time (min)" 
                fill="#8884d8" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right" 
                dataKey="completedTasks" 
                name="Tasks Completed" 
                fill="#82ca9d" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-amber-500" />
              Weekly Goals
            </CardTitle>
            <CardDescription>Your progress towards this week's targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Focus Time</span>
                <span className="text-sm">8/10 hours</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Tasks Completed</span>
                <span className="text-sm">18/25 tasks</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Daily Consistency</span>
                <span className="text-sm">5/7 days</span>
              </div>
              <Progress value={71} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Daily Insights
            </CardTitle>
            <CardDescription>Your most productive times and patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Most Productive Time</p>
              <p className="text-sm text-muted-foreground">10:00 AM - 12:00 PM</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Average Session Length</p>
              <p className="text-sm text-muted-foreground">45 minutes</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Focus Streak</p>
              <p className="text-sm text-muted-foreground">3 days in a row</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Best Day This Week</p>
              <p className="text-sm text-muted-foreground">Thursday (180 minutes)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
