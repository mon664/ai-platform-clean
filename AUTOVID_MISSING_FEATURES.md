# 🎬 AutoVid 누락된 기능 목록

## ❌ 현재 누락된 핵심 기능들

### 1. **템플릿 시스템** (8개) - 완전 누락
- BLACK, WHITE
- StoryCard-BeigeBrown
- StoryCard-BeigeRed
- StoryCard-BlackPink
- StoryCard-WhiteBlue
- StoryCard-WhiteGreen
- StoryCard-WhiteRed

### 2. **FFmpeg 전환 효과** (60개) - 거의 누락
- dissolve, fade, slideup, slidedown
- circleopen, circleclose, coverup, coverdown
- pixelize, zoomin, hlslice, hrslice
- 기타 35개 효과

### 3. **이미지 모델 선택** (6개) - 완전 누락
- animagine31 (애니메이션)
- chibitoon (치비 만화)
- enna-sketch-style (스케치)
- flux-schnell-dark (FLUX 다크)
- flux-schnell-realitic (FLUX 사실적)
- flux-schnell-webtoon (FLUX 웹툰)

### 4. **자막 생성 시스템** - 누락
- 자동 자막 생성
- 자막 템플릿 (default.ass)
- 자막 스타일 (Title, Default, Rank)
- 타임라인 싱크

### 5. **메타데이터 생성** - 누락
- YouTube 최적화 제목 생성
- SEO 태그 생성
- 썸네일 자동 생성
- 설명문 자동 작성

### 6. **YouTube 자동 업로드** - 누락
- YouTube API v3 연동
- 자동 업로드
- 스케줄링 업로드
- 프라이버시 설정

### 7. **고급 이미지 기능** - 부분 누락
- 이미지 재생성 기능
- 이미지 편집 도구
- 썸네일/텍스트 오버레이
- 이미지 품질 조절

### 8. **사운드 효과** - 부분 누락
- 오디오 페이드인/아웃아웃
- 볼륨 조절
- 크로스페이드
- 사운드 이퀄라이징

### 9. **배치 처리** - 완전 누락
- 여러 영상 동시 생성
- 대기열 처리
- 일괄 처리 결과
- 프로그레스 표시

### 10. **프로젝트 관리** - 완전 누락
- 영상 프로젝트 저장
- 불러오기 기능
- 이력 관리
- 버전 관리

## 🚧 보완 우선순위

### **Phase 1: 템플릿 시스템** (가장 중요)
1. 8개 기본 템플릿 로드
2. 템플릿 커스터마이징 기능
3. 템플릿 미리보기
4. 템플릿 적용 기능

### **Phase 2: FFmpeg 전환 효과**
1. 60개 전환 효과 선택 UI
2. 효과 미리보기
3. 전환 효과 적용
4. 효과 강도 조절

### **Phase 3: 이미지 모델**
1. 6개 이미지 모델 추가
2. 모델별 프롬프트 자동 조정
3. 이미지 품질 설정
4. 모델 전환 기능

### **Phase 4: 자막 시스템**
1. 자동 자막 생성
2. ASS 파일 생성
3. 자막 스타일 설정
4. 자막 타이밍 싱크

### **Phase 5: 메타데이터**
1. YouTube SEO 최적화
2. 메타데이터 생성 API
3. 썸네일 생성
4. 설명문 자동화

## 📋 구현 계획

### 템플릿 시스템 구현
```typescript
interface Template {
  id: string;
  name: string;
  backgroundColor: string;
  topHeightPercent: number;
  bottomHeightPercent: number;
  fontColor: string;
  titleFontColor: string;
  fixedTexts: FixedText[];
  shapes?: Shape[];
}
```

### FFmpeg 효과 구현
```typescript
const TRANSITIONS = [
  'dissolve', 'fade', 'slideup', 'slidedown', 'wipeup', 'wipedown',
  'circleopen', 'circleclose', 'pixelize', 'zoomin', 'hlslice'
  // ... 50개 추가
];
```

### 이미지 모델 구현
```typescript
const IMAGE_MODELS = [
  { id: 'animagine31', name: '애니메이션' },
  { id: 'chibitoon', name: '치비 만화' },
  { id: 'flux-schnell', name: 'FLUX 모델' }
  // ... 3개 추가
];
```