import { NextRequest, NextResponse } from 'next/server';
import { loadPosts, savePosts } from '@/lib/autoblog/gcs-storage';

/**
 * GET: 생성된 글 목록 조회
 */
export async function GET() {
  try {
    const posts = await loadPosts();
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

    const posts = await loadPosts();
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

    await savePosts(posts);

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

    const posts = await loadPosts();
    const filtered = posts.filter((p: any) => p.slug !== slug);

    if (filtered.length === posts.length) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    await savePosts(filtered);

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
