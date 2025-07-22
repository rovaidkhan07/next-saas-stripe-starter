import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Input validation schema
const timerSchema = z.object({
  taskId: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  isBreak: z.boolean().default(false),
  notes: z.string().optional(),
});

// POST /api/adhdai/timers - Create a new timer session
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = timerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { taskId, ...timerData } = validation.data;

    // If taskId is provided, verify the task belongs to the user
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { 
          id: taskId,
          userId: session.user.id,
        },
      });

      if (!task) {
        return NextResponse.json(
          { error: 'Task not found or access denied' },
          { status: 404 }
        );
      }
    }

    const timer = await prisma.timer.create({
      data: {
        ...timerData,
        userId: session.user.id,
        taskId: taskId || null,
        startTime: new Date(timerData.startTime),
        endTime: timerData.endTime ? new Date(timerData.endTime) : null,
      },
    });

    return NextResponse.json(timer, { status: 201 });
  } catch (error) {
    console.error('Error creating timer:', error);
    return NextResponse.json(
      { error: 'Failed to create timer' },
      { status: 500 }
    );
  }
}

// GET /api/adhdai/timers - Get user's timer sessions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isBreak = searchParams.get('isBreak');
    const taskId = searchParams.get('taskId');

    const where: any = { userId: session.user.id };
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }
    
    if (isBreak) where.isBreak = isBreak === 'true';
    if (taskId) where.taskId = taskId;

    const timers = await prisma.timer.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(timers);
  } catch (error) {
    console.error('Error fetching timers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timers' },
      { status: 500 }
    );
  }
}
