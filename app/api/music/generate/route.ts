import { NextRequest, NextResponse } from 'next/server'

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

export async function POST(req: NextRequest) {
  console.log('Music API: Request received.');
  try {
    const { theme, duration = 60, mood = 'neutral', style = 'corporate' } = await req.json();
    console.log(`Music API: Received data - Theme: ${theme}, Duration: ${duration}s, Mood: ${mood}`);

    if (!theme) {
      console.error('Music API: Error - No theme provided.');
      return new NextResponse(JSON.stringify({ error: '테마가 필요합니다' }), { status: 400 });
    }

    // Pixabay Music API 사용
    if (PIXABAY_API_KEY) {
      console.log('Music API: Using Pixabay Music API');

      // 테마와 무드에 맞는 검색어 생성
      const searchTerms = getSearchTerms(theme, mood, style);
      const results = [];

      // 각 검색어로 검색
      for (const searchTerm of searchTerms) {
        const response = await fetch(
          `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchTerm)}&category=music&min_duration=${Math.max(30, duration - 30)}&max_duration=${Math.min(600, duration + 30)}&per_page=5`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.hits && data.hits.length > 0) {
            results.push(...data.hits);
          }
        }
      }

      if (results.length > 0) {
        // 가장 적합한 음악 선택
        const bestMatch = selectBestMusic(results, theme, mood, duration);

        const musicData = {
          success: true,
          musicUrl: bestMatch.url,
          downloadUrl: getDownloadUrl(bestMatch),
          title: bestMatch.title,
          artist: bestMatch.artist,
          duration: bestMatch.duration,
          genre: bestMatch.tags ? bestMatch.tags.join(', ') : 'unknown',
          mood: mood,
          theme: theme,
          provider: "pixabay-music",
          license: "Pixabay License (Free for commercial use)"
        };

        return new NextResponse(JSON.stringify(musicData), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Fallback: AI 생성된 음악 설명 (실제 음악 생성 대신)
    console.log('Music API: Using AI-generated music description fallback');

    const musicDescription = generateMusicDescription(theme, mood, duration, style);

    // FreeSound API를 통한 효과음 검색 (설정된 경우)
    const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;
    if (FREESOUND_API_KEY && mood !== 'neutral') {
      console.log('Music API: Searching FreeSound for background effects');

      const effectResponse = await fetch(
        `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(mood + ' ambient')}&filter=duration:[${Math.max(10, duration/6)} TO ${Math.min(60, duration/3)}]&fields=id,name,url,duration,license&page_size=1`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${FREESOUND_API_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (effectResponse.ok) {
        const effectData = await effectResponse.json();
        if (effectData.results && effectData.results.length > 0) {
          const effect = effectData.results[0];

          const musicData = {
            success: true,
            musicUrl: null, // 실제 음악은 없음
            effectUrl: effect.url,
            effectDownloadUrl: `${effect.url}download/`,
            musicDescription: musicDescription,
            effectName: effect.name,
            effectDuration: effect.duration,
            license: effect.license.name,
            mood: mood,
            theme: theme,
            provider: "freesound-effects-only",
            message: "Background effect found, music generation described below"
          };

          return new NextResponse(JSON.stringify(musicData), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // 최종 fallback: 음악 생성 설명만 제공
    const musicData = {
      success: true,
      musicUrl: null,
      musicDescription: musicDescription,
      suggestedInstruments: getSuggestedInstruments(style, mood),
      tempo: getSuggestedTempo(mood),
      key: getSuggestedKey(mood),
      sections: generateMusicSections(duration, mood),
      mood: mood,
      theme: theme,
      provider: "ai-description-fallback",
      message: "Music description generated - use with music generation service"
    };

    return new NextResponse(JSON.stringify(musicData), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Music API: Unhandled error in POST handler.', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error.message || '서버 오류가 발생했습니다',
        provider: "error-fallback"
      }),
      { status: 500 }
    );
  }
}

function getSearchTerms(theme: string, mood: string, style: string): string[] {
  const terms: string[] = [];

  // 테마 기반 검색어
  if (theme.includes('사랑') || theme.includes('러브')) {
    terms.push('romantic', 'love', 'emotional');
  } else if (theme.includes('슬픔') || theme.includes('비극')) {
    terms.push('sad', 'emotional', 'dramatic');
  } else if (theme.includes('행복') || theme.includes('즐거움')) {
    terms.push('happy', 'upbeat', 'cheerful');
  } else if (theme.includes('긴장') || theme.includes('스릴')) {
    terms.push('tension', 'suspense', 'dramatic');
  } else if (theme.includes('자연') || theme.includes('환경')) {
    terms.push('nature', 'ambient', 'calm');
  } else if (theme.includes('도시') || theme.includes('현대')) {
    terms.push('urban', 'modern', 'electronic');
  } else {
    terms.push('background', 'ambient', 'corporate');
  }

  // 무드 기반 추가 검색어
  if (mood === 'energetic') {
    terms.push('energetic', 'upbeat', 'motivational');
  } else if (mood === 'calm') {
    terms.push('calm', 'peaceful', 'relaxing');
  } else if (mood === 'dramatic') {
    terms.push('dramatic', 'cinematic', 'epic');
  }

  // 스타일 기반 추가 검색어
  if (style === 'corporate') {
    terms.push('corporate', 'business', 'motivational');
  } else if (style === 'cinematic') {
    terms.push('cinematic', 'film', 'orchestral');
  } else if (style === 'electronic') {
    terms.push('electronic', 'synth', 'digital');
  }

  return [...new Set(terms)]; // 중복 제거
}

function selectBestMusic(results: any[], theme: string, mood: string, duration: number): any {
  // 적합성 점수 계산
  const scored = results.map(hit => {
    let score = 0;

    // 재생시간 점수
    const durationDiff = Math.abs(hit.duration - duration);
    score += Math.max(0, 100 - durationDiff);

    // 태그 매칭 점수
    if (hit.tags) {
      const themeWords = theme.toLowerCase().split(' ');
      const moodWords = mood.toLowerCase().split(' ');
      const tags = hit.tags.map((tag: string) => tag.toLowerCase());

      themeWords.forEach((word: string) => {
        if (tags.some((tag: string) => tag.includes(word))) {
          score += 20;
        }
      });

      moodWords.forEach((word: string) => {
        if (tags.some((tag: string) => tag.includes(word))) {
          score += 15;
        }
      });
    }

    // 다운로드 횟수 점수 (인기도)
    score += Math.min(50, hit.downloads / 100);

    return { ...hit, score };
  });

  // 가장 높은 점수의 음악 선택
  return scored.reduce((best, current) => current.score > best.score ? current : best);
}

function getDownloadUrl(hit: any): string {
  return `https://pixabay.com/music/${hit.id}/`;
}

function generateMusicDescription(theme: string, mood: string, duration: number, style: string): string {
  const moodDescriptions = {
    'energetic': 'upbeat tempo with driving rhythms and motivational melodies',
    'calm': 'gentle flowing melodies with soft pads and peaceful harmonies',
    'dramatic': 'powerful orchestral arrangements with dynamic shifts and emotional depth',
    'happy': 'bright major chords with cheerful melodies and positive energy',
    'sad': 'minor key progressions with melancholic melodies and emotional resonance',
    'neutral': 'balanced instrumentation with moderate tempo and versatile mood'
  };

  const styleDescriptions = {
    'corporate': 'professional arrangement with piano, strings, and subtle percussion',
    'cinematic': 'orchestral score with brass, woodwinds, strings, and percussion sections',
    'electronic': 'synthesizer-based composition with modern digital sounds and beats',
    'acoustic': 'organic instrumentation featuring guitars, pianos, and natural percussion'
  };

  return `A ${duration}-second ${style} composition featuring ${styleDescriptions[style] || styleDescriptions.corporate}, ${moodDescriptions[mood] || moodDescriptions.neutral}, perfectly suited for ${theme} content.`;
}

function getSuggestedInstruments(style: string, mood: string): string[] {
  const baseInstruments = {
    'corporate': ['piano', 'strings', 'light percussion', 'guitar'],
    'cinematic': ['orchestra', 'brass', 'woodwinds', 'percussion', 'choir'],
    'electronic': ['synthesizer', 'drums', 'bass', 'pads', 'arpeggiators'],
    'acoustic': ['guitar', 'piano', 'strings', 'flute', 'natural percussion']
  };

  const moodInstruments = {
    'energetic': ['drums', 'bass', 'brass', 'fast percussion'],
    'calm': ['piano', 'strings', 'flute', 'soft pads'],
    'dramatic': ['orchestra', 'choir', 'timpani', 'deep strings'],
    'happy': ['ukulele', 'glockenspiel', 'bright piano', 'upbeat drums']
  };

  return [...new Set([...(baseInstruments[style] || baseInstruments.corporate), ...(moodInstruments[mood] || [])])];
}

function getSuggestedTempo(mood: string): number {
  const tempos = {
    'energetic': 120,
    'calm': 70,
    'dramatic': 90,
    'happy': 110,
    'sad': 60,
    'neutral': 85
  };

  return tempos[mood] || tempos.neutral;
}

function getSuggestedKey(mood: string): string {
  const keys = {
    'energetic': 'C major',
    'calm': 'G major',
    'dramatic': 'D minor',
    'happy': 'F major',
    'sad': 'A minor',
    'neutral': 'C major'
  };

  return keys[mood] || keys.neutral;
}

function generateMusicSections(duration: number, mood: string): Array<{startTime: number, endTime: number, description: string}> {
  const sections = [];
  const sectionDuration = Math.floor(duration / 3);

  if (mood === 'dramatic') {
    sections.push(
      { startTime: 0, endTime: sectionDuration, description: 'gentle introduction with building tension' },
      { startTime: sectionDuration, endTime: sectionDuration * 2, description: 'climactic development with full orchestration' },
      { startTime: sectionDuration * 2, endTime: duration, description: 'emotional resolution and fade out' }
    );
  } else if (mood === 'energetic') {
    sections.push(
      { startTime: 0, endTime: sectionDuration, description: 'upbeat introduction with driving rhythm' },
      { startTime: sectionDuration, endTime: sectionDuration * 2, description: 'energetic development with added layers' },
      { startTime: sectionDuration * 2, endTime: duration, description: 'peak energy with memorable melody' }
    );
  } else {
    sections.push(
      { startTime: 0, endTime: sectionDuration, description: 'gentle introduction establishing mood' },
      { startTime: sectionDuration, endTime: sectionDuration * 2, description: 'thematic development with variations' },
      { startTime: sectionDuration * 2, endTime: duration, description: 'conclusion returning to main theme' }
    );
  }

  return sections;
}