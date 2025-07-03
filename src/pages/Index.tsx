import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Vote, Heart, MessageCircle, Settings, User, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoginModal from "@/components/LoginModal";
import VoteModal from "@/components/VoteModal";
import AdminModal from "@/components/AdminModal";
import MyPage from "@/components/MyPage";
import ParticipantsModal from "@/components/ParticipantsModal";
import BoardModal from "@/components/BoardModal";
import { 
  getProfile, 
  getAllProfiles, 
  getActiveQuestion, 
  hasVotedToday, 
  getUnreadNotificationCount,
  subscribeToVotes,
  subscribeToNotifications,
  subscribeToProfiles,
  signOut,
  initializeQuestions
} from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  nickname: string;
  affiliation: string;
  isAdmin?: boolean;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [unreadVotes, setUnreadVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // 1. 먼저 인증 상태 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setLoading(false);
            setAuthChecked(true);
          }
          return;
        }

        console.log('Session check complete:', session?.user?.email || 'No session');

        // 2. 세션이 있으면 프로필 로드
        if (session?.user && mounted) {
          console.log('Loading user profile...');
          try {
            const profile = await getProfile();
            if (profile && mounted) {
              console.log('Profile loaded:', profile.nickname);
              setUser(profile);
            }
          } catch (profileError) {
            console.error('Profile load error:', profileError);
            // 프로필 로드 실패해도 계속 진행
          }
        }

        // 3. 기본 데이터 로드 (질문, 멤버 수)
        if (mounted) {
          await loadBasicData();
        }

        // 4. 사용자별 데이터 로드
        if (session?.user && mounted) {
          await loadUserSpecificData();
        }

      } catch (error) {
        console.error('App initialization error:', error);
        if (mounted) {
          toast({
            title: "초기화 오류",
            description: "앱을 초기화하는 중 오류가 발생했습니다.",
            variant: "destructive"
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    initializeApp();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in, loading profile...');
        try {
          const profile = await getProfile();
          if (profile && mounted) {
            setUser(profile);
            await loadUserSpecificData();
          }
        } catch (error) {
          console.error('Profile load error after signin:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        if (mounted) {
          setUser(null);
          setHasVoted(false);
          setUnreadVotes(0);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadBasicData = async () => {
    try {
      console.log('Loading basic data...');
      
      // 질문 초기화 및 로드
      await initializeQuestions();
      const question = await getActiveQuestion();
      setCurrentQuestion(question);
      console.log('Question loaded:', question?.content);

      // 멤버 수 로드
      const profiles = await getAllProfiles();
      setMemberCount(profiles.length);
      console.log('Member count:', profiles.length);

    } catch (error) {
      console.error('Basic data load error:', error);
      
      // 에러 메시지 개선
      let errorMessage = "기본 데이터를 불러오는데 실패했습니다.";
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "네트워크 연결을 확인해주세요.";
        } else if (error.message.includes('row-level security')) {
          errorMessage = "데이터베이스 권한 문제가 발생했습니다.";
        }
      }
      
      toast({
        title: "데이터 로딩 오류",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const loadUserSpecificData = async () => {
    try {
      console.log('Loading user-specific data...');
      
      // 오늘 투표 여부 확인
      const voted = await hasVotedToday();
      setHasVoted(voted);
      console.log('Has voted today:', voted);

      // 읽지 않은 알림 수
      const unreadCount = await getUnreadNotificationCount();
      setUnreadVotes(unreadCount);
      console.log('Unread notifications:', unreadCount);

    } catch (error) {
      console.error('User-specific data load error:', error);
      // 사용자별 데이터 로드 실패는 치명적이지 않으므로 토스트 없이 로그만
    }
  };

  const setupSubscriptions = () => {
    if (!user) return;

    console.log('Setting up subscriptions...');
    
    // 투표 실시간 구독
    const votesSubscription = subscribeToVotes(() => {
      console.log('Votes updated, reloading data...');
      loadUserSpecificData();
    });

    // 알림 실시간 구독
    const notificationsSubscription = subscribeToNotifications(() => {
      console.log('Notifications updated...');
      getUnreadNotificationCount().then(setUnreadVotes).catch(console.error);
    });

    // 프로필 실시간 구독
    const profilesSubscription = subscribeToProfiles(() => {
      console.log('Profiles updated...');
      getAllProfiles().then(profiles => setMemberCount(profiles.length)).catch(console.error);
    });

    return () => {
      votesSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  };

  // 구독 설정 (사용자가 로그인했을 때만)
  useEffect(() => {
    if (user && authChecked) {
      const cleanup = setupSubscriptions();
      return cleanup;
    }
  }, [user, authChecked]);

  const handleVote = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowVoteModal(true);
  };

  const handleVoteComplete = async () => {
    setHasVoted(true);
    await loadUserSpecificData();
    toast({
      title: "투표 완료!",
      description: "익명으로 투표가 전송되었습니다.",
    });
  };

  const handleLoginSuccess = async (newUser: User) => {
    console.log('Login successful for:', newUser.nickname);
    setUser(newUser);
    
    // 로그인 후 사용자별 데이터 로드
    await loadUserSpecificData();
    
    toast({
      title: "로그인 성공!",
      description: `안녕하세요, ${newUser.nickname}님!`,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setHasVoted(false);
      setUnreadVotes(0);
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "로그아웃 오류",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshQuestion = async () => {
    setQuestionLoading(true);
    try {
      await loadBasicData();
      toast({
        title: "새로고침 완료",
        description: "질문을 다시 불러왔습니다.",
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast({
        title: "새로고침 실패",
        description: "질문을 새로고침하는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setQuestionLoading(false);
    }
  };

  // 로딩 상태 개선
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center mx-auto animate-pulse">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">앱을 초기화하는 중...</p>
            <div className="w-32 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.isAdmin || user?.email === 'admin@woowacourse.io';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">with</h1>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdminModal(true)}
                className="text-blue-600"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {user ? (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMyPage(true)}
                  className="relative"
                >
                  <User className="h-4 w-4" />
                  {unreadVotes > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                    >
                      {unreadVotes}
                    </Badge>
                  )}
                </Button>
                <span className="text-sm text-gray-600">{user.nickname}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  로그아웃
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLoginModal(true)}
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            익명 투표 플랫폼
          </h2>
          <p className="text-gray-600">
            익명으로 소통하고 서로를 알아가는 공간
          </p>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Users className="h-3 w-3 mr-1" />
            {memberCount}명 참여중
          </Badge>
        </div>

        {/* Today's Question Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
          <CardHeader className="pb-3 pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-white/80">우아한테크코스</p>
              <p className="text-xs text-white/70">2025년 크루들로부터</p>
            </div>
            <CardTitle className="text-lg flex items-center justify-center">
              <Vote className="h-5 w-5 mr-2" />
              오늘의 질문
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl">🤔</span>
              </div>
              
              {questionLoading ? (
                <p className="text-white/80 text-lg">질문을 불러오는 중...</p>
              ) : currentQuestion ? (
                <p className="text-white font-medium text-lg leading-relaxed">
                  {currentQuestion.content}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-white/80 text-lg">질문을 불러올 수 없습니다</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshQuestion}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    disabled={questionLoading}
                  >
                    {questionLoading ? "로딩중..." : "다시 시도"}
                  </Button>
                </div>
              )}
            </div>
            
            {hasVoted ? (
              <div className="flex items-center justify-center space-x-2 bg-white/20 rounded-2xl p-4">
                <Heart className="h-4 w-4 text-pink-200" />
                <span className="text-sm text-white/90">오늘 투표를 완료했습니다</span>
              </div>
            ) : (
              <Button
                onClick={handleVote}
                className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold py-3 rounded-2xl"
                size="lg"
                disabled={!currentQuestion || questionLoading}
              >
                <Vote className="h-4 w-4 mr-2" />
                투표하기
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowParticipantsModal(true)}
          >
            <CardContent className="p-6 text-center space-y-2">
              <Users className="h-8 w-8 mx-auto text-blue-500" />
              <h3 className="font-semibold text-gray-900">참여자 목록</h3>
              <p className="text-sm text-gray-600">함께하는 크루들을 확인해보세요</p>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setShowBoardModal(true)}
          >
            <CardContent className="p-6 text-center space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto text-green-500" />
              <h3 className="font-semibold text-gray-900">게시판</h3>
              <p className="text-sm text-gray-600">질문 아이디어와 개선사항 공유</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">커뮤니티 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">전체 멤버</span>
              <Badge>{memberCount}명</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">오늘 투표 참여</span>
              <Badge variant="secondary">진행중</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">현재 질문</span>
              <Badge variant="outline">
                {currentQuestion ? '활성' : '로딩중'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {memberCount <= 4 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center space-y-3">
              <div className="text-orange-600">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <h3 className="font-semibold">친구를 초대해보세요!</h3>
                <p className="text-sm text-orange-600/80 mt-1">
                  더 많은 친구들과 함께하면 더 재미있어요
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-orange-300 text-orange-600 hover:bg-orange-100"
                onClick={() => {
                  toast({
                    title: "친구 초대",
                    description: "곧 친구 초대 기능이 추가될 예정입니다!",
                  });
                }}
              >
                친구 초대하기
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLoginSuccess}
      />
      
      <VoteModal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        question={currentQuestion?.content || ""}
        questionId={currentQuestion?.id}
        user={user}
        onVoteComplete={handleVoteComplete}
      />

      {isAdmin && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      <MyPage
        isOpen={showMyPage}
        onClose={() => setShowMyPage(false)}
        user={user}
      />

      <ParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
      />

      <BoardModal
        isOpen={showBoardModal}
        onClose={() => setShowBoardModal(false)}
        user={user}
      />
    </div>
  );
};

export default Index;