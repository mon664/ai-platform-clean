import { NextRequest, NextResponse } from 'next/server';
import { generateText, generateImage } from '@/lib/autoblog/ai-client';
import { calculateTextCost, calculateImageCost } from '@/lib/autoblog/models';
import { createSlug } from '@/lib/blog-storage';
import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const POSTS_FILE = path.join(STORAGE_DIR, 'posts.json');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function savePostLocally(post: any) {
  ensureStorageDir();
  let posts: any[] = [];
  if (fs.existsSync(POSTS_FILE)) {
    posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  }
  posts.unshift(post);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

/**
 * POST: 블로그 콘텐츠 생성
 */
export async function POST(request: NextRequest) {
  try {
    const {
      textModel,
      imageModel,
      title,
      category,
      keywords,
      targetTokens,
      imageCount,
      enableFinishing
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // 1. 텍스트 생성 프롬프트
    const textPrompt = `
당신은 15년 경력의 블로그 작가입니다.

주제: "${title}"
카테고리: ${category}
키워드: ${keywords}

다음 조건으로 블로그 글을 작성하세요:

✅ 글쓰기 규칙:
1. 친근하면서도 전문적인 톤
2. 구체적인 예시와 팁 포함
3. 단락은 3-4문장으로 짧게
4. 소제목으로 가독성 향상
5. 불릿 포인트 적극 활용

📝 구조:
- 도입부: 공감대 형성 + 문제 제기 (2-3문단)
- 본론: 해결책 3-5가지 (각 소제목 포함)
- 결론: 요약 + 실천 방법 + 격려

🖼️ 이미지 위치:
- 반드시 [IMAGE:1] <!-- 이미지 설명 --> 형식으로 표시
- 본문 흐름에 맞게 ${imageCount}개 배치
- 예: [IMAGE:1] <!-- 고구마가 식탁 위에 놓여 있는 모습 -->

⚠️ 중요:
- <!DOCTYPE html>, <html>, <head>, <body> 태그는 절대 포함하지 마세요
- 본문 내용(H1, H2, p, ul, li 태그 등)만 작성하세요
- <img> 태그를 직접 사용하지 말고 [IMAGE:N] 플레이스홀더를 사용하세요
    `.trim();

    // 2. 텍스트 생성
    console.log('[Generate] Starting text generation with model:', textModel);
    const textResult = await generateText(textModel, textPrompt, targetTokens);
    console.log('[Generate] Text generation complete, tokens:', textResult.tokensUsed);

    // 2.5 HTML 본문 추출 (전체 HTML 문서인 경우)
    let contentText = textResult.text;
    // <!DOCTYPE html> 또는 <html로 시작하는 경우 본문만 추출
    if (contentText.includes('<!DOCTYPE html>') || contentText.includes('<html')) {
      console.log('[Generate] Full HTML detected, extracting body content');
      const bodyMatch = contentText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        contentText = bodyMatch[1].trim();
      }
    }
    // Markdown 코드 블록 제거
    contentText = contentText.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Markdown 별표(**)를 <strong> 태그로 변환
    contentText = contentText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    console.log('[Generate] Processed content length:', contentText.length);

    // 3. 이미지 플레이스홀더 파싱
    const imagePlaceholders: Array<{ position: number; description: string }> = [];
    const imageRegex = /\[IMAGE:(\d+)\]\s*(?:<!--\s*(.+?)\s*-->)?/g;
    let match;
    let contentWithImages = contentText;

    while ((match = imageRegex.exec(contentText)) !== null) {
      imagePlaceholders.push({
        position: parseInt(match[1]),
        description: match[2] || `${title} - 이미지 ${imagePlaceholders.length + 1}`
      });
    }

    // 4. 이미지 생성
    console.log('[Generate] Starting image generation, count:', imageCount);
    const images: Array<{ url?: string; base64?: string; alt: string }> = [];

    for (let i = 0; i < Math.min(imageCount, imagePlaceholders.length || imageCount); i++) {
      try {
        const imagePrompt = imagePlaceholders[i]?.description || `${title} - 블로그 이미지 ${i + 1}`;
        const imageResult = await generateImage(imageModel, imagePrompt, '1024x1024');

        if (imageResult.imageUrl) {
          images.push({ url: imageResult.imageUrl, alt: imagePrompt });
        } else if (imageResult.imageBase64) {
          images.push({ base64: imageResult.imageBase64, alt: imagePrompt });
        }

        console.log('[Generate] Image', i + 1, 'generated');
      } catch (error) {
        console.error('[Generate] Image', i + 1, 'failed:', error);
      }
    }

    // 5. 이미지를 콘텐츠에 삽입
    console.log('[Generate] Inserting', images.length, 'images into content');

    if (images.length > 0) {
      // 이미지 플레이스홀더 위치를 찾아서 이미지 삽입
      let imageIndex = 0;
      contentWithImages = contentWithImages.replace(
        /\[IMAGE:\d+\](?:\s*<!--\s*.*?\s*-->)?/g,
        (match) => {
          if (imageIndex < images.length) {
            const img = images[imageIndex++];
            const src = img.url || `data:image/png;base64,${img.base64}`;
            console.log('[Generate] Replacing placeholder with image, base64 length:', img.base64?.length || 0);
            return `<img src="${src}" alt="${img.alt}" class="blog-image" style="max-width: 100%; border-radius: 8px; margin: 2rem 0;" />`;
          }
          return '';
        }
      );
      console.log('[Generate] After image replacement, content length:', contentWithImages.length);
    }

    // 남은 플레이스홀더는 모두 제거 (이미지 생성 실패시 또는 개수 부족)
    contentWithImages = contentWithImages.replace(/\[IMAGE:\d+\](?:\s*<!--\s*.*?\s*-->)?/g, '');
    console.log('[Generate] After removing placeholders, content length:', contentWithImages.length);

    // 6. 마감 처리 (Finishing)
    if (enableFinishing) {
      console.log('[Generate] Applying finishing with Gemini');
      try {
        const finishingResult = await generateText(
          'gemini-2.0-flash-exp',
          `다음 블로그 글을 더욱 자연스럽고 감성적으로 다듬어주세요. HTML 구조는 유지하세요:\n\n${contentWithImages}`,
          4000
        );
        contentWithImages = finishingResult.text;
      } catch (error) {
        console.error('[Generate] Finishing failed, using original content:', error);
      }
    }

    // 7. slug 생성
    const slug = createSlug(title);

    // 8. 비용 계산
    const actualTextCost = calculateTextCost(textModel, textResult.tokensUsed);
    const actualImageCost = calculateImageCost(imageModel, images.length);
    const actualCost = actualTextCost + actualImageCost;

    // 9. 로컬에 저장
    savePostLocally({
      slug,
      title,
      content: contentWithImages,
      tokensUsed: textResult.tokensUsed,
      imagesGenerated: images.length,
      textCost: actualTextCost,
      imageCost: actualImageCost,
      totalCost: actualCost,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      title,
      slug,
      content: contentWithImages,
      tokensUsed: textResult.tokensUsed,
      imagesGenerated: images.length,
      totalCost: actualCost,
      url: `/blog/${slug}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Generate] Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
