import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type Profile = Tables['profiles']['Row'];
type Question = Tables['questions']['Row'];
type Vote = Tables['votes']['Row'];
type Notification = Tables['notifications']['Row'];
type BoardPost = Tables['board_posts']['Row'];

export interface User {
  id: string;
  email: string;
  nickname: string;
  affiliation: string;
  isAdmin?: boolean;
}

export interface VoteData {
  voterId: string;
  candidateId: string;
  questionId: string;
  questionContent: string;
  timestamp: string;
  date: string;
}

// 프로필 관련 함수들
export const createProfile = async (userData: {
  email: string;
  nickname: string;
  affiliation: string;
  isAdmin?: boolean;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      email: userData.email,
      nickname: userData.nickname,
      affiliation: userData.affiliation,
      is_admin: userData.isAdmin || false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getProfile = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Profile fetch error:', error);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    nickname: data.nickname,
    affiliation: data.affiliation,
    isAdmin: data.is_admin
  };
};

export const getAllProfiles = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('affiliation', '우아한테크코스')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Profiles fetch error:', error);
    throw error;
  }

  return data.map(profile => ({
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    affiliation: profile.affiliation,
    isAdmin: profile.is_admin
  }));
};

// 질문 관련 함수들
export const getQuestions = async () => {
  console.log('Fetching all questions...');
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Questions fetch error:', error);
    throw error;
  }
  
  console.log('Questions fetched:', data);
  return data;
};

export const getActiveQuestion = async () => {
  console.log('Fetching active question...');
  
  // 먼저 활성 질문이 있는지 확인
  const { data: activeData, error: activeError } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (activeError) {
    console.error('Active question fetch error:', activeError);
    throw activeError;
  }

  // 활성 질문이 있으면 반환
  if (activeData) {
    console.log('Active question found:', activeData);
    return activeData;
  }

  // 활성 질문이 없으면 첫 번째 질문을 활성화
  console.log('No active question found, activating first question...');
  
  const { data: firstQuestion, error: firstError } = await supabase
    .from('questions')
    .select('*')
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (firstError) {
    console.error('First question fetch error:', firstError);
    throw firstError;
  }

  if (firstQuestion) {
    // 첫 번째 질문을 활성화
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('questions')
      .update({ is_active: true })
      .eq('id', firstQuestion.id)
      .select()
      .single();

    if (updateError) {
      console.error('Question activation error:', updateError);
      throw updateError;
    }

    console.log('First question activated:', updatedQuestion);
    return updatedQuestion;
  }

  throw new Error('No questions found in database');
};

