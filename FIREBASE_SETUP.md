# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: workout-dashboard)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. 웹 앱 추가

1. Firebase 프로젝트 대시보드에서 "웹" 아이콘 클릭
2. 앱 닉네임 입력 (예: workout-web)
3. Firebase Hosting 설정 체크 (선택사항, GitHub Pages 사용 예정)
4. "앱 등록" 클릭
5. Firebase SDK 설정 정보 복사

## 3. 환경 변수 설정

1. 프로젝트 루트에 `.env` 파일 생성
2. `.env.example` 파일의 내용을 복사
3. Firebase Console에서 복사한 설정값으로 교체

```bash
cp .env.example .env
# 그 다음 .env 파일을 편집하여 실제 값 입력
```

## 4. Authentication 설정

1. Firebase Console > Build > Authentication
2. "시작하기" 클릭
3. "Sign-in method" 탭
4. "Google" 활성화
   - 프로젝트 지원 이메일 선택
   - "저장" 클릭

**나중에 추가 (Phase 7):**
- 네이버 로그인
- 카카오 로그인

## 5. Firestore Database 설정

1. Firebase Console > Build > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 위치 선택: `asia-northeast3 (Seoul)` 권장
4. 보안 규칙 선택: "테스트 모드에서 시작" (나중에 변경)
5. "만들기" 클릭

### Security Rules 설정

Firestore Database > 규칙 탭으로 이동하여 아래 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == userId;
      allow update, delete: if request.auth.uid == userId;
    }

    // Workouts collection
    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    // Likes collection
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth.uid == resource.data.userId;
    }

    // Comments collection
    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

## 6. Storage 설정

1. Firebase Console > Build > Storage
2. "시작하기" 클릭
3. 보안 규칙: "테스트 모드에서 시작" 선택
4. 위치: Firestore와 동일하게 `asia-northeast3 (Seoul)`
5. "완료" 클릭

### Storage Rules 설정

Storage > 규칙 탭으로 이동하여 아래 규칙 적용:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Workout images
    match /workouts/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024  // 10MB 제한
                   && request.resource.contentType.matches('image/.*');  // 이미지만 허용
    }

    // Profile images
    match /profiles/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024  // 5MB 제한
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 7. Firestore 인덱스 설정

데이터가 쌓이면서 복합 쿼리를 위한 인덱스가 필요합니다.

Firestore Database > 색인 탭:

### workouts 컬렉션 인덱스

1. **최신 운동 기록 조회**
   - 컬렉션: `workouts`
   - 필드: `date` (내림차순)
   - 쿼리 범위: 컬렉션

2. **사용자별 운동 기록**
   - 컬렉션: `workouts`
   - 필드:
     - `userId` (오름차순)
     - `date` (내림차순)
   - 쿼리 범위: 컬렉션

3. **운동 종류별 조회**
   - 컬렉션: `workouts`
   - 필드:
     - `workoutType` (오름차순)
     - `date` (내림차순)
   - 쿼리 범위: 컬렉션

**참고:** 앱을 실행하면서 필요한 인덱스는 Firebase가 자동으로 제안합니다.

## 8. 할당량 및 사용량 모니터링

Firebase Console > 사용량 및 결제:
- Firestore: 읽기/쓰기/삭제 횟수
- Storage: 저장 용량 및 다운로드 용량
- Authentication: 활성 사용자 수

**무료 플랜 제한:**
- Firestore: 50K 읽기, 20K 쓰기, 1GB 저장 (일일)
- Storage: 5GB 저장, 1GB 다운로드 (일일)
- Authentication: 무제한

## 완료!

모든 설정이 완료되면:
1. `.env` 파일에 Firebase 설정값 입력
2. `pnpm dev` 실행하여 개발 서버 시작
3. Firebase 연동 테스트
