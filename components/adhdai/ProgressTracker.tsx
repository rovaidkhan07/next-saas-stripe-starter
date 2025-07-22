'use client';

import React, { useState, useEffect } from 'react';
import { useADHDAI } from '@/contexts/adhdai';
import { format, subDays, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, Flame, Target, Zap, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const timeRanges = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
];

const ProgressTracker: React.FC = () => {
  const { stats, productivityScore, productivityMessage, streakMessage } = useADHDAI();
  const [selectedRange, setSelectedRange] = useState('week');
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Generate chart data based on selected time range
  useEffect(() => {
    const generateChartData = () => {
      let days = 7; // Default to week
      let formatStr = 'EEE'; // Day name format
      
      if (selectedRange === 'month') {
        days = 30;
        formatStr = 'MMM d';
      } else if (selectedRange === 'year') {
        days = 12;
        formatStr = 'MMM';
      }
      
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);
      
      const dateArray = eachDayOfInterval({
        start: startDate,
        end: endDate,
      });
      
      // This is a simplified example - in a real app, you would fetch actual data for these dates
      const data = dateArray.map((date, index) => {
        // Simulate some data - replace with actual data from your API
        const baseValue = Math.floor(Math.random() * 10) + 5;
        const completedTasks = Math.floor(Math.random() * 10) + 1;
        const focusTime = Math.floor(Math.random() * 240) + 30; // 30-270 minutes
        
        return {
          date: format(date, formatStr),
          completedTasks,
          focusTime,
          productivity: Math.min(100, Math.floor((completedTasks / 12) * 100) + (focusTime > 180 ? 20 : 0)),
        };
      });
      
      setChartData(data);
      setIsLoading(false);
    };
    
    generateChartData();
  }, [selectedRange]);
  
  // Load weekly stats when component mounts
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        // Stats are loaded via context automatically
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStats();
  }, []);
  
  // Calculate completion percentage for daily goals
  const calculateGoalProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };
  
  // Get the current day's data for the daily progress component
  const getTodaysData = () => {
    if (chartData.length === 0) return null;
    return chartData[chartData.length - 1];
  };
  
  const todaysData = getTodaysData();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Progress Tracker</h2>
          <p className="text-muted-foreground">Track your productivity and achievements</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {timeRanges.map((range) => (
            <Button
              key={range.id}
              variant={selectedRange === range.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRange(range.id)}
              disabled={isLoading}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          {['overview', 'tasks', 'focus', 'habits'].map((tab) => (
            <button
              key={tab}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Productivity Score Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                  Productivity Score
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <Badge variant="outline" className="px-2 py-0.5">
                    {productivityScore}/100
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={productivityScore} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {productivityMessage}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Flame className="h-4 w-4 mr-1 text-orange-500" />
                  <span>{streakMessage}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<CheckCircle className="h-5 w-5" />}
              title="Tasks Completed"
              value={stats?.completedTasks || 0}
              change={0}
              target={5}
            />
            
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              title="Focus Time"
              value={`${Math.floor((stats?.totalFocusTime || 0) / 60)}h ${(stats?.totalFocusTime || 0) % 60}m`}
              change={0}
              target={120}
              isTime={true}
            />
            
            <StatCard
              icon={<Flame className="h-5 w-5" />}
              title="Current Streak"
              value={`${stats?.currentStreak || 0} days`}
              change={0}
              isStreak={true}
            />
            
            <StatCard
              icon={<Target className="h-5 w-5" />}
              title="Goals Achieved"
              value={`${0}/${0}`}
              change={0}
            />
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  Tasks Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completedTasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  Focus Time
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="focusTime"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Minutes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Daily Progress */}
          {todaysData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tasks Completed</span>
                      <span className="font-medium">
                        {todaysData.completedTasks} <span className="text-muted-foreground">/ 12</span>
                      </span>
                    </div>
                    <Progress 
                      value={calculateGoalProgress(todaysData.completedTasks, 12)} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Focus Time</span>
                      <span className="font-medium">
                        {Math.floor(todaysData.focusTime / 60)}h {todaysData.focusTime % 60}m 
                        <span className="text-muted-foreground">/ 4h</span>
                      </span>
                    </div>
                    <Progress 
                      value={calculateGoalProgress(todaysData.focusTime, 240)} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Productivity</span>
                      <span className="font-medium">{todaysData.productivity}%</span>
                    </div>
                    <Progress 
                      value={todaysData.productivity} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, action: 'Completed task', title: 'Finish project proposal', time: '2 hours ago', completed: true },
                  { id: 2, action: 'Started focus session', title: 'Deep work', time: '3 hours ago', completed: false },
                  { id: 3, action: 'Created task', title: 'Review PR #42', time: '5 hours ago', completed: false },
                  { id: 4, action: 'Completed task', title: 'Team standup', time: '1 day ago', completed: true },
                  { id: 5, action: 'Started break', title: 'Lunch break', time: '1 day ago', completed: true },
                ].map((activity) => (
                  <div key={activity.id} className="flex items-start pb-3 border-b last:border-0 last:pb-0">
                    <div className={cn(
                      'h-2 w-2 rounded-full mt-2 mr-3',
                      activity.completed ? 'bg-green-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{activity.action}</span>
                        <span className="text-sm text-muted-foreground">{activity.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper component for stat cards
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: number;
  target?: number;
  isTime?: boolean;
  isStreak?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  change = 0,
  target,
  isTime = false,
  isStreak = false,
}) => {
  const isPositive = change > 0;
  const hasTarget = typeof target !== 'undefined';
  const progress = hasTarget && typeof value === 'number' 
    ? Math.min(100, Math.round((value / target) * 100))
    : 0;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="rounded-lg p-2 bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        
        {!isStreak && hasTarget && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Target: {isTime ? `${Math.floor(target! / 60)}h ${target! % 60}m` : target}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
        
        {change !== 0 && (
          <div className={cn(
            'mt-2 text-xs font-medium flex items-center justify-end',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? '↑' : '↓'} {Math.abs(change)}% from last period
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
