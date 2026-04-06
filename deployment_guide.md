## 1. GitHub에 코드 올리기 (저장소 생성)

Vercel 배포를 위해서는 먼저 코드가 GitHub에 올라가 있어야 합니다.

1.  **GitHub 저장소 생성**:
    - [GitHub](https://github.com/)에 로그인하고 'New Repository'를 클릭합니다.
    - 저장소 이름(예: `hkmagazine-ai-guide`)을 정하고 생성합니다.
2.  **로컬 코드 업로드 (터미널)**:
    - 앱 폴더(`한경`)의 최상위 경로에서 다음 명령어를 차례대로 입력합니다:

```bash
# git 초기화
git init

# 모든 파일 추가
git add .

# 첫 번째 커밋
git commit -m "Initial commit"

# 메인 브랜치 설정 (보통 main)
git branch -M main

# GitHub 저장소 연결 (본인의 저장소 주소로 변경하세요)
git remote add origin https://github.com/사용자이름/저장소이름.git

# 코드 전송 (푸시)
git push -u origin main
```

---

## 2. 데이터베이스 설정 (OAuth 이후)

## 1. 사전 준비 사항

배포를 위해 다음 계정들이 필요합니다:
- **GitHub**: 소스 코드 저장소
- **Vercel**: 웹 호스팅 및 배포
- **Supabase**: PostgreSQL 데이터베이스 및 스토리지
- **Firebase**: Firestore(기존 데이터 관리용) 및 인증(선택 사항)

---

## 2. 데이터베이스 설정

### A. Supabase 설정

1. [Supabase Console](https://app.supabase.com/)에서 새 프로젝트를 생성합니다.
2. **SQL Editor**에서 아래 쿼리를 실행하여 `posts` 테이블을 생성합니다:

```sql
-- 게시물 테이블 생성
create table posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null,
  image_url text,
  user_id uuid references auth.users(id) not null
);

-- RLS (Row Level Security) 설정
alter table posts enable row level security;

-- 모든 사용자가 게시물을 읽을 수 있도록 허용
create policy "누구나 게시물을 볼 수 있습니다." on posts
  for select using (true);

-- 인증된 사용자만 게시물을 작성할 수 있도록 허용
create policy "인증된 사용자만 게시물을 작성할 수 있습니다." on posts
  for insert with check (auth.role() = 'authenticated');
```

3. **Storage** 메뉴에서 `images`라는 이름의 새로운 공개(Public) 버킷을 생성합니다.
   - 이미 업로드 기능을 사용하려면 이 버킷이 반드시 필요합니다.
   - 업로드된 이미지는 `post-images` 폴더 안에 저장됩니다.

### B. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트를 생성합니다.
2. **Firestore Database**를 활성화하고, 다음 컬렉션을 확인하거나 생성합니다:
   - `guides`: 가이드 데이터 저장
   - `config`: `categories`, `siteSettings` 등의 설정 데이터 저장

---

## 3. 환경 변수 (Environment Variables) 설정

Vercel 배포 시 다음 환경 변수들을 설정해야 합니다. `.env.local` 파일의 내용을 기반으로 입력하세요.

| 변수명 | 설명 | 확인 위치 |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 (Anon Key) | Settings > API |
| `VITE_FIREBASE_API_KEY` | Firebase API 키 | 프로젝트 설정 > 일반 |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase 인증 도메인 | 프로젝트 설정 > 일반 |
| `VITE_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID | 프로젝트 설정 > 일반 |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase 스토리지 버킷 | 프로젝트 설정 > 일반 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase 발신자 ID | 프로젝트 설정 > 일반 |
| `VITE_FIREBASE_APP_ID` | Firebase 앱 ID | 프로젝트 설정 > 일반 |

---

## 4. Vercel 배포 단계

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 **Add New > Project**를 클릭합니다.
2. GitHub 저장소를 연결합니다.
3. **Environment Variables** 섹션에서 위 3번 항목의 변수들을 모두 추가합니다.
4. **Build and Output Settings**는 기본값(Next.js)으로 유지합니다.
5. **Deploy** 버튼을 클릭하여 배포를 시작합니다.

---

## 5. 로컬 개발 환경 실행

로컬에서 테스트하려면 다음 명령어를 사용하세요:

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 확인할 수 있습니다.

---

## 6. 주의 사항 및 팁

- **보안**: `ANON_KEY`는 클라이언트 측에서 사용 가능하지만, 중요한 로직은 항상 Supabase의 **RLS(Row Level Security)**를 통해 보호해야 합니다.
- **이미지 업로드**: Supabase Storage의 `posts` 버킷이 Public으로 설정되어 있는지 확인하세요.
- **도메인**: Vercel 배포 후 제공되는 `.vercel.app` 도메인 외에 커스텀 도메인을 연결하려면 Vercel Settings > Domains에서 설정할 수 있습니다.