export const updateQuestion = async (id: string, content: string) => {
  const { data, error } = await supabase
    .from('questions')
    .update({ content })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const setActiveQuestion = async (id: string) => {
  // 모든 질문을 비활성화
  await supabase
    .from('questions')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000');

  // 선택된 질문을 활성화
  const { data, error } = await supabase
    .from('questions')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 기본 질문들을 데이터베이스에 삽입하는 함수
export const initializeQuestions = async () => {
  console.log('Initializing questions...');
  
  const defaultQuestions = [
    { content: '오늘 가장 함께 점심을 먹고 싶은 사람은?', order_index: 0 },
    { content: '세상에서 제일 웃긴 것 같은 사람은?', order_index: 1 },
    { content: '힘든 일이 있을 때 기대고 싶은 사람은?', order_index: 2 },
    { content: '가장 센스가 좋다고 생각하는 사람은?', order_index: 3 },
    { content: '같이 여행을 가고 싶은 사람은?', order_index: 4 },
    { content: '가장 열정적이라고 생각하는 사람은?', order_index: 5 },
    { content: '함께 프로젝트를 하고 싶은 사람은?', order_index: 6 }
  ];

  try {
    // 기존 질문이 있는지 확인
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('id')
      .limit(1);

    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Questions already exist, skipping initialization');
      return;
    }

    // 질문들 삽입
    const { data, error } = await supabase
      .from('questions')
      .insert(defaultQuestions)
      .select();

    if (error) {
      console.error('Question initialization error:', error);
      throw error;
    }

    console.log('Questions initialized:', data);

    // 첫 번째 질문을 활성화
    if (data && data.length > 0) {
      await supabase
        .from('questions')
        .update({ is_active: true })
        .eq('id', data[0].id);
      
      console.log('First question activated');
    }

    return data;
  } catch (error) {
    console.error('Failed to initialize questions:', error);
    throw error;
  }
};

// 투표 관련 함수들
export const createVote = async (voteData: {
  candidateId: string;
  questionId: string;
  questionContent: string;
}) => {
  const profile = await getProfile();
  if (!profile) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('votes')
    .insert({
      voter_id: profile.id,
      candidate_id: voteData.candidateId,
      question_id: voteData.questionId,
      question_content: voteData.questionContent
    })
    .select()
    .single();

  if (error) throw error;

  // 알림 생성
  await createNotification({
    recipientId: voteData.candidateId,
    type: 'vote',
    message: `누군가 당신에게 투표했습니다: "${voteData.questionContent}"`
  });

  return data;
};

export const getVotesForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('candidate_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getTodayVotes = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('votes')
    .select('*, candidate:profiles!votes_candidate_id_fkey(nickname)')
    .eq('vote_date', today);

  if (error) throw error;
  return data;
};

export const hasVotedToday = async (): Promise<boolean> => {
  const profile = await getProfile();
  if (!profile) return false;

  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('voter_id', profile.id)
    .eq('vote_date', today)
    .limit(1);

  if (error) {
    console.error('Vote check error:', error);
    return false;
  }
  
  return data.length > 0;
};

// 알림 관련 함수들
export const createNotification = async (notificationData: {
  recipientId: string;
  type: 'vote' | 'friend_request' | 'system';
  message: string;
  metadata?: any;
}) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: notificationData.recipientId,
      type: notificationData.type,
      message: notificationData.message,
      metadata: notificationData.metadata || {}
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getNotifications = async () => {
  const profile = await getProfile();
  if (!profile) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const markNotificationAsRead = async (id: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markAllNotificationsAsRead = async () => {
  const profile = await getProfile();
  if (!profile) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', profile.id)
    .eq('is_read', false);

  if (error) throw error;
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const profile = await getProfile();
  if (!profile) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', profile.id)
    .eq('is_read', false);

  if (error) {
    console.error('Unread notification count error:', error);
    return 0;
  }
  return count || 0;
};

// 게시판 관련 함수들
export const createBoardPost = async (postData: {
  type: 'question' | 'improvement';
  content: string;
}) => {
  const profile = await getProfile();
  if (!profile) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('board_posts')
    .insert({
      author_id: profile.id,
      type: postData.type,
      content: postData.content
    })
    .select('*, author:profiles!board_posts_author_id_fkey(nickname)')
    .single();

  if (error) throw error;
  return data;
};

export const getBoardPosts = async (type?: 'question' | 'improvement') => {
  let query = supabase
    .from('board_posts')
    .select('*, author:profiles!board_posts_author_id_fkey(nickname)')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// 인증 관련 함수들
export const signUp = async (email: string, password: string, nickname: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    // 프로필 생성
    await createProfile({
      email,
      nickname,
      affiliation: '우아한테크코스',
      isAdmin: email === 'admin@woowacourse.io'
    });
  }

  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// 실시간 구독 함수들
export const subscribeToVotes = (callback: (payload: any) => void) => {
  return supabase
    .channel('votes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, callback)
    .subscribe();
};

export const subscribeToNotifications = (callback: (payload: any) => void) => {
  return supabase
    .channel('notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, callback)
    .subscribe();
};

export const subscribeToProfiles = (callback: (payload: any) => void) => {
  return supabase
    .channel('profiles')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
    .subscribe();
};