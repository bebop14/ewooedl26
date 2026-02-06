# 오늘 운동 완료 대시보드 (오운완) - 요구사항 정의서

## 프로젝트 개요
- **목적**: 오늘 완료한 운동을 기록하고 공유하며 사용자간 랭킹을 제공하는 소셜 운동 플랫폼
- **배포 환경**: GitHub Pages (프론트엔드) + Firebase (백엔드)
- **데이터 저장**: Firebase Firestore + Firebase Storage

## 핵심 기능

### 1. 사용자 인증
- **1단계 (우선 구현)**
  - 구글 로그인 (Firebase Authentication 기본 제공)
  - 로그아웃
  - 사용자 프로필 관리
- **2단계 (후순위)**
  - 네이버 로그인 (OAuth 2.0 + Firebase Custom Auth)
  - 카카오 로그인 (OAuth 2.0 + Firebase Custom Auth)

### 2. 오운완 등록
- 운동 종류 선택 (런닝, 헬스, 요가, 수영, 자전거 등)
- 운동 시간 기록
- 세트/횟수/무게 입력 (선택사항)
- **이미지 파일 업로드** (인증샷)
  - Firebase Storage에 저장
  - 이미지 압축 및 최적화
  - 썸네일 자동 생성
- 메모 추가 (선택사항)
- 해시태그 기능

### 3. 개인별 운동 통계 기록
- **게이지 바 표시**
  - 오늘의 운동 목표 달성률
  - 주간/월간 운동량 시각화
  - 운동 종류별 분포
- **연속 운동 기간 표시**
  - 현재 연속 운동일수 (스트릭)
  - 최장 연속 기록
  - 주간/월간 운동 빈도
- 총 운동 시간 및 횟수
- 개인 기록 (PR) 관리

### 4. 종합 순위
- 전체 사용자 랭킹
  - 일간 운동 시간 순위
  - 주간 운동 시간 순위
  - 월간 운동 시간 순위
  - 연속 운동일수 순위
- 실시간 업데이트
- 페이지네이션
- 내 순위 강조 표시

### 5. 갤러리 (업로드된 이미지)
- 전체 사용자의 오운완 이미지 피드
- 무한 스크롤 또는 페이지네이션
- 좋아요 기능
- 댓글 기능
- 이미지 확대 보기
- 필터링 (운동 종류, 날짜)

### 6. 캘린더 / 스케줄 관리
- 월간 캘린더 뷰
- 운동한 날짜 표시 (히트맵 스타일)
- 날짜별 운동 기록 상세 보기
- 운동 계획 등록
- 목표 설정 및 추적
- 알림 기능 (브라우저 알림)

## 기술 스택

### Frontend
- **Framework**: Nuxt 4 + Vue 3
- **Rendering**: SPA (Client-Side Rendering) for GitHub Pages
- **UI Library**:
  - Nuxt UI v4 (컴포넌트 + TailwindCSS v4 포함)
  - Chart.js / Vue-ChartJS (차트 및 게이지) - Phase 3에서 추가 예정
  - @fullcalendar/vue3 (캘린더) - Phase 5에서 추가 예정
- **상태 관리**: Pinia (Nuxt 3/4 권장)
- **파일 업로드**: vue-dropzone 또는 직접 구현
- **이미지 최적화**: Nuxt Image

### Backend (Firebase)
- **Authentication**: Firebase Authentication
  - Google Provider (1단계)
  - Custom Auth Provider (네이버, 카카오 - 2단계)
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
  - 네이버/카카오 OAuth 처리 (2단계)

### 배포 및 도구
- **호스팅**: GitHub Pages (Static)
- **버전 관리**: Git/GitHub
- **패키지 매니저**: pnpm (Nuxt 권장) 또는 npm
- **빌드**: Nuxt generate (SSG)

## 데이터 구조 (Firestore)

### Users Collection
```javascript
users/{userId}
  - displayName: string
  - email: string
  - photoURL: string
  - provider: 'google' | 'naver' | 'kakao'
  - createdAt: timestamp
  - stats: {
      totalWorkouts: number
      totalMinutes: number
      currentStreak: number
      longestStreak: number
      lastWorkoutDate: date
    }
```

### Workouts Collection
```javascript
workouts/{workoutId}
  - userId: string
  - userName: string
  - userPhoto: string
  - workoutType: string
  - duration: number (분)
  - date: timestamp
  - imageUrl: string (Storage URL)
  - thumbnailUrl: string
  - memo: string
  - sets: number (optional)
  - reps: number (optional)
  - weight: number (optional)
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
│   ├── index.vue               # 메인 대시보드
│   ├── login.vue               # 로그인
│   ├── workouts/               # (Phase 3에서 추가)
│   │   ├── new.vue             # 운동 등록
│   │   └── [id].vue            # 운동 상세
│   ├── gallery.vue             # 갤러리 (Phase 4)
│   ├── ranking.vue             # 순위 (Phase 4)
│   ├── calendar.vue            # 캘린더 (Phase 5)
│   └── profile/
│       └── [id].vue            # 사용자 프로필
├── components/                  # 재사용 컴포넌트 (Phase 3~에서 추가)
├── composables/
│   └── useFirebase.ts          # Firebase Auth/Firestore/Storage/CurrentUser
├── plugins/
│   └── firebase.client.ts      # Firebase 초기화 (클라이언트 전용)
├── stores/                      # Pinia Stores
│   └── user.ts                 # 사용자 프로필/통계
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

### Phase 3: 운동 기록 및 통계 (다음)
- [ ] 운동 등록 폼
- [ ] 이미지 업로드 기능
- [ ] 개인 대시보드
- [ ] 게이지 바 및 통계 시각화
- [ ] 연속 운동 기간 계산 로직

### Phase 4: 소셜 기능 (1주)
- [ ] 갤러리 피드
- [ ] 좋아요 기능
- [ ] 댓글 기능
- [ ] 종합 순위 시스템

### Phase 5: 캘린더 및 스케줄 (3일)
- [ ] 캘린더 뷰
- [ ] 운동 계획 등록
- [ ] 목표 설정

### Phase 6: 배포 및 최적화 (2일)
- [ ] GitHub Pages 배포 설정
- [ ] 성능 최적화
- [ ] SEO 설정
- [ ] 테스트

### Phase 7: 추가 인증 (후순위)
- [ ] 네이버 로그인
- [ ] 카카오 로그인

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
      allow update, delete: if request.auth.uid == resource.data.userId;
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
- 이미지 lazy loading (Nuxt Image)
- 무한 스크롤 페이지네이션
- Firestore 쿼리 최적화 (복합 인덱스)
- 캐싱 전략 (Nuxt payload)
- SSG로 초기 로딩 속도 향상

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
