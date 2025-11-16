# 🚨 긴급 세션 전환 가이드

## ⚠️ 현재 상황
- **시간**: 2025-11-16 23:45
- **토큰 사용**: 75,734 / 190,000 (40% 사용)
- **상태**: 서버 다운 (ERR_CONNECTION_TIMED_OUT)
- **위치**: survivingfnb.com 완전 무응답

---

## 📍 즉시 확인해야 할 것

### 1️⃣ Vercel 대시보드 (최우선)
```
https://vercel.com/dashboard

체크 포인트:
✓ ai-platform-clean 프로젝트 상태
✓ Deployments 탭 → 최근 배포 로그
✓ 에러 메시지 확인
✓ Build Logs 확인
```

### 2️⃣ 로컬 테스트
```bash
cd C:/projects/ai-platform-clean
npm run dev
# localhost:3000 접속해서 정상 작동 확인
```

### 3️⃣ 재배포
```bash
# 긴급 재배포
vercel --prod --force

# 또는
git add .
git commit -m "emergency: fix server down"
git push
```

---

## 📝 수정된 파일 목록

### Vercel (로컬)
```
✅ C:/projects/ai-platform-clean/app/admin/login/page.tsx
   - Line 63: router.push + setTimeout 방식으로 수정
   - 목적: 로그인 후 리다이렉트 안정화

✅ C:/projects/ai-platform-clean/lib/blog-publisher.ts
   - Google Blogger API 연동 추가
   - Railway API 호출 로직
   - 이미지 HTML 변환
```

### Railway
```
✅ api_server.py
   - /api/blogger/post 개선
   - title + content + labels 지원
   - keyword 하위 호환성 유지
```

---

## 🎯 다음 세션 즉시 실행 명령어

```bash
# === STEP 1: 상태 확인 ===
cd C:/projects/ai-platform-clean
git status
type AUTOBLOG_INTEGRATION_REPORT.md

# === STEP 2: Vercel 상태 확인 ===
vercel ls
vercel logs ai-platform-clean

# === STEP 3: 로컬 테스트 ===
npm run dev
# → http://localhost:3000 접속

# === STEP 4: 문제 발견 시 재배포 ===
vercel --prod --force

# === STEP 5: 도메인 확인 ===
nslookup survivingfnb.com
ping survivingfnb.com
```

---

## 🔑 환경 변수 백업

### Vercel 환경 변수 (필수)
```bash
DATABASE_URL=postgresql://neondb_owner:...@ep-young-glitter-...
JWT_SECRET=[설정됨]
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
OPENAI_API_KEY=sk-proj-1qiF7MplmWHf8dJt...
CLAUDE_API_KEY=sk-ant-api03-U2cDwsU...
GEMINI_API_KEY=AIzaSyBlxBK-1-vl-Uzy...

# Railway 연동 (대기 중)
RAILWAY_API_URL=[아직 미설정]
```

### Railway 환경 변수 (설정 필요)
```bash
OPENAI_API_KEY=sk-proj-1qiF7MplmWHf8dJt...
COUPANG_USERNAME=[선택]
COUPANG_PASSWORD=[선택]
```

---

## 📊 프로젝트 현황

### 완료된 작업 ✅
- [x] login/page.tsx 리다이렉트 수정
- [x] blog-publisher.ts Google Blogger 연동
- [x] api_server.py 파라미터 개선
- [x] 문서 업데이트 (AUTOBLOG_INTEGRATION_REPORT.md)

### 대기 중인 작업 ⏳
- [ ] survivingfnb.com 복구 (최우선)
- [ ] Railway 도메인 생성
- [ ] Railway 환경 변수 설정
- [ ] Vercel RAILWAY_API_URL 추가
- [ ] 통합 테스트
- [ ] 불필요한 Vercel 프로젝트 3개 삭제

---

## 💡 문제 해결 시나리오

### 시나리오 1: Vercel 빌드 실패
```bash
# 로그 확인
vercel logs --follow

# 로컬에서 빌드 테스트
npm run build

# 문제 발견 → 수정 → 재배포
```

### 시나리오 2: 환경 변수 누락
```bash
Vercel Dashboard
→ Settings → Environment Variables
→ 누락된 변수 추가
→ Redeploy
```

### 시나리오 3: 도메인 DNS 문제
```bash
# DNS 확인
nslookup survivingfnb.com

# Cloudflare 설정 확인
# Vercel DNS 재연결
```

---

## 🚀 복구 후 작업 순서

### 1단계: 서버 복구 확인
```
https://survivingfnb.com 접속
→ 로그인 페이지 정상 표시
→ 로그인 테스트
→ /admin 접근 확인
```

### 2단계: Railway 완료
```
1. Railway Dashboard → Generate Domain
2. 환경 변수 설정 (OPENAI_API_KEY)
3. Vercel에 RAILWAY_API_URL 추가
4. Vercel 재배포
```

### 3단계: 통합 테스트
```
1. AutoBlog UI 접속
2. 테스트 포스트 작성
3. Google Blogger 발행
4. 결과 확인
```

### 4단계: 정리
```
1. Vercel 프로젝트 3개 삭제
2. 테스트 데이터 정리
3. 최종 문서 업데이트
```

---

## 📞 참고 문서 위치

```
C:/projects/ai-platform-clean/
├── AUTOBLOG_INTEGRATION_REPORT.md (메인 보고서)
├── HANDOFF.md (세션 전환 가이드)
└── SESSION_EMERGENCY.md (이 파일)
```

---

## ⚡ 원라이너 복구 명령어

```bash
# 전체 복구 프로세스 (한 줄씩 실행)
cd C:/projects/ai-platform-clean && git pull && npm run build && vercel --prod --force
```

---

**작성 시간**: 2025-11-16 23:50  
**토큰 사용**: 40% (여유 있음)  
**긴급도**: 🚨 최고  
**다음 작업**: Vercel 대시보드 확인

🔥 **Gemini와 협의 결과: Vercel 재배포 최우선**
