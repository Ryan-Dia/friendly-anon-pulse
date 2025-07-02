/*
  # with 앱 데이터베이스 스키마 생성

  1. 새로운 테이블들
    - `profiles` - 사용자 프로필 정보
    - `questions` - 오늘의 질문들
    - `votes` - 투표 기록
    - `notifications` - 알림 데이터
    - `board_posts` - 게시판 글

  2. 보안
    - 모든 테이블에 RLS 활성화
    - 적절한 정책 설정

  3. 기능
    - 실시간 구독을 위한 설정
    - 자동 타임스탬프
*/

-- 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nickname text NOT NULL,
  affiliation text NOT NULL DEFAULT '우아한테크코스',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 질문 테이블
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  is_active boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 투표 테이블
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  question_content text NOT NULL,
  vote_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('vote', 'friend_request', 'system')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 게시판 글 테이블
CREATE TABLE IF NOT EXISTS board_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('question', 'improvement')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

-- 프로필 정책
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 질문 정책
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
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- 투표 정책
CREATE POLICY "Users can read votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own votes"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = voter_id AND user_id = auth.uid()
    )
  );

-- 알림 정책
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = recipient_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = recipient_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 게시판 정책
CREATE POLICY "Everyone can read board posts"
  ON board_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON board_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = author_id AND user_id = auth.uid()
    )
  );

-- 기본 질문 데이터 삽입
INSERT INTO questions (content, order_index) VALUES
  ('오늘 가장 함께 점심을 먹고 싶은 사람은?', 0),
  ('세상에서 제일 웃긴 것 같은 사람은?', 1),
  ('힘든 일이 있을 때 기대고 싶은 사람은?', 2),
  ('가장 센스가 좋다고 생각하는 사람은?', 3),
  ('같이 여행을 가고 싶은 사람은?', 4),
  ('가장 열정적이라고 생각하는 사람은?', 5),
  ('함께 프로젝트를 하고 싶은 사람은?', 6)
ON CONFLICT DO NOTHING;

-- 첫 번째 질문을 활성화
UPDATE questions SET is_active = true WHERE order_index = 0;

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_posts_updated_at 
  BEFORE UPDATE ON board_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();