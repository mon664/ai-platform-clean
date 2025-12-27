import { createWordPressClient, validateWordPressConfig, WordPressConfig } from '@/lib/wordpress';
import { NextRequest, NextResponse } from 'next/server';

// GET - WordPress 연결 테스트
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteUrl = searchParams.get('siteUrl');
    const username = searchParams.get('username');
    const applicationPassword = searchParams.get('applicationPassword');

    if (!siteUrl || !username || !applicationPassword) {
      return NextResponse.json(
        { error: 'WordPress 설정 정보가 필요합니다' },
        { status: 400 }
      );
    }

    const config: WordPressConfig = {
      siteUrl,
      username,
      applicationPassword,
    };

    const validation = validateWordPressConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    const client = createWordPressClient(config);
    const isConnected = await client.testConnection();

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'WordPress 연결이 성공했습니다!'
      });
    } else {
      return NextResponse.json(
        { error: 'WordPress 연결에 실패했습니다. 설정을 확인해주세요.' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('WordPress connection test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '연결 테스트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST - WordPress에 글 발행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      siteUrl,
      username,
      applicationPassword,
      title,
      content,
      status = 'draft',
      categoryId,
      tagIds,
      featuredImage,
    } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 항목입니다' },
        { status: 400 }
      );
    }

    // Validate WordPress config
    const config: WordPressConfig = {
      siteUrl,
      username,
      applicationPassword,
    };

    const validation = validateWordPressConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Create WordPress client and publish post
    const client = createWordPressClient(config);

    // Upload featured image if provided
    let featuredMediaId: number | undefined;
    if (featuredImage) {
      try {
        const media = await client.uploadImage(
          featuredImage.url,
          featuredImage.filename,
          featuredImage.alt
        );
        featuredMediaId = media.id;
      } catch (error) {
        console.error('Image upload failed:', error);
        // Continue with post creation even if image fails
      }
    }

    // Create post
    const post = await client.createPost({
      title,
      content,
      status,
      categories: categoryId ? [categoryId] : undefined,
      tags: tagIds || undefined,
      featured_media: featuredMediaId,
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        link: `${siteUrl}/?p=${post.id}`,
      },
      message: status === 'publish'
        ? '블로그 게시글이 성공적으로 발행되었습니다!'
        : '블로그 게시글이 저장되었습니다!'
    });

  } catch (error) {
    console.error('WordPress publish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '발행 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
