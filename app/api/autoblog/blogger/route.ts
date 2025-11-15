import { NextRequest, NextResponse } from 'next/server';
import { BloggerAPI } from '@/lib/autoblog/blogger-api';

// 블로그 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const blogId = searchParams.get('blogId');
    const postId = searchParams.get('postId');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    // 토큰 확인
    const tokens = request.cookies.get('blogger_tokens')?.value;
    if (!tokens) {
      return NextResponse.json(
        { error: 'Blogger authentication required' },
        { status: 401 }
      );
    }

    const blogger = new BloggerAPI();
    blogger.setCredentials(JSON.parse(tokens));

    switch (action) {
      case 'blogs':
        const blogs = await blogger.listBlogs();
        return NextResponse.json({ success: true, blogs });

      case 'posts':
        if (!blogId) {
          return NextResponse.json(
            { error: 'Blog ID is required' },
            { status: 400 }
          );
        }
        const posts = await blogger.listPosts(blogId, maxResults);
        return NextResponse.json({ success: true, posts });

      case 'post':
        if (!blogId || !postId) {
          return NextResponse.json(
            { error: 'Blog ID and Post ID are required' },
            { status: 400 }
          );
        }
        const post = await blogger.getPost(blogId, postId);
        return NextResponse.json({ success: true, post });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Blogger API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 새 포스트 생성
export async function POST(request: NextRequest) {
  try {
    const { action, blogId, postData } = await request.json();

    // 토큰 확인
    const tokens = request.cookies.get('blogger_tokens')?.value;
    if (!tokens) {
      return NextResponse.json(
        { error: 'Blogger authentication required' },
        { status: 401 }
      );
    }

    const blogger = new BloggerAPI();
    blogger.setCredentials(JSON.parse(tokens));

    if (action === 'create') {
      if (!blogId || !postData) {
        return NextResponse.json(
          { error: 'Blog ID and post data are required' },
          { status: 400 }
        );
      }

      const createdPost = await blogger.createPost(blogId, postData);
      return NextResponse.json({
        success: true,
        post: createdPost,
        message: 'Blog post created successfully'
      });
    } else if (action === 'update') {
      const { postId } = await request.json();
      if (!blogId || !postId || !postData) {
        return NextResponse.json(
          { error: 'Blog ID, Post ID, and post data are required' },
          { status: 400 }
        );
      }

      const updatedPost = await blogger.updatePost(blogId, postId, postData);
      return NextResponse.json({
        success: true,
        post: updatedPost,
        message: 'Blog post updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Blogger API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 포스트 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId');
    const postId = searchParams.get('postId');

    // 토큰 확인
    const tokens = request.cookies.get('blogger_tokens')?.value;
    if (!tokens) {
      return NextResponse.json(
        { error: 'Blogger authentication required' },
        { status: 401 }
      );
    }

    const blogger = new BloggerAPI();
    blogger.setCredentials(JSON.parse(tokens));

    if (!blogId || !postId) {
      return NextResponse.json(
        { error: 'Blog ID and Post ID are required' },
        { status: 400 }
      );
    }

    await blogger.deletePost(blogId, postId);
    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Blogger API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}