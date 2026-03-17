# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. 웹 앱 추가

1. Firebase 프로젝트 대시보드에서 "웹" 아이콘 클릭
2. 앱 닉네임 입력
3. "앱 등록" 클릭
4. 표시된 SDK 설정 정보 복사

## 3. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 Firebase Console에서 복사한 값 입력
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

> GitHub Actions 자동 배포 시 Repository Secrets에도 동일하게 등록 필요. [DEPLOYMENT.md](./DEPLOYMENT.md) 참고.

## 4. Authentication 설정

1. Firebase Console > Build > Authentication > 시작하기
2. Sign-in method 탭 > Google 활성화
3. 프로젝트 지원 이메일 선택 후 저장

## 5. Firestore Database 설정

1. Firebase Console > Build > Firestore Database > 데이터베이스 만들기
2. 위치: `asia-northeast3 (Seoul)` 권장
3. 보안 규칙: 프로덕션 모드로 시작 (아래에서 규칙 적용)

### Firestore 보안 규칙 배포

규칙은 프로젝트 루트의 `firestore.rules`로 관리합니다.

**Firebase CLI로 배포 (권장):**

```bash
# Firebase CLI 설치 (최초 1회)
npm install -g firebase-tools
firebase login

# 규칙 배포
firebase deploy --only firestore:rules
```

**Firebase Console에서 직접 적용:**

Firestore Database > 규칙 탭에서 `firestore.rules` 파일 내용을 붙여넣기합니다.

### 현재 적용된 Firestore 규칙 (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAppAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null
        && (request.auth.uid == userId || isAppAdmin());

      match /monthlyGoals/{monthId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /workouts/{workoutId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      // 소유자: 모든 필드 수정 가능
      // 다른 인증 사용자: likes/comments 카운터 필드만 수정 가능 (좋아요/댓글 기능)
      allow update: if request.auth != null
        && (resource.data.userId == request.auth.uid
            || request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes', 'comments']));
      allow delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }

    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create, delete: if request.auth != null;
    }

    match /comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }

    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && resource.data.createdBy == request.auth.uid;
    }

    match /groups/{groupId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && (resource.data.createdBy == request.auth.uid || isAppAdmin());

      match /members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }

    match /feedback/{feedbackId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && isAppAdmin();
    }
  }
}
```

### Firestore 복합 인덱스

데이터가 쌓이면서 복합 쿼리 인덱스가 필요합니다. Firestore Database > 색인 탭에서 추가합니다.

| 컬렉션 | 필드 | 쿼리 범위 | 용도 |
|--------|------|-----------|------|
| `workouts` | `date` (내림차순) | 컬렉션 | 최신 운동 기록 |
| `workouts` | `userId` (오름차순), `date` (내림차순) | 컬렉션 | 사용자별 운동 |
| `workouts` | `workoutType` (오름차순), `date` (내림차순) | 컬렉션 | 운동 종류별 |
| `workouts` | `userId` (오름차순), `date` (오름차순) | 컬렉션 | 그룹 순위 집계 |

> 앱 실행 중 필요한 인덱스는 Firebase 콘솔 오류 메시지에서 자동으로 생성 링크를 제공합니다.

## 6. Storage 설정

1. Firebase Console > Build > Storage > 시작하기
2. 위치: Firestore와 동일하게 `asia-northeast3 (Seoul)`
3. 보안 규칙: 아래 내용 적용

Storage > 규칙 탭에서 적용:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 운동 인증샷 (최대 10MB, 이미지만)
    match /workouts/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // 프로필 이미지 (최대 5MB, 이미지만)
    match /profiles/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 7. 할당량 및 사용량 모니터링

Firebase Console > 사용량 및 결제에서 확인합니다.

**Spark 플랜(무료) 제한:**

| 서비스 | 한도 |
|--------|------|
| Firestore 읽기 | 50,000회/일 |
| Firestore 쓰기 | 20,000회/일 |
| Firestore 저장 | 1GB |
| Storage 저장 | 5GB |
| Storage 다운로드 | 1GB/일 |
| Authentication | 무제한 |
