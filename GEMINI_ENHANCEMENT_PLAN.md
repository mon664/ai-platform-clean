# 🚀 Gemini API 기능 강화 계획
# 유료 Gemini 2.5 Pro로 업그레이드

## 📊 현재 상태 분석

### ✅ 이미 작동하는 기능
- Gemini 2.0 Flash Exp (스크립트 생성)
- Gemini Vision (이미지 분석)
- AutoVid 스크립트 생성

### ❌ 추가 필요 기능
1. **BGM/배경음악 생성** (완전 누락)
2. **고급 이미지 생성** (Imagen 3)
3. **음성 합성** (Google TTS)
4. **비디오 편집** (FFmpeg 제어)
5. **YouTube 자동 업로드**
6. **메타데이터 자동화**

## 🎯 Gemini 2.5 Pro 업그레이드 기능

### 1. **BGM/음악 생성 시스템** 🎵
```typescript
// 새로운 API: /api/ai/generate-music
const MUSIC_GENERATION_PROMPT = `
Generate background music for video content.

INPUT:
- Theme: ${theme}
- Duration: ${duration} seconds
- Mood: ${mood}
- Style: ${style}

OUTPUT (JSON):
{
  "musicDescription": "detailed music description",
  "instruments": ["piano", "strings", "percussion"],
  "tempo": 120,
  "key": "C major",
  "sections": [
    {
      "startTime": 0,
      "endTime": 30,
      "description": "gentle introduction"
    }
  ]
}
```

### 2. **고급 이미지 생성** 🖼️
```typescript
// 업그레이드: /api/autovid/generate-image
const ADVANCED_IMAGE_PROMPT = `
Generate cinematic image with consistent character.

Face Reference Analysis:
- ${faceAnalysis}

Scene Requirements:
- Scene: ${scene}
- Lighting: cinematic lighting
- Style: photorealistic
- Consistency: maintain exact facial features

Output: 4K resolution, cinematic quality
```

### 3. **음성 합성** 🎤
```typescript
// 새로운 API: /api/ai/generate-speech
const SPEECH_GENERATION_PROMPT = `
Convert text to natural speech.

Text: ${script}
Voice: natural Korean male/female
Speed: normal
Emotion: ${emotion}

Output: MP3 audio file
```

### 4. **비디오 메타데이터** 📝
```typescript
// 새로운 API: /api/ai/generate-metadata
const METADATA_PROMPT = `
Generate YouTube metadata for video.

Title: ${title}
Description: ${description}
Tags: SEO optimized

OUTPUT (JSON):
{
  "title": "engaging title under 60 chars",
  "description": "SEO optimized description",
  "tags": ["tag1", "tag2", "tag3"],
  "thumbnailPrompt": "detailed thumbnail description"
}
```

## 🔧 API 업그레이드 목록

### 신규 API 엔드포인트 (5개)

1. **`/api/ai/generate-music`** - BGM 생성
2. **`/api/ai/generate-speech`** - 음성 합성
3. **`/api/ai/generate-metadata`** - 메타데이터 생성
4. **`/api/ai/enhance-script`** - 스크립트 개선
5. **`/api/ai/generate-thumbnails`** - 썸네일 생성

### 기존 API 개선 (3개)

1. **`/api/autovid/create-video`** - Gemini 2.5 Pro 업그레이드
2. **`/api/autovid/generate-image`** - 이미지 품질 향상
3. **`/api/generate`** - 더 나은 스토리 생성

## 🎵 BGM 시스템 상세 설계

### API Flow:
```
1. 사용자가 영상 테마 입력
   ↓
2. Gemini가 음악 스타일 분석
   ↓
3. Stock Music Library 검색 (Pixabay, Freesound)
   ↓
4. 자동으로 BGM 삽입 및 타이밍 조정
   ↓
5. 최종 영상 출력
```

### Music Library Integration:
- **Pixabay Music**: 무료 음원 10,000+ 곡
- **Freesound**: 효과음 50,000+ 개
- **YouTube Audio Library**: 무료 음원

## 💰 비용 구조 (유료 Gemini)

### Gemini 2.5 Pro 가격:
- **Input**: $0.0025 per 1K characters
- **Output**: $0.01 per 1K characters
- **Image Generation**: $0.01 per image

### 월별 예상 비용:
- 스크립트 생성 100개: $2.50
- 이미지 생성 500개: $5.00
- BGM 메타데이터 100개: $1.00
- **총계**: 약 $8.50/월

## 🚀 구현 단계

### Week 1: 기본 기능
- [ ] BGM 생성 API
- [ ] 음성 합성 API
- [ ] 메타데이터 생성 API

### Week 2: 고급 기능
- [ ] 이미지 생성 품질 향상
- [ ] 썸네일 자동 생성
- [ ] 스크립트 개선 시스템

### Week 3: 통합
- [ ] AutoVid 완전 자동화
- [ ] YouTube 업로드 자동화
- [ ] 배치 처리 시스템

## 🎯 최종 목표

### 완전 자동화 파이프라인:
```
사용자 입력: "AI 혁명에 대한 5분 영상"
   ↓
Gemini 2.5 Pro: 스크립트 생성
   ↓
Gemini Vision: 이미지 10개 생성
   ↓
Google TTS: 음성 합성
   ↓
Pixabay BGM: 배경음악 추가
   ↓
FFmpeg: 비디오 조립
   ↓
YouTube: 자동 업로드
   ↓
완료: 영상 URL 반환 (총 5분 소요)
```

## 📝 필요한 API 키 업데이트

```bash
# .env.local 추가
GEMINI_PRO_API_KEY=AIzaSy... # Gemini 2.5 Pro
GOOGLE_TTS_API_KEY=AIzaSy... # Google Text-to-Speech
PIXABAY_API_KEY=your_pixabay_key
YOUTUBE_API_KEY=AIzaSy... # YouTube Data API v3
```