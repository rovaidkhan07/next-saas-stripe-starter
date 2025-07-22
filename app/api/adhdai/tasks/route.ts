import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Input validation schemas
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.number().min(1).max(3).default(2),
  subtasks: z.array(
    z.object({
      title: z.string().min(1, 'Subtask title is required'),
      description: z.string().optional(),
      order: z.number(),
    })
  ).optional(),
});

// GET /api/adhdai/tasks - Get all tasks for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      include: {
        subtasks: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/adhdai/tasks - Create a new task
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = taskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { subtasks, ...taskData } = validation.data;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId: session.user.id,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        subtasks: subtasks && subtasks.length > 0 ? {
          create: subtasks.map((subtask, index) => ({
            ...subtask,
            order: subtask.order || index,
          })),
        } : undefined,
      },
      include: {
        subtasks: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
