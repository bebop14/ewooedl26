# EDL 이우애용 2026 오운완

오늘 완료한 운동을 기록하고 공유하며 그룹별 랭킹을 제공하는 소셜 운동 플랫폼

## 주요 기능

- **운동 기록**: 13가지 운동 종류, 인증샷, 메모, 해시태그
- **그룹 시스템**: 여러 그룹 가입/생성, 그룹별 필터링
- **인증샷 갤러리**: 무한 스크롤, 운동 종류 필터, 좋아요/댓글
- **그룹 순위**: 운동 횟수, 연속 운동일, 최장 연속 기록, 상위 10명 Bar 차트
- **피드백**: 사용자 의견 보내기, 관리자 피드백 관리
- **캘린더**: 행사/단체 연습 일정 관리
- **대시보드**: 통계 카드, 주간 차트, 최근 기록

## 기술 스택

- **Frontend**: Nuxt 4 + Vue 3
- **UI**: Nuxt UI v4 + TailwindCSS v4 + Material Design Icons
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
│   └── css/main.css        # TailwindCSS v4 + Nuxt UI 진입점
├── components/
│   ├── dashboard/          # 대시보드 (StatsCards, WeeklyChart, TypeDistributionChart, RecentWorkouts, UpcomingEvents)
│   ├── workout/            # 운동 (WorkoutForm, WorkoutCard, ImageUploader)
│   ├── gallery/            # 인증샷 갤러리 (GalleryCard, GalleryGrid, GalleryFilter, ImageZoomModal)
│   ├── social/             # 소셜 (LikeButton, CommentSection)
│   ├── ranking/            # 순위 (RankingTable, RankingChart)
│   ├── calendar/           # 캘린더 (CalendarHeader, CalendarGrid, EventCard, EventList, EventFormModal)
│   └── group/              # 그룹 (GroupCard, GroupSelector)
├── composables/
│   ├── useFirebase.ts      # Firebase Auth/Firestore/Storage composables
│   └── useImageUpload.ts   # 이미지 압축 및 업로드
├── middleware/
│   ├── auth.ts             # 인증 필요 페이지 보호
│   ├── admin.ts            # 관리자 전용 페이지 보호
│   └── guest.ts            # 로그인 사용자 리다이렉트
├── pages/
│   ├── index.vue           # 메인 대시보드 (통계, 차트, 최근 기록, 피드백)
│   ├── login.vue           # Google 로그인
│   ├── gallery.vue         # 인증샷 갤러리 (무한 스크롤, 필터)
│   ├── ranking.vue         # 그룹 순위 (횟수/연속/최장, 차트)
│   ├── calendar.vue        # 캘린더 - 행사/단체 연습 일정
│   ├── admin/
│   │   └── feedback.vue    # 피드백 관리 (관리자 전용)
│   ├── groups/
│   │   ├── index.vue       # 그룹 목록/탐색
│   │   ├── new.vue         # 그룹 생성
│   │   └── [id].vue        # 그룹 상세 (멤버 목록)
│   ├── workouts/
│   │   ├── new.vue         # 운동 등록
│   │   └── [id].vue        # 운동 상세 (좋아요, 댓글, 이미지 확대)
│   └── profile/
│       └── [id].vue        # 사용자 프로필
├── plugins/
│   └── firebase.client.ts  # Firebase 초기화 (클라이언트 전용)
├── stores/
│   ├── user.ts             # 사용자 프로필/통계
│   ├── workout.ts          # 운동 CRUD/통계
│   ├── social.ts           # 좋아요/댓글/갤러리/순위
│   ├── event.ts            # 캘린더 일정 CRUD
│   └── group.ts            # 그룹 CRUD/멤버 관리
├── types/
│   ├── workout.ts          # 운동 타입 정의
│   ├── social.ts           # 소셜 타입 정의
│   ├── event.ts            # 이벤트 타입 정의
│   └── group.ts            # 그룹 타입 정의
├── public/
│   └── .nojekyll           # GitHub Pages Jekyll 비활성화
├── app.vue                 # 루트 컴포넌트 (헤더, 그룹 선택, 네비게이션)
└── nuxt.config.ts          # Nuxt 설정
```

## Firestore 데이터 모델

### Collections

```typescript
// users/{userId}
interface UserDoc {
  displayName: string
  photoURL: string
  email: string
  createdAt: Timestamp
  groupIds: string[]           // 가입한 그룹 ID 배열
  role?: 'admin' | 'member'   // 사용자 역할
  stats: {
    totalWorkouts: number
    currentStreak: number
    longestStreak: number
    lastWorkoutDate: string
  }
}

// feedback/{feedbackId}
interface FeedbackDoc {
  userId: string
  userName: string
  content: string
  createdAt: Timestamp
}

// groups/{groupId}
interface GroupDoc {
  name: string
  description: string
  imageUrl: string
  createdBy: string
  createdByName: string
  createdAt: Timestamp
  memberCount: number
  isPublic: boolean
}

// groups/{groupId}/members/{userId}
interface GroupMemberDoc {
  userId: string
  displayName: string
  photoURL: string
  joinedAt: Timestamp
  role: 'admin' | 'member'
}

// workouts/{workoutId}
interface WorkoutDoc {
  userId: string
  userName: string
  userPhoto: string
  workoutType: string
  date: Timestamp
  imageUrl: string
  thumbnailUrl: string
  memo: string
  likes: number
  comments: number
  hashtags: string[]
  groupIds: string[]           // 공유된 그룹 ID 배열
}

// events/{eventId}
interface EventDoc {
  title: string
  description: string
  date: Timestamp
  type: 'event' | 'practice'
  createdBy: string
  createdByName: string
  groupId: string | null
}

// likes/{likeId}
interface LikeDoc {
  workoutId: string
  userId: string
  createdAt: Timestamp
}

// comments/{commentId}
interface CommentDoc {
  workoutId: string
  userId: string
  userName: string
  userPhoto: string
  content: string
  createdAt: Timestamp
}
```

## 배포

### GitHub Pages 자동 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드 및 배포합니다.

**사전 설정:**
1. Repository Settings > Pages > Source: **GitHub Actions** 선택
2. Repository Settings > Secrets and variables > Actions에 Firebase 환경 변수 추가:
   - `NUXT_PUBLIC_FIREBASE_API_KEY`
   - `NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NUXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NUXT_PUBLIC_FIREBASE_APP_ID`

**수동 빌드:**
```bash
pnpm generate
# .output/public/ 디렉토리 생성
```

## 문서

- [Firebase 설정 가이드](./FIREBASE_SETUP.md)
