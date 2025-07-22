import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Input validation schema for updates
const timerUpdateSchema = z.object({
  endTime: z.string().optional(),
  duration: z.number().optional(),
  notes: z.string().optional(),
  isBreak: z.boolean().optional(),
});

// GET /api/adhdai/timers/[id] - Get a specific timer session
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timer = await prisma.timer.findUnique({
      where: { id: params.id, userId: session.user.id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!timer) {
      return NextResponse.json({ error: 'Timer not found' }, { status: 404 });
    }

    return NextResponse.json(timer);
  } catch (error) {
    console.error('Error fetching timer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timer' },
      { status: 500 }
    );
  }
}

// PATCH /api/adhdai/timers/[id] - Update a timer session
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
    const validation = timerUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { endTime, ...updateData } = validation.data;
    
    const updatedTimer = await prisma.timer.update({
      where: { id: params.id, userId: session.user.id },
      data: {
        ...updateData,
        ...(endTime && { endTime: new Date(endTime) }),
      },
    });

    return NextResponse.json(updatedTimer);
  } catch (error) {
    console.error('Error updating timer:', error);
    return NextResponse.json(
      { error: 'Failed to update timer' },
      { status: 500 }
    );
  }
}

// DELETE /api/adhdai/timers/[id] - Delete a timer session
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.timer.delete({
      where: { id: params.id, userId: session.user.id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting timer:', error);
    return NextResponse.json(
      { error: 'Failed to delete timer' },
      { status: 500 }
    );
  }
}
