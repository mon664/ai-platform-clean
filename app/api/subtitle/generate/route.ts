import { NextRequest, NextResponse } from 'next/server';

interface SubtitleRequest {
  scenes: Array<{
    scene_number: number;
    title: string;
    content: string;
  }>;
  style: 'default' | 'title' | 'rank' | 'minimal';
  duration?: number; // 전체 영상 길이 (초)
}

interface SubtitleEntry {
  start: number;
  end: number;
  text: string;
  style: string;
}

export async function POST(request: NextRequest) {
  try {
    const { scenes, style = 'default', duration = 180 }: SubtitleRequest = await request.json();

    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ error: '장면 정보가 필요합니다' }, { status: 400 });
    }

    // 자막 생성
    const subtitles = generateSubtitles(scenes, style, duration);

    // ASS 형식으로 변환
    const assContent = convertToASS(subtitles);

    return NextResponse.json({
      success: true,
      subtitles: subtitles,
      assContent: assContent,
      downloadUrl: `data:text/plain;base64,${Buffer.from(assContent, 'utf8').toString('base64')}`
    });

  } catch (error: any) {
    console.error('Subtitle generation error:', error);
    return NextResponse.json({
      error: error.message || '자막 생성 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

function generateSubtitles(scenes: SubtitleRequest['scenes'], style: SubtitleRequest['style'], totalDuration: number): SubtitleEntry[] {
  const subtitles: SubtitleEntry[] = [];
  const sceneDuration = totalDuration / scenes.length;

  scenes.forEach((scene, index) => {
    const startTime = index * sceneDuration;
    const endTime = (index + 1) * sceneDuration;

    // 제목 자막
    if (style === 'title' && index === 0) {
      subtitles.push({
        start: startTime,
        end: startTime + 5,
        text: scene.title,
        style: 'title'
      });
    }

    // 장면 본문 자막
    const sentences = splitIntoSentences(scene.content);
    const sentenceDuration = (sceneDuration - (style === 'title' && index === 0 ? 5 : 0)) / sentences.length;

    sentences.forEach((sentence, sentenceIndex) => {
      const sentenceStart = startTime + (style === 'title' && index === 0 ? 5 : 0) + (sentenceIndex * sentenceDuration);
      const sentenceEnd = sentenceStart + sentenceDuration;

      subtitles.push({
        start: Math.round(sentenceStart * 1000) / 1000,
        end: Math.round(sentenceEnd * 1000) / 1000,
        text: sentence.trim(),
        style: style
      });
    });

    // 장면 번호 자막 (rank 스타일용)
    if (style === 'rank') {
      subtitles.push({
        start: startTime,
        end: startTime + 2,
        text: `Scene ${scene.scene_number}`,
        style: 'rank'
      });
    }
  });

  return subtitles;
}

function splitIntoSentences(text: string): string[] {
  // 문장 분리 로직
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.filter(s => s.trim().length > 0);
}

function convertToASS(subtitles: SubtitleEntry[]): string {
  const lines = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1920',
    'PlayResY: 1080',
    'WrapStyle: 0',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    'Style: Title,나눔스퀘어 Bold,100,&H00FFFFFF, &H00FFFFFF, &H00000000, &H80000000,0,0,0,0,100,100,0,0,1,1,0,2,0,0,0,1',
    'Style: Default,나눔스퀘어 Regular,72,&H00FFFFFF, &H00FFFFFF, &H00000000, &H80000000,0,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1',
    'Style: Rank,나눔스퀘어 Bold,100,&H00FFFFFF, &H00FFFFFF, &H00000000, &H80000000,0,0,0,0,100,100,0,0,1,1,0,2,0,0,0,1',
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ];

  subtitles.forEach(subtitle => {
    const startTime = formatTime(subtitle.start);
    const endTime = formatTime(subtitle.end);
    const styleName = subtitle.style.charAt(0).toUpperCase() + subtitle.style.slice(1);

    lines.push(`Dialogue: 0,${startTime},${endTime},${styleName},,0,0,0,,${subtitle.text.replace(/\n/g, '\\n')}`);
  });

  return lines.join('\n');
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}