/*
  # RLS 정책 수정 및 회원가입 문제 해결

  1. 문제점
    - RLS 정책이 제대로 작동하지 않음
    - 프로필 생성 시 권한 문제

  2. 해결책
    - RLS 정책 재설정
    - 더 간단한 프로필 생성 로직
*/

-- 기존 정책들 삭제
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Everyone can read questions" ON questions;
DROP POLICY IF EXISTS "Only admins can manage questions" ON questions;

-- 새로운 프로필 정책 (더 관대한 정책)
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO public
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO public
  USING (uid() = user_id);

-- 질문 정책 (읽기는 모든 사용자, 쓰기는 관리자만)
CREATE POLICY "Everyone can read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = uid() AND is_admin = true
    )
  );