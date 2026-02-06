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
├── components/
│   ├── dashboard/      # 대시보드 (StatsCards, WeeklyChart, TypeDistributionChart, RecentWorkouts, UpcomingEvents)
│   ├── workout/        # 운동 (WorkoutForm, WorkoutCard, ImageUploader)
│   ├── gallery/        # 갤러리 (GalleryCard, GalleryGrid, GalleryFilter, ImageZoomModal)
│   ├── social/         # 소셜 (LikeButton, CommentSection)
│   ├── ranking/        # 순위 (RankingTable)
│   └── calendar/       # 캘린더 (CalendarHeader, CalendarGrid, EventCard, EventList, EventFormModal)
├── composables/
│   ├── useFirebase.ts      # Firebase Auth/Firestore/Storage composables
│   └── useImageUpload.ts   # 이미지 압축 및 업로드
├── middleware/
│   ├── auth.ts         # 인증 필요 페이지 보호
│   └── guest.ts        # 로그인 사용자 리다이렉트
├── pages/
│   ├── index.vue       # 메인 대시보드 (통계, 차트, 최근 기록)
│   ├── login.vue       # Google 로그인
│   ├── gallery.vue     # 갤러리 (무한 스크롤, 필터)
│   ├── ranking.vue     # 종합 순위 (횟수/연속/최장)
│   ├── calendar.vue    # 캘린더 - 행사/단체 연습 일정
│   ├── workouts/
│   │   ├── new.vue     # 운동 등록
│   │   └── [id].vue    # 운동 상세 (좋아요, 댓글, 이미지 확대)
│   └── profile/
│       └── [id].vue    # 사용자 프로필
├── plugins/
│   └── firebase.client.ts  # Firebase 초기화 (클라이언트 전용)
├── stores/
│   ├── user.ts         # 사용자 프로필/통계
│   ├── workout.ts      # 운동 CRUD/통계
│   ├── social.ts       # 좋아요/댓글/갤러리/순위
│   └── event.ts        # 캘린더 일정 CRUD
├── types/
│   ├── workout.ts      # 운동 타입 정의
│   ├── social.ts       # 소셜 타입 정의
│   └── event.ts        # 이벤트 타입 정의
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

### Phase 3: 운동 기록 및 통계 (완료)
- [x] 운동 등록 폼 (13종류 선택, 날짜, 이미지, 메모, 해시태그)
- [x] Canvas API 이미지 압축 + Firebase Storage 업로드
- [x] 대시보드 차트 (Chart.js: 주간 바 차트, 종류별 도넛 차트)
- [x] 연속 운동(streak) 계산 및 통계 카드
- [x] 운동 상세 페이지, 최근 운동 목록

### Phase 4: 소셜 기능 (완료)
- [x] 갤러리 피드 (무한 스크롤, 운동 종류 필터)
- [x] 좋아요 기능 (토글, 원자적 카운터)
- [x] 댓글 기능 (작성/삭제)
- [x] 종합 순위 시스템 (횟수/연속/최장 3탭, 전체 현황, 종류별 횟수)
- [x] 이미지 확대 보기

### Phase 5: 캘린더 및 일정 관리 (완료)
- [x] 커스텀 월간 캘린더 그리드 (일정 제목 표시)
- [x] 행사 일정 등록 (대회, 이벤트, 모임)
- [x] 단체 연습 일정 등록 (팀 훈련, 합동 운동)
- [x] 일정 상세 보기, 목록, 타입별 필터링
- [x] 일정 삭제 (작성자만)
- [x] 대시보드 다가오는 일정 위젯

### Phase 6: 배포 및 최적화
- [ ] GitHub Pages 배포 설정
- [ ] 성능 최적화
- [ ] SEO 설정

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
