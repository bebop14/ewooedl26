# 오운완 (오늘 운동 완료) 대시보드

오늘 완료한 운동을 기록하고 공유하며 사용자간 랭킹을 제공하는 소셜 운동 플랫폼

## 기술 스택

- **Frontend**: Nuxt 4 + Vue 3
- **UI**: Nuxt UI v4 + TailwindCSS v4
- **State**: Pinia
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Deployment**: GitHub Pages (SPA 모드)

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Firebase 설정

Firebase Console에서 프로젝트를 생성하고 설정합니다.

자세한 내용은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 참고

```bash
# .env 파일 생성 후 Firebase 설정값 입력
cp .env.example .env
```

필요한 환경 변수:
```
NUXT_PUBLIC_FIREBASE_API_KEY=
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NUXT_PUBLIC_FIREBASE_PROJECT_ID=
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NUXT_PUBLIC_FIREBASE_APP_ID=
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

## 프로젝트 구조

```
/
├── assets/
│   └── css/main.css    # TailwindCSS v4 + Nuxt UI 진입점
├── composables/
│   └── useFirebase.ts  # Firebase Auth/Firestore/Storage composables
├── middleware/
│   ├── auth.ts         # 인증 필요 페이지 보호
│   └── guest.ts        # 로그인 사용자 리다이렉트
├── pages/
│   ├── index.vue       # 메인 대시보드
│   ├── login.vue       # Google 로그인
│   ├── gallery.vue     # 갤러리 (개발 예정)
│   ├── ranking.vue     # 순위 (개발 예정)
│   ├── calendar.vue    # 캘린더 (개발 예정)
│   └── profile/
│       └── [id].vue    # 사용자 프로필
├── plugins/
│   └── firebase.client.ts  # Firebase 초기화 (클라이언트 전용)
├── stores/
│   └── user.ts         # 사용자 프로필/통계 스토어
├── public/
│   └── .nojekyll       # GitHub Pages Jekyll 비활성화
├── app.vue             # 루트 컴포넌트 (헤더, 네비게이션)
└── nuxt.config.ts      # Nuxt 설정
```

## 개발 단계

### Phase 1: 기본 인프라 (완료)
- [x] Nuxt 4 프로젝트 초기 설정
- [x] Firebase 설정 및 연동 (Auth, Firestore, Storage)
- [x] Nuxt UI v4 + TailwindCSS v4 설치 및 설정
- [x] 기본 레이아웃 및 라우팅 구성
- [x] Pinia 상태 관리 설정

### Phase 2: 인증 및 사용자 관리 (완료)
- [x] Firebase Authentication (Google 로그인)
- [x] 인증 미들웨어 (auth / guest)
- [x] 사용자 프로필 페이지
- [x] 사용자 프로필/통계 Pinia 스토어

### Phase 3: 운동 기록 및 통계 (다음)
- [ ] 운동 등록 폼
- [ ] 이미지 업로드 기능
- [ ] 개인 대시보드
- [ ] 게이지 바 및 통계 시각화
- [ ] 연속 운동 기간 계산 로직

### Phase 4: 소셜 기능
- [ ] 갤러리 피드
- [ ] 좋아요 기능
- [ ] 댓글 기능
- [ ] 종합 순위 시스템

### Phase 5: 캘린더 및 스케줄
- [ ] 캘린더 뷰
- [ ] 운동 계획 등록
- [ ] 목표 설정

### Phase 6: 배포 및 최적화
- [ ] GitHub Pages 배포 설정
- [ ] 성능 최적화
- [ ] SEO 설정

### Phase 7: 추가 인증 (후순위)
- [ ] 네이버 로그인
- [ ] 카카오 로그인

## 배포

### GitHub Pages 배포

```bash
# 정적 사이트 생성
pnpm generate

# dist/ 디렉토리가 생성됨
```

GitHub Pages 설정:
1. Repository Settings > Pages
2. Source: Deploy from a branch
3. Branch: gh-pages / root 선택

## 문서

- [요구사항 정의서](./REQUIREMENTS.md)
- [Firebase 설정 가이드](./FIREBASE_SETUP.md)

## 라이선스

Private Project
