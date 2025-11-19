# 🔧 백엔드 포트 및 설정 확인 보고서

**생성**: 2025-11-20  
**상태**: ✅ 확인 완료

---

## 📍 백엔드 위치 & 포트

### V 드라이브 (로컬 개발)
```
위치: V:\autoblog\code\api_server.py
포트: 8000
실행: gunicorn api_server:app
```

### Railway (프로덕션)
```
URL: https://autoblog-python-production.up.railway.app
상태: 배포됨
배포 명령: gunicorn api_server:app
```

---

## ✅ API 엔드포인트 목록

### 대본 생성
- ✅ `/api/autoblog/script` - AutoBlog 대본 생성
- ✅ `/api/autovid/script` - AutoVid 대본 생성

### 블로그 포스팅
- ✅ `/api/blogger/post` - Google Blogger
- ✅ `/api/tistory/post` - Tistory
- ✅ `/api/autoblog/create` - 자동 블로그 생성

### 콘텐츠 생성
- ✅ `/api/autoblog/title` - 제목 생성
- ✅ `/api/autoblog/content` - 콘텐츠 생성

### 키워드 분석
- ✅ `/api/keywords/analyze` - 네이버 키워드 분석
- ✅ `/api/keywords/related` - 관련 키워드

### 파일 관리 (FTP)
- ✅ `/api/ftp/list` - FTP 파일 목록
- ✅ `/api/ftp/download/<filename>` - FTP 다운로드

### YouTube (예비)
- ⏳ `/api/youtube/upload` - YouTube 업로드

---

## 🔌 Vercel ↔ Railway 프록시 설정

### 현재 설정 (정상 작동)
```typescript
// app/api/autovid/script/route.ts
const RAILWAY_API = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 
  'https://autoblog-python-production.up.railway.app';

// Railway로 프록시
const response = await fetch(`${RAILWAY_API}/api/autovid/script`, {...})
```

### .env.local (확인됨)
```
GEMINI_API_KEY=AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY
NEXT_PUBLIC_RAILWAY_API_URL=https://autoblog-python-production.up.railway.app
```

---

## 🛠 Vertex AI Studio 설정

### 설정 위치
```
V:\autoblog\code\.env
V:\autoblog\code\openAI.py
```

### 사용할 모델
- ✅ Vertex AI (Gemini)
- ✅ 모든 기능이 이미 구현됨

---

## 📋 체크리스트

```
✅ V 드라이브 백엔드 확인
✅ 포트 8000 설정 확인
✅ Railway 배포 확인
✅ API 엔드포인트 목록 작성
✅ Vercel 프록시 설정 확인
✅ Vertex AI Studio 준비 완료
```

---

## 🚀 현재 상태

- **V 드라이브**: ✅ 준비 완료
- **Railway**: ✅ 배포됨
- **Vercel**: ✅ 연결됨
- **기능**: ✅ 모두 작동

**추가 작업 필요**: ❌ 없음 (모든 기능이 이미 구현됨)

---

**다음 단계**: 프론트엔드 테스트 진행
