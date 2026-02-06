# 오늘 운동 완료 대시보드 (오운완) - 요구사항 정의서

## 프로젝트 개요
- **목적**: 오늘 완료한 운동을 기록하고 공유하며 사용자간 랭킹을 제공하는 소셜 운동 플랫폼
- **배포 환경**: GitHub Pages (프론트엔드) + Firebase (백엔드)
- **데이터 저장**: Firebase Firestore + Firebase Storage

## 핵심 기능

### 1. 사용자 인증
- 구글 로그인 (Firebase Authentication 기본 제공)
- 로그아웃
- 사용자 프로필 관리

### 2. 오운완 등록
- 운동 종류 선택 (축구, 웨이트, 러닝, 걷기, 자전거, 요가, 수영, 등산, 테니스, 계단오르기, 크로스핏, 홈트레이닝, 기타)
- 운동 날짜 선택
- **이미지 파일 업로드** (인증샷)
  - Firebase Storage에 저장
  - Canvas API 브라우저 내 이미지 압축 (원본: 1200px/0.7, 썸네일: 400px/0.6)
  - 썸네일 자동 생성
- 메모 추가 (선택사항)
- 해시태그 기능

### 3. 개인별 운동 통계 기록
- **대시보드 통계 카드**
  - 오늘의 운동 횟수
  - 연속 운동일수 (스트릭)
  - 총 운동 횟수
- **차트 시각화** (Chart.js + vue-chartjs)
  - 주간 운동 횟수 바 차트
  - 운동 종류별 분포 도넛 차트
- **연속 운동 기간 표시**
  - 현재 연속 운동일수
  - 최장 연속 기록
- 최근 운동 기록 목록

### 4. 종합 순위
- 전체 회원 운동 현황 (총 회원수, 총 운동 횟수)
- 전체 사용자 랭킹 (3탭)
  - 운동 횟수 순위
  - 연속 운동일수 순위
  - 최장 연속 기록 순위
- 사용자별 상세 정보
  - 주요 운동 종류
  - 운동 종류별 횟수
  - 최근 운동일
- 내 순위 강조 표시

### 5. 갤러리 (업로드된 이미지)
- 전체 사용자의 오운완 이미지 피드
- 무한 스크롤 (IntersectionObserver + cursor 기반 페이지네이션)
- 좋아요 기능 (Firestore increment 원자적 카운터)
- 댓글 기능 (작성/삭제, 본인 댓글만 삭제 가능)
- 이미지 확대 보기 (UModal)
- 필터링 (운동 종류)

### 6. 캘린더 / 일정 관리
- 월간 캘린더 뷰
- **행사 일정 등록** (대회, 이벤트, 모임 등)
- **단체 연습 일정 등록** (팀 훈련, 합동 운동 등)
- 일정별 상세 정보 (제목, 날짜/시간, 장소, 설명, 참가자)
- 일정 목록 보기 및 필터링
- 전체 회원 공유 일정

## 기술 스택

### Frontend
- **Framework**: Nuxt 4 + Vue 3
- **Rendering**: SPA (Client-Side Rendering) for GitHub Pages
- **UI Library**:
  - Nuxt UI v4 (컴포넌트 + TailwindCSS v4 포함)
  - Chart.js / vue-chartjs (주간 바 차트, 종류별 도넛 차트)
  - 커스텀 캘린더 그리드 (CSS Grid, 외부 라이브러리 없음)
- **상태 관리**: Pinia (Composition API)
- **이미지 업로드**: Canvas API 직접 구현 (브라우저 내 압축)

### Backend (Firebase)
- **Authentication**: Firebase Authentication
  - Google Provider
- **Database**: Cloud Firestore
  - 사용자 프로필
  - 운동 기록
  - 순위 데이터
  - 댓글 및 좋아요
- **Storage**: Firebase Storage
  - 운동 인증 이미지
  - 프로필 이미지
- **Functions**: Firebase Cloud Functions (선택사항)
  - 이미지 리사이징
  - 순위 계산 Batch Job

