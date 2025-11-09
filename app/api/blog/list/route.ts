import { listPosts } from '@/lib/blog-storage';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const posts = await listPosts();

    return NextResponse.json({ posts });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
