# ❓ Infini Cloud 사용 현황

**상태**: ⚠️ 불명확

---

## 현재 확인

### ✅ 사용 중인 것
```
infini-cloud.net
├─ ID: hhsta
├─ 비밀번호: 6949689qQ@@
├─ WebDAV URL: https://rausu.infini-cloud.net/dav/
└─ 용도: ???
```

### ❌ 코드에서 발견 안 됨
- `V:\autoblog\code\` → Infini Cloud 관련 코드 없음
- `.env` → Infini Cloud 설정 없음
- `api_server.py` → 직접 사용 없음

---

## 📍 사용 가능한 위치

### 1️⃣ **로컬 RaiDrive 마운트 (V 드라이브)**
- Windows에서 V 드라이브로 마운트
- 파일 탐색기에서 접근 가능
- 백엔드 코드 저장용

### 2️⃣ **FTP 대체 (현재는 별도 FTP 사용)**
현재 api_server.py는:
```python
FTP_CONFIG = {
    'host': '183.110.224.266',  # 다른 FTP 서버
    'port': 21,
    'username': 'xotjr105',
    'password': 'a6949689Q@@'
}
```

**Infini Cloud WebDAV로 변경 가능**?

---

## 🎯 확인 필요

1. **RaiDrive로 V 드라이브 마운트 중인가?**
   - 맞으면: 로컬 파일 시스템용 ✅

2. **WebDAV를 FTP 대신 사용하려고 했는가?**
   - 그렇다면: api_server.py에 통합 필요

3. **단순 백업용인가?**
   - 그렇다면: 특별히 사용 안 함 ⚠️

---

## 💡 추천

**사용 목적을 명확히 해주세요**:
- RaiDrive 마운트용 ✅ → 현재 상태 유지
- FTP 대체용 ⚠️ → api_server.py 수정 필요
- 불필요 ❌ → 제거 가능

---

**待機중**: 확인 필요
