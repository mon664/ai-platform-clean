# 🔐 환경 변수 & API 키 설정 가이드

**작성일**: 2025-11-20  
**최종 업데이트**: 2025-11-20

---

## 📋 목차
1. [필수 API 키](#필수-api-키)
2. [환경 변수 설정](#환경-변수-설정)
3. [Vercel 배포 설정](#vercel-배포-설정)
4. [Railway 배포 설정](#railway-배포-설정)
5. [로컬 개발 설정](#로컬-개발-설정)
6. [보안 주의사항](#보안-주의사항)

---

## 필수 API 키

### 1. Google Gemini API Key
**서비스**: AI 스크립트 생성  
**가격**: 무료 (매월 60 요청)  

```
GEMINI_API_KEY=AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY
```

**설정 방법**:
1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성
3. "Generative Language API" 활성화
4. "API 키 생성"
5. API 키 복사

---

### 2. Google Cloud TTS API
**서비스**: 한국어 음성 합성  
**가격**: 무료 (매월 100만 자)  

**설정 방법**:
1. Google Cloud Console에서 "Text-to-Speech API" 활성화
2. 서비스 계정 키 생성 (JSON)
3. `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수 설정

```bash
# .env 또는 시스템 환경 변수
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

---

### 3. Replicate API Token
**서비스**: 6개 AI 이미지 모델 (Flux, Animagine 등)  
**가격**: 무료 평가판, 이후 종량제  

```
REPLICATE_API_TOKEN=r8_OM0uuuuyg6Lh4Edvb1QgWii7G2y0RnbA0Gh4zT
```

**설정 방법**:
1. https://replicate.com/signin 접속
2. 계정 생성
3. Account → API Token 복사

---

### 4. YouTube API Key (선택사항)
**서비스**: YouTube 자동 업로드  

```
YOUTUBE_API_KEY=AIzaSyA7ht6k0ujMtW3J8C4F4q8gHK2Z5V4m5L9p
```

---

### 5. InfiniCloud WebDAV 자격증명
**서비스**: 파일 저장 (영상, 이미지 등)  

```
WEBDAV_HOSTNAME=https://rausu.infini-cloud.net/dav/
WEBDAV_LOGIN=hhtsta
WEBDAV_PASSWORD=RXYf3uYhCbL9Ezwa
```

---

## 환경 변수 설정

### .env 파일 (로컬)

**파일 위치**: `C:\projects\ai-platform-clean\.env.local`

```bash
# Google APIs
GEMINI_API_KEY=AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
REPLICATE_API_TOKEN=r8_OM0uuuuyg6Lh4Edvb1QgWii7G2y0RnbA0Gh4zT
YOUTUBE_API_KEY=AIzaSyA7ht6k0ujMtW3J8C4F4q8gHK2Z5V4m5L9p

# InfiniCloud WebDAV
WEBDAV_HOSTNAME=https://rausu.infini-cloud.net/dav/
WEBDAV_LOGIN=hhtsta
WEBDAV_PASSWORD=RXYf3uYhCbL9Ezwa

# API 설정
NEXT_PUBLIC_AUTOVID_API=http://localhost:8000/api/autovid
RAILWAY_API_URL=https://autoblog-python-production.up.railway.app

# 기타
PORT=3000
NODE_ENV=development
```

### autovid-backend .env 파일

**파일 위치**: `C:\projects\ai-platform-clean\autovid-backend\.env`

```bash
# Google APIs
GEMINI_API_KEY=AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
REPLICATE_API_TOKEN=r8_OM0uuuuyg6Lh4Edvb1QgWii7G2y0RnbA0Gh4zT
YOUTUBE_API_KEY=AIzaSyA7ht6k0ujMtW3J8C4F4q8gHK2Z5V4m5L9p

# InfiniCloud WebDAV
WEBDAV_HOSTNAME=https://rausu.infini-cloud.net/dav/
WEBDAV_LOGIN=hhtsta
WEBDAV_PASSWORD=RXYf3uYhCbL9Ezwa

# Flask 설정
FLASK_ENV=development
FLASK_APP=app.py
SECRET_KEY=your-secret-key-here
PORT=8000
HOST=0.0.0.0
DEBUG=False
```

---

## Vercel 배포 설정

### 1. Vercel Environment Variables

**경로**: Vercel Dashboard → ai-platform-clean → Settings → Environment Variables

```
GEMINI_API_KEY = AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY
GOOGLE_APPLICATION_CREDENTIALS = [service-account-key-json]
REPLICATE_API_TOKEN = r8_OM0uuuuyg6Lh4Edvb1QgWii7G2y0RnbA0Gh4zT
YOUTUBE_API_KEY = AIzaSyA7ht6k0ujMtW3J8C4F4q8gHK2Z5V4m5L9p

NEXT_PUBLIC_AUTOVID_API = https://autovid-api.railway.app/api/autovid
RAILWAY_API_URL = https://autoblog-python-production.up.railway.app
```

### 2. Vercel 배포 명령어

```bash
# 로컬에서 Vercel 배포
vercel
vercel --prod

# 또는 Git push로 자동 배포
git push origin main
```

---

## Railway 배포 설정

### 1. Railway Environment Variables

**경로**: Railway Dashboard → autovid-backend → Variables

```
GEMINI_API_KEY=AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY
GOOGLE_APPLICATION_CREDENTIALS=[service-account-key-json]
REPLICATE_API_TOKEN=r8_OM0uuuuyg6Lh4Edvb1QgWii7G2y0RnbA0Gh4zT
YOUTUBE_API_KEY=AIzaSyA7ht6k0ujMtW3J8C4F4q8gHK2Z5V4m5L9p
PORT=8000
FLASK_ENV=production
```

### 2. Railway 배포 명령어

```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 배포
railway up

# 로그 확인
railway logs
```

---

## 로컬 개발 설정

### 1. Python 백엔드 실행

```bash
# 디렉토리 이동
cd C:\projects\ai-platform-clean\autovid-backend

# 가상환경 생성 (처음 1회만)
python -m venv venv

# 가상환경 활성화
venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 앱 실행
python app.py

# 또는 Gunicorn으로 실행
gunicorn app:app --bind 0.0.0.0:8000
```

### 2. Next.js 프론트엔드 실행

```bash
# 디렉토리 이동
cd C:\projects\ai-platform-clean

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

### 3. 동시 실행 (개발용)

**터미널 1**:
```bash
cd C:\projects\ai-platform-clean\autovid-backend
python app.py
```

**터미널 2**:
```bash
cd C:\projects\ai-platform-clean
npm run dev
```

접속: http://localhost:3000/autovid/auto

---

## 보안 주의사항

### ❌ 절대 하지 말 것

1. **API 키를 GitHub에 커밋하지 마세요**
   ```bash
   # .gitignore에 추가되어야 함
   .env
   .env.local
   .env.*.local
   ```

2. **프로덕션 환경 변수를 로컬 .env에 저장하지 마세요**
   - Vercel/Railway 대시보드에서만 관리

3. **공개 저장소에 서비스 계정 키를 올리지 마세요**
   - GitHub는 자동으로 감지하고 경고함

### ✅ 보안 권장사항

1. **환경 변수 회전**
   - 분기별로 API 키 재발급
   - 사용하지 않는 키 삭제

2. **권한 최소화**
   - Google Cloud IAM에서 필요한 권한만 부여
   - Replicate API 토큰 범위 제한

3. **모니터링**
   - Google Cloud Console에서 API 사용량 확인
   - 비정상적인 요청 감지

---

## 트러블슈팅

### API 키 오류

**문제**: `401 Unauthorized` 또는 `Invalid API Key`

**해결책**:
1. API 키가 올바른지 확인
2. API가 활성화되었는지 확인
3. 환경 변수가 제대로 로드되었는지 확인
   ```bash
   echo $GEMINI_API_KEY  # Linux/Mac
   echo %GEMINI_API_KEY%  # Windows
   ```

### CORS 오류

**문제**: `CORS policy blocked request`

**해결책**:
1. 백엔드의 CORS 설정 확인
2. 프론트엔드 URL이 CORS 화이트리스트에 있는지 확인
3. 로컬 개발은 `http://localhost:3000` 허용

### 파일 업로드 실패

**문제**: InfiniCloud에 파일 저장 안 됨

**해결책**:
1. WebDAV 자격증명 확인
2. 네트워크 연결 확인
3. WebDAV 서버 상태 확인: `https://rausu.infini-cloud.net/dav/`

---

## 참고자료

- [Google Cloud Console](https://console.cloud.google.com/)
- [Replicate API 문서](https://replicate.com/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)
- [Railway 배포 가이드](https://docs.railway.app)
- [InfiniCloud WebDAV](https://www.infini-cloud.net)
