import { NextRequest, NextResponse } from 'next/server';
import { loadSchedules, saveSchedules } from '@/lib/autoblog/gcs-storage';

export async function GET() {
  try {
    const schedules = await loadSchedules();
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { slug, scheduledAt, title } = await request.json();

    if (!slug || !scheduledAt) {
      return NextResponse.json(
        { error: 'Slug and scheduledAt are required' },
        { status: 400 }
      );
    }

    const schedules = await loadSchedules();
    const newSchedule = {
      id: Date.now().toString(),
      slug,
      title: title || slug,
      scheduledAt,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    schedules.push(newSchedule);
    await saveSchedules(schedules);

    return NextResponse.json({
      success: true,
      schedule: newSchedule
    });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const schedules = await loadSchedules();
    const filtered = schedules.filter((s: any) => s.id !== id);

    if (filtered.length === schedules.length) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    await saveSchedules(filtered);

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
