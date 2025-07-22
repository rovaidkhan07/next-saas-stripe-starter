import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Input validation schema for user settings
const settingsSchema = z.object({
  pomodoroDuration: z.number().min(1).max(120).default(25),
  shortBreakDuration: z.number().min(1).max(60).default(5),
  longBreakDuration: z.number().min(1).max(60).default(15),
  longBreakInterval: z.number().min(1).default(4),
  autoStartBreaks: z.boolean().default(false),
  autoStartPomodoros: z.boolean().default(false),
  notifications: z.boolean().default(true),
  sound: z.boolean().default(true),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  dailyGoal: z.number().min(1).default(4),
  weeklyGoal: z.number().min(1).default(20),
  taskReminders: z.boolean().default(true),
  breakReminders: z.boolean().default(true),
});

// GET /api/adhdai/settings - Get user settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          pomodoroDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          longBreakInterval: 4,
          autoStartBreaks: false,
          autoStartPomodoros: false,
          notifications: true,
          sound: true,
          theme: 'system',
          dailyGoal: 4,
          weeklyGoal: 20,
          taskReminders: true,
          breakReminders: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

// PATCH /api/adhdai/settings - Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = settingsSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Upsert settings (create if not exists, update if exists)
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: validation.data,
      create: {
        userId: session.user.id,
        ...validation.data,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}

// GET /api/adhdai/settings/stats - Get user statistics
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate } = await request.json();
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Get completed pomodoros within date range
    const completedPomodoros = await prisma.timer.count({
      where: {
        userId: session.user.id,
        isBreak: false,
        endTime: {
          not: null,
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    // Get total focus time in minutes
    const focusTimeResult = await prisma.timer.aggregate({
      where: {
        userId: session.user.id,
        isBreak: false,
        endTime: {
          not: null,
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _sum: {
        duration: true,
      },
    });

    // Get completed tasks
    const completedTasks = await prisma.task.count({
      where: {
        userId: session.user.id,
        completed: true,
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });

    // Get streak information
    const streak = await prisma.userStreak.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      completedPomodoros,
      totalFocusTime: focusTimeResult._sum.duration || 0,
      completedTasks,
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      lastActive: streak?.lastActive,
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