### 배포 및 도구
- **호스팅**: GitHub Pages (Static)
- **버전 관리**: Git/GitHub
- **패키지 매니저**: pnpm (Nuxt 권장) 또는 npm
- **빌드**: Nuxt build (SPA)

## 데이터 구조 (Firestore)

### Users Collection
```javascript
users/{userId}
  - displayName: string
  - email: string
  - photoURL: string
  - provider: 'google'
  - createdAt: string (ISO)
  - stats: {
      totalWorkouts: number
      currentStreak: number
      longestStreak: number
      lastWorkoutDate: string | null
    }
```

### Workouts Collection
```javascript
workouts/{workoutId}
  - userId: string
  - userName: string
  - userPhoto: string
  - workoutType: string (soccer|weight|running|walking|cycling|yoga|swimming|hiking|tennis|stairs|crossfit|home|other)
  - date: timestamp
  - imageUrl: string (Storage URL)
  - thumbnailUrl: string
  - memo: string
  - likes: number
  - comments: number
  - hashtags: array<string>
```

### Likes Collection
```javascript
likes/{likeId}
  - workoutId: string
  - userId: string
  - createdAt: timestamp
```

### Comments Collection
```javascript
comments/{commentId}
  - workoutId: string
  - userId: string
  - userName: string
  - userPhoto: string
  - content: string
  - createdAt: timestamp
```

### Events Collection (Phase 5)
```javascript
events/{eventId}
  - title: string
  - type: 'event' | 'practice'    // 행사 or 단체 연습
  - date: timestamp
  - endDate: timestamp | null      // 종료 시간 (선택)
  - location: string               // 장소
  - description: string            // 설명
  - createdBy: string              // 작성자 userId
  - createdByName: string
  - createdAt: timestamp
```

## 프로젝트 구조 (Nuxt 4)
```
/
├── nuxt.config.ts              # Nuxt 설정
├── package.json
├── .env                        # Firebase 설정 (gitignore)
├── app.vue                     # 루트 컴포넌트 (헤더, 네비게이션)
├── assets/
│   └── css/main.css            # TailwindCSS v4 + Nuxt UI 진입점
├── middleware/                  # 라우트 미들웨어
│   ├── auth.ts                 # 인증 필요 페이지 보호
│   └── guest.ts                # 로그인 사용자 리다이렉트
├── pages/                      # 페이지 라우팅
│   ├── index.vue               # 메인 대시보드 (통계, 차트, 최근 기록)
│   ├── login.vue               # 로그인
│   ├── workouts/
│   │   ├── new.vue             # 운동 등록
│   │   └── [id].vue            # 운동 상세 (좋아요, 댓글, 이미지 확대)
│   ├── gallery.vue             # 갤러리 (무한 스크롤, 필터)
│   ├── ranking.vue             # 종합 순위 (횟수/연속/최장)
│   ├── calendar.vue            # 캘린더 (Phase 5)
│   └── profile/
│       └── [id].vue            # 사용자 프로필
├── components/
│   ├── dashboard/              # StatsCards, WeeklyChart, TypeDistributionChart, RecentWorkouts
│   ├── workout/                # WorkoutForm, WorkoutCard, ImageUploader
│   ├── gallery/                # GalleryCard, GalleryGrid, GalleryFilter, ImageZoomModal
│   ├── social/                 # LikeButton, CommentSection
│   ├── ranking/                # RankingTable
│   └── calendar/               # CalendarHeader, CalendarGrid, EventCard, EventList, EventFormModal
├── composables/
│   ├── useFirebase.ts          # Firebase Auth/Firestore/Storage/CurrentUser
│   └── useImageUpload.ts       # Canvas API 이미지 압축 및 업로드
├── plugins/
│   └── firebase.client.ts      # Firebase 초기화 (클라이언트 전용)
├── stores/                      # Pinia Stores
│   ├── user.ts                 # 사용자 프로필/통계
│   ├── workout.ts              # 운동 CRUD/통계
│   ├── social.ts               # 좋아요/댓글/갤러리/순위
│   └── event.ts                # 캘린더 일정 CRUD
├── types/
│   ├── workout.ts              # 운동 타입 정의
│   ├── social.ts               # 소셜 타입 정의
│   └── event.ts                # 이벤트 타입 정의
├── public/
│   └── .nojekyll               # GitHub Pages Jekyll 비활성화
└── README.md
```

