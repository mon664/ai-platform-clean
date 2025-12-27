import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const SCHEDULES_FILE = path.join(STORAGE_DIR, 'schedules.json');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * GET: 예약된 글 목록
 */
export async function GET() {
  try {
    ensureStorageDir();
    if (fs.existsSync(SCHEDULES_FILE)) {
      const data = fs.readFileSync(SCHEDULES_FILE, 'utf-8');
      const schedules = JSON.parse(data);
      return NextResponse.json({ schedules });
    }
    return NextResponse.json({ schedules: [] });
  } catch (error: any) {
    console.error('[Schedule List] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load schedules' },
      { status: 500 }
    );
  }
}

/**
 * POST: 새 예약 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { slug, title, content, scheduledAt, accountId } = await request.json();

    if (!slug || !scheduledAt) {
      return NextResponse.json(
        { error: 'Slug and scheduledAt are required' },
        { status: 400 }
      );
    }

    ensureStorageDir();
    let schedules: any[] = [];

    if (fs.existsSync(SCHEDULES_FILE)) {
      schedules = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));
    }

    const schedule = {
      id: Date.now().toString(),
      slug,
      title: title || 'Untitled',
      content: content || '',
      scheduledAt,
      accountId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    schedules.push(schedule);
    schedules.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));

    return NextResponse.json({
      success: true,
      schedule
    });
  } catch (error: any) {
    console.error('[Schedule Create] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 예약 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    ensureStorageDir();
    if (!fs.existsSync(SCHEDULES_FILE)) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    let schedules: any[] = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));
    const filtered = schedules.filter((s: any) => s.id !== id);

    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(filtered, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error: any) {
    console.error('[Schedule Delete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}

/**
 * PUT: 예약 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, scheduledAt } = await request.json();

    if (!id || !scheduledAt) {
      return NextResponse.json(
        { error: 'ID and scheduledAt are required' },
        { status: 400 }
      );
    }

    ensureStorageDir();
    if (!fs.existsSync(SCHEDULES_FILE)) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    let schedules: any[] = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));
    const index = schedules.findIndex((s: any) => s.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    schedules[index].scheduledAt = scheduledAt;
    schedules.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));

    return NextResponse.json({
      success: true,
      schedule: schedules[index]
    });
  } catch (error: any) {
    console.error('[Schedule Update] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update schedule' },
      { status: 500 }
    );
  }
}
