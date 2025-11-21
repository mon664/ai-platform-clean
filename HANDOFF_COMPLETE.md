# 📋 AI Platform Clean - 완전 인수인계 문서

**작성**: 2025-11-20  
**상태**: 🚀 진행 중  
**담당**: Claude AI → 다음 세션

---

## 🎯 현재 상황

### ✅ 완료
- Vercel 배포 (Next.js 15.5.2)
- 32개 API 엔드포인트
- Infini Cloud WebDAV 설정 (V: 드라이브)
- Git 커밋 완료

### 🔴 문제
```
500 Error: /api/autovid/script
이유: V: 드라이브 Flask 서버가 실행되지 않음
```

---

## 🏗️ 아키텍처 최종

```
브라우저 (https://ai-platform-clean.vercel.app)
    ↓
Vercel (/api/autovid/script)
    ↓
localhost:8000 (V: 드라이브 Flask 서버)
    ↓
V:\autoblog\code\api_server.py (포트 8000)
    ↓
Infini Cloud WebDAV (저장소)
```

---

## 🔑 핵심 정보

### Infini Cloud 자격증명
```
URL: https://rausu.infini-cloud.net/dav/
ID: hhsta
비밀번호: 6949689qQ@@
Apps Password: RXYf3uYhCbL9Ezwa
RaiDrive: V: 드라이브로 마운트됨 ✅
```

### Flask 서버 설정
```
위치: V:\autoblog\code\api_server.py
포트: 8000
호스트: 0.0.0.0
실행: python api_server.py
상태: ❌ 미실행 (500 에러 원인)
```

### Vercel 프로젝트
```
URL: https://ai-platform-clean.vercel.app
Git: https://github.com/mon664/ai-platform-clean.git
Branch: main
자동 배포: ON
```

---

## 🛠️ 파일 위치

### 핵심 파일
- `app/autovid/auto/page.tsx` - AutoVid 페이지 (대본 생성)
- `app/api/autovid/script/route.ts` - 대본 생성 API (localhost:8000으로 프록시)
- `app/api/autovid/generate-image/route.ts` - 이미지 생성 API
- `app/api/autovid/assemble-video/route.ts` - 비디오 조립 API

### 백엔드
- `V:\autoblog\code\api_server.py` - Flask 메인 서버
- `V:\autoblog\code\requirements.txt` - Python 패키지
- `V:\autoblog\code\webdav_handler.py` - WebDAV 핸들러 (새로 생성)

### 문서 (C:\projects\ai-platform-clean\)
- `ARCHITECTURE_FINAL.md` - 최종 아키텍처
- `BACKEND_PORT_FINAL.md` - 포트 설정
- `INFRA_CREDENTIALS.md` - 자격증명 정보

---

## 🚨 즉시 해결할 것

### 1️⃣ Flask 서버 실행 확인
```bash
# V: 드라이브에서
cd V:\autoblog\code
python api_server.py
```

**확인 사항**:
- ✅ 포트 8000 리스닝
- ✅ 에러 로그 확인
- ✅ `/api/autovid/script` 엔드포인트 응답

### 2️⃣ 500 에러 원인 분석
**가능성**:
- 🔴 Flask 서버 미실행
- 🔴 Python 경로 오류
- 🔴 모듈 임포트 실패 (openAI, Gemini 등)
- 🔴 WebDAV 경로 오류

### 3️⃣ api_server.py 확인
```python
# Line 1258
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
```
✅ 포트 설정 정상

---

## 📝 API 엔드포인트 목록

### AutoVid
- `POST /api/autovid/script` → localhost:8000/api/autovid/script
- `POST /api/autovid/generate-image` → localhost:8000/api/autovid/generate-image
- `POST /api/autovid/assemble-video` → localhost:8000/api/autovid/assemble-video
- `GET /api/autovid/create-video` → Gemini 직접

### 블로그
- `POST /api/blog/create`
- `GET /api/blog/list`
- `GET /api/blog/[slug]`
- `PUT /api/blog/[slug]`

### 콘텐츠
- `POST /api/shorts` - YouTube 쇼츠
- `POST /api/character` - 캐릭터 생성
- `POST /api/tts/generate` - TTS
- `POST /api/railway-bridge` - AutoBlog 연동