## 개발 단계

### Phase 1: 기본 인프라 (완료)
- [x] 프로젝트 요구사항 정리
- [x] Nuxt 4 프로젝트 초기 설정
- [x] Firebase 프로젝트 생성 및 연동 (Auth, Firestore, Storage)
- [x] Nuxt UI v4 + TailwindCSS v4 설치 및 설정
- [x] 기본 레이아웃 및 라우팅 구성
- [x] Pinia 상태 관리 설정

### Phase 2: 인증 및 사용자 관리 (완료)
- [x] Firebase Authentication 설정 (Google 로그인)
- [x] 구글 로그인 구현 (signInWithPopup)
- [x] 사용자 프로필 페이지 (pages/profile/[id].vue)
- [x] 인증 미들웨어 (auth.ts / guest.ts)
- [x] 사용자 프로필/통계 Pinia 스토어

### Phase 3: 운동 기록 및 통계 (완료)
- [x] 운동 등록 폼 (13종류 선택, 날짜, 이미지, 메모, 해시태그)
- [x] Canvas API 이미지 압축 + Firebase Storage 업로드 (원본+썸네일)
- [x] 대시보드 차트 (Chart.js: 주간 바 차트, 종류별 도넛 차트)
- [x] 연속 운동(streak) 계산 및 통계 카드
- [x] 운동 상세 페이지, 최근 운동 목록

### Phase 4: 소셜 기능 (완료)
- [x] 갤러리 피드 (무한 스크롤, IntersectionObserver, 운동 종류 필터)
- [x] 좋아요 기능 (토글, Firestore increment 원자적 카운터)
- [x] 댓글 기능 (작성/삭제, 본인 댓글만 삭제)
- [x] 종합 순위 시스템 (전체 현황, 횟수/연속/최장 3탭, 종류별 횟수, 최근 운동일)
- [x] 이미지 확대 보기 (UModal)

### Phase 5: 캘린더 및 일정 관리 (완료)
- [x] 커스텀 월간 캘린더 그리드 (CSS Grid, 이벤트 색상 점 표시)
- [x] 행사 일정 등록 (대회, 이벤트, 모임) - 모달 폼
- [x] 단체 연습 일정 등록 (팀 훈련, 합동 운동)
- [x] 일정 상세 보기, 목록, 타입별 필터링
- [x] 일정 삭제 (작성자만)

### Phase 6: 배포 및 최적화
- [ ] GitHub Pages 배포 설정
- [ ] 성능 최적화
- [ ] SEO 설정
- [ ] 테스트

## 보안 및 제약사항

### Firebase Security Rules
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId
                    || (request.auth != null
                        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'comments']));
    }
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                     && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null
                     && request.auth.uid == resource.data.userId;
    }
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                     && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null
                     && request.auth.uid == resource.data.userId;
    }
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.createdBy;
    }
  }
}

// Storage Rules
service firebase.storage {
  match /b/{bucket}/o {
    match /workouts/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

### 성능 최적화
- 이미지 lazy loading (갤러리 썸네일)
- 무한 스크롤 페이지네이션 (IntersectionObserver + cursor 기반)
- Firestore 쿼리 최적화 (복합 인덱스)
- 이미지 브라우저 내 압축 (Canvas API, 원본+썸네일)

### 비용 관리 (Firebase 무료 플랜)
- Firestore: 1GB 저장, 50K 읽기/20K 쓰기 (일일)
- Storage: 5GB 저장, 1GB 다운로드 (일일)
- Authentication: 무제한 (무료)

## 시작 날짜
2026-02-06

## 참고 링크
- Nuxt 4: https://nuxt.com
- Firebase: https://firebase.google.com
- TailwindCSS: https://tailwindcss.com
