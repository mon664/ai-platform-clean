import { NextRequest, NextResponse } from 'next/server';
import { loadPosts, savePosts } from '@/lib/autoblog/gcs-storage';
import { generateText } from '@/lib/autoblog/ai-client';

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

    // AI 글 생성 프롬프트
    const prompt = `Write a blog post about: ${topic}

Tone: ${tone}
Platform: ${platform}

Requirements:
- Write in Korean
- Include an engaging title
- Write a comprehensive article with proper structure (introduction, body paragraphs, conclusion)
- Make it informative and engaging
- Length: 800-1200 words`;

    // AI 글 생성
    const result = await generateText('gemini-2.0-flash-exp', prompt, 3000);
    const content = result.text;

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