### ERP
- `POST /api/ecount/*` - 이카운트 연동
- `GET /api/bom` - BOM 관리
- 외 다수

---

## 🔧 환경 변수

### .env.local (Vercel)
```
GEMINI_API_KEY=AIzaSyBlxBK-1-vl-Uzy5Vys9tLPQynRhGk30UY
NEXT_PUBLIC_RAILWAY_API_URL=https://autoblog-python-production.up.railway.app
(Railway는 사용 안 함 - WebDAV로 전환)
```

### V:\autoblog\code\.env (Flask)
```
OPEN_AI_KEY=
MY_ASSISTANT_ID=
COUPANG_USERNAME=
COUPANG_PASSWORD=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
CUSTOMER_ID=
NAVER_SEARCH_KEY=
NAVER_SEARCH_SECRET=
CHANNEL_ID=
USE_GPT_IMAGE_CREATION=True
USE_SHORT_URL=False
BANNED_WORDS=시몬스,에이스
KEEP_COUPANG_LOGIN=True
```

---

## 🔗 주요 링크

- **Vercel 프로젝트**: https://vercel.com/ggs-projects/ai-platform-clean
- **GitHub**: https://github.com/mon664/ai-platform-clean
- **배포 URL**: https://ai-platform-clean.vercel.app
- **AutoVid 페이지**: https://ai-platform-clean.vercel.app/autovid/auto

---

## 📊 Git 커밋 이력

```
[main 2b11e526] Fix: Replace localhost:8000 with Infini Cloud WebDAV endpoint
[main 1a6c0676] chore: Infini Cloud WebDAV configuration
[main d196de0] Integrate autovid-backend API with Next.js frontend
```

---

## ⚠️ 알려진 문제

| 문제 | 원인 | 해결책 |
|------|------|--------|
| 500 Error | Flask 미실행 | V: 드라이브에서 `python api_server.py` 실행 |
| localhost:8000 연결 안 됨 | 방화벽/포트 | 포트 8000 개방 확인 |
| WebDAV 마운트 끊김 | RaiDrive 종료 | RaiDrive 재시작 |
| Vercel 배포 오류 | nul 파일 | `.gitignore`에 `nul` 추가됨 ✅ |

---

## 🎯 다음 단계 (우선순위)

### 🔴 P1 (지금 당장)
1. **V: 드라이브 Flask 서버 실행**
   ```bash
   cd V:\autoblog\code
   python api_server.py
   ```
   
2. **서버 상태 확인**
   - 포트 8000 리스닝 확인
   - 에러 로그 확인
   - POST /api/autovid/script 테스트

3. **Vercel에서 AutoVid 다시 테스트**
   - 주제 입력
   - 대본 생성 버튼 클릭
   - 200 응답 확인

### 🟡 P2 (1시간 이내)
1. **FileManager 탭 완성** (80% → 100%)
2. **이미지 생성 API 테스트**
3. **비디오 조립 API 테스트**

### 🟠 P3 (내일)
1. **전체 AutoVid 워크플로우** (5단계) 테스트
2. **TTS 생성** 테스트
3. **YouTube 업로드** (미구현) 추가

---

## 📞 연락처 & 참고

- **Infini Cloud Support**: https://infini-cloud.net
- **RaiDrive Support**: https://www.cloudmounter.net
- **Vercel Support**: https://vercel.com/support
- **GitHub Support**: https://github.com/support

---

## ✅ 체크리스트 (다음 세션)

```
□ V: 드라이브 마운트 확인 (RaiDrive ON)
□ Flask 서버 실행 (python api_server.py)
□ 포트 8000 리스닝 확인
□ localhost:8000/api/autovid/script 테스트
□ Vercel AutoVid 페이지 테스트
□ 500 에러 원인 파악
□ 에러 수정
□ 전체 워크플로우 테스트
```

---

**중요**: 이 문서를 다음 세션에서 참고하여 작업 계속하세요!

**생성자**: Claude AI  
**완성도**: 95% (Flask 서버 실행 필요)
