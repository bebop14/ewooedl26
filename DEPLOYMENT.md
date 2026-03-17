# 배포 아키텍처

## 개요

```
GitHub (main branch)
        │
        │ push
        ▼
GitHub Actions (CI/CD)
        │
        ├── pnpm install
        ├── pnpm generate  ← Nuxt SSG (Static Site Generation)
        └── .output/public/ ──► GitHub Pages
                                (https://<org>.github.io/ewooedl26/)

Firebase (별도 관리)
        ├── Authentication  ← Google OAuth
        ├── Firestore       ← 데이터베이스
        └── Storage         ← 이미지 저장
```

## GitHub Pages 자동 배포

`main` 브랜치에 push되면 GitHub Actions가 자동으로 빌드 및 배포합니다.

**워크플로 파일:** `.github/workflows/deploy.yml`

### 빌드 과정

1. Node 24 + pnpm 10 환경 구성
2. `pnpm install` — 의존성 설치
3. `pnpm generate` — Nuxt SSG 빌드 (`.output/public/` 생성)
4. `cp .output/public/index.html .output/public/404.html` — SPA 라우팅 폴백 처리
5. `.output/public/` → GitHub Pages 업로드 및 배포

> **SPA 폴백 이유:** GitHub Pages는 SPA 클라이언트 라우팅을 지원하지 않으므로, 존재하지 않는 경로 접근 시 `404.html`로 리다이렉트되고 Vue Router가 올바른 페이지를 렌더링합니다.

### 수동 배포

GitHub Actions 탭 > "Deploy to GitHub Pages" > "Run workflow"로 수동 실행 가능합니다.

### 로컬 빌드

```bash
pnpm generate
# .output/public/ 에 정적 파일 생성

pnpm preview
# 빌드 결과물 로컬 프리뷰
```

## GitHub Secrets 설정

Repository Settings > Secrets and variables > Actions에 아래 시크릿을 등록해야 합니다.

| Secret 이름 | 설명 |
|-------------|------|
| `NUXT_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 |
| `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 |
| `NUXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID |
| `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage 버킷 |
| `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NUXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |

## Nuxt 빌드 설정

**`nuxt.config.ts` 주요 설정:**

| 설정 | 값 | 설명 |
|------|----|------|
| `ssr` | `false` | SPA 모드 |
| `app.baseURL` | `/ewooedl26/` (prod) | GitHub Pages 서브디렉토리 |
| `app.baseURL` | `/` (dev) | 로컬 개발 |

**Vite 번들 최적화 (수동 청크):**

- `firebase-core`: Firebase 코어 모듈
- `firebase-firestore`: Firestore 모듈
- `firebase-auth`: Auth 모듈
- `firebase-storage`: Storage 모듈
- `chartjs`: Chart.js

## Firebase 서비스

Firebase는 GitHub Pages와 별도로 운영됩니다. 코드 배포와 무관하게 항상 동일한 Firebase 프로젝트에 연결됩니다.

| 서비스 | 용도 |
|--------|------|
| Authentication | Google OAuth 로그인/로그아웃 |
| Firestore | 운동 기록, 그룹, 좋아요, 댓글, 이벤트 등 모든 데이터 |
| Storage | 운동 인증샷, 프로필 이미지 저장 |

**권장 리전:** `asia-northeast3 (Seoul)`

### Firestore 보안 규칙 배포

규칙은 `firestore.rules` 파일로 버전 관리합니다. 규칙 변경 시 Firebase CLI로 배포합니다.

```bash
firebase deploy --only firestore:rules
```

자세한 내용은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 참고.

## 개발 환경

```bash
# 의존성 설치
pnpm install

# 개발 서버 (http://localhost:3000)
pnpm dev

# 타입 체크
pnpm typecheck
```

**요구 사항:**

| 도구 | 버전 |
|------|------|
| Node.js | 24+ |
| pnpm | 10+ |
| Firebase CLI | 최신 (규칙 배포 시에만 필요) |
