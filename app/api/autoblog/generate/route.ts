import { NextRequest, NextResponse } from 'next/server';
import { loadPosts, savePosts, loadApiKeys } from '@/lib/autoblog/gcs-storage';
import { generateBlogPost } from '@/lib/autoblog/ai-client';

/**
 * POST: 블로그 글 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { topic, tone = 'professional', platform = 'blog' } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // API 키 로드
    const apiKeys = await loadApiKeys();

    // AI 글 생성
    const content = await generateBlogPost(topic, tone, platform, apiKeys);

    // slug 생성
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // 글 저장
    const posts = await loadPosts();
    const newPost = {
      slug,
      title: topic,
      content,
      createdAt: new Date().toISOString(),
    };

    posts.unshift(newPost);
    await savePosts(posts);

    return NextResponse.json({
      success: true,
      post: newPost
    });
  } catch (error: any) {
    console.error('[Generate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate blog post' },
      { status: 500 }
    );
  }
}
