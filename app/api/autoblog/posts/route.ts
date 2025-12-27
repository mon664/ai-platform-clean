import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const POSTS_FILE = path.join(STORAGE_DIR, 'posts.json');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * GET: 생성된 글 목록 조회
 */
export async function GET() {
  try {
    ensureStorageDir();
    if (!fs.existsSync(POSTS_FILE)) {
      return NextResponse.json({ posts: [] });
    }

    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * PUT: 글 수정
 */
export async function PUT(request: NextRequest) {
  try {
    const { slug, title, content } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    ensureStorageDir();
    if (!fs.existsSync(POSTS_FILE)) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const index = posts.findIndex((p: any) => p.slug === slug);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Update fields
    if (title !== undefined) posts[index].title = title;
    if (content !== undefined) posts[index].content = content;

    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 글 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    ensureStorageDir();
    if (!fs.existsSync(POSTS_FILE)) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const filtered = posts.filter((p: any) => p.slug !== slug);

    if (filtered.length === posts.length) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    fs.writeFileSync(POSTS_FILE, JSON.stringify(filtered, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
