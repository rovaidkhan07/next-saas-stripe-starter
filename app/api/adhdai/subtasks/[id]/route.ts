import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Input validation schema for updates
const subtaskUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  order: z.number().optional(),
});

// GET /api/adhdai/subtasks/[id] - Get a specific subtask
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subtask = await prisma.subtask.findUnique({
      where: { id: params.id },
      include: {
        task: {
          select: { userId: true },
        },
      },
    });

    if (!subtask || subtask.task.userId !== session.user.id) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    return NextResponse.json(subtask);
  } catch (error) {
    console.error('Error fetching subtask:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtask' },
      { status: 500 }
    );
  }
}

// PATCH /api/adhdai/subtasks/[id] - Update a subtask
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = subtaskUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    // First, verify the subtask belongs to the user
    const existingSubtask = await prisma.subtask.findUnique({
      where: { id: params.id },
      include: {
        task: {
          select: { userId: true },
        },
      },
    });

    if (!existingSubtask || existingSubtask.task.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Subtask not found or access denied' },
        { status: 404 }
      );
    }

    const updatedSubtask = await prisma.subtask.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json(
      { error: 'Failed to update subtask' },
      { status: 500 }
    );
  }
}

// DELETE /api/adhdai/subtasks/[id] - Delete a subtask
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, verify the subtask belongs to the user
    const existingSubtask = await prisma.subtask.findUnique({
      where: { id: params.id },
      include: {
        task: {
          select: { userId: true },
        },
      },
    });

    if (!existingSubtask || existingSubtask.task.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Subtask not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.subtask.delete({
      where: { id: params.id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json(
      { error: 'Failed to delete subtask' },
      { status: 500 }
    );
  }
}
