/*
  # RLS 정책 수정 및 회원가입 문제 해결

  1. 문제점
    - RLS 정책이 제대로 작동하지 않음
    - 프로필 생성 시 권한 문제
    - CORS 및 인증 문제

  2. 해결책
    - RLS 정책 재설정
    - 더 간단한 프로필 생성 로직
    - 이메일 확인 비활성화
*/

-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Everyone can read questions" ON questions;
DROP POLICY IF EXISTS "Only admins can manage questions" ON questions;

-- RLS 비활성화 후 재활성화
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 새로운 프로필 정책 (더 관대한 정책)
CREATE POLICY "Allow all authenticated users to read profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 질문 정책 (읽기는 모든 사용자, 쓰기는 관리자만)
CREATE POLICY "Allow all to read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 관리자 계정 미리 생성 (이메일 확인 없이)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@woowacourse.io',
  crypt('admin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"nickname": "관리자"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- 관리자 프로필 생성
INSERT INTO profiles (
  user_id,
  email,
  nickname,
  affiliation,
  is_admin
) 
SELECT 
  u.id,
  'admin@woowacourse.io',
  '관리자',
  '우아한테크코스',
  true
FROM auth.users u 
WHERE u.email = 'admin@woowacourse.io'
ON CONFLICT (email) DO NOTHING;