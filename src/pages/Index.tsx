
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Vote, Heart, MessageCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoginModal from "@/components/LoginModal";
import VoteModal from "@/components/VoteModal";
import AdminModal from "@/components/AdminModal";

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
  const [todayQuestions, setTodayQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasVotedToday, setHasVotedToday] = useState(false);
  const [memberCount, setMemberCount] = useState(4);
  const { toast } = useToast();

  useEffect(() => {
    // 로컬스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      checkTodayVote(parsedUser.id);
    }
    
    // 오늘의 질문들 가져오기
    fetchTodayQuestions();
    
    // 멤버 수 가져오기
    fetchMemberCount();
  }, []);

  const fetchTodayQuestions = () => {
    const defaultQuestions = [
      "오늘 가장 함께 점심을 먹고 싶은 사람은?",
      "세상에서 제일 웃긴 것 같은 사람은?",
      "힘든 일이 있을 때 기대고 싶은 사람은?",
      "가장 센스가 좋다고 생각하는 사람은?",
      "같이 여행을 가고 싶은 사람은?"
    ];
    
    const savedQuestions = localStorage.getItem('todayQuestions');
    if (savedQuestions) {
      setTodayQuestions(JSON.parse(savedQuestions));
    } else {
      setTodayQuestions(defaultQuestions);
      localStorage.setItem('todayQuestions', JSON.stringify(defaultQuestions));
    }

    const savedIndex = localStorage.getItem('currentQuestionIndex');
    if (savedIndex) {
      setCurrentQuestionIndex(Number(savedIndex));
    }
  };

  const fetchMemberCount = () => {
    setMemberCount(4); // 더미 회원 4명으로 설정
  };

  const checkTodayVote = (userId: string) => {
    // 오늘 투표했는지 확인
    const today = new Date().toDateString();
    const lastVote = localStorage.getItem(`lastVote_${userId}`);
    if (lastVote === today) {
      setHasVotedToday(true);
    }
  };

  const handleVote = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setShowVoteModal(true);
  };

  const handleVoteComplete = () => {
    setHasVotedToday(true);
    const today = new Date().toDateString();
    localStorage.setItem(`lastVote_${user!.id}`, today);
    toast({
      title: "투표 완료!",
      description: "익명으로 투표가 전송되었습니다.",
    });
  };

  const handleNextQuestion = () => {
    const nextIndex = (currentQuestionIndex + 1) % todayQuestions.length;
    setCurrentQuestionIndex(nextIndex);
    localStorage.setItem('currentQuestionIndex', nextIndex.toString());
    
    // 새로운 질문으로 바뀌면 투표 상태 초기화
    setHasVotedToday(false);
    if (user) {
      localStorage.removeItem(`lastVote_${user.id}`);
    }
  };

  const isAdmin = user?.email === 'admin@woowacourse.io';
  const currentQuestion = todayQuestions[currentQuestionIndex] || "질문을 불러오는 중...";

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
                <span className="text-sm text-gray-600">{user.nickname}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('user');
                    setUser(null);
                    setHasVotedToday(false);
                  }}
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
            우아한테크코스와 함께
          </h2>
          <p className="text-gray-600">
            익명으로 소통하고 서로를 알아가는 공간
          </p>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Users className="h-3 w-3 mr-1" />
            {memberCount}명 참여중
          </Badge>
        </div>

        {/* Today's Question Card - 이미지 스타일 참고하여 개선 */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Badge className="bg-white/20 text-white border-white/30">
              {currentQuestionIndex + 1}/{todayQuestions.length}
            </Badge>
          </div>
          
          <CardHeader className="pb-3 pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-white/80">우아한테크코스</p>
              <p className="text-xs text-white/70">2024년 크루들로부터</p>
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
              <p className="text-white font-medium text-lg leading-relaxed">
                {currentQuestion}
              </p>
            </div>
            
            {hasVotedToday ? (
              <div className="flex items-center justify-center space-x-2 bg-white/20 rounded-2xl p-4">
                <Heart className="h-4 w-4 text-pink-200" />
                <span className="text-sm text-white/90">오늘 투표를 완료했습니다</span>
              </div>
            ) : (
              <Button
                onClick={handleVote}
                className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold py-3 rounded-2xl"
                size="lg"
              >
                <Vote className="h-4 w-4 mr-2" />
                스토어에서 HYPE 검색!
              </Button>
            )}

            {/* Question Navigation */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleNextQuestion}
                className="text-white/80 hover:text-white hover:bg-white/10"
                size="sm"
              >
                다음 질문 보기 →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-2">
              <MessageCircle className="h-8 w-8 mx-auto text-blue-500" />
              <h3 className="font-semibold text-gray-900">익명 질문</h3>
              <p className="text-sm text-gray-600">서로에게 궁금한 것을 물어보세요</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center space-y-2">
              <Heart className="h-8 w-8 mx-auto text-pink-500" />
              <h3 className="font-semibold text-gray-900">소통하기</h3>
              <p className="text-sm text-gray-600">익명으로 답변하고 소통해요</p>
            </CardContent>
          </Card>
        </div>

        {/* Community Stats */}
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
              <span className="text-gray-600">익명 질문</span>
              <Badge variant="outline">곧 출시</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 친구 초대 카드 - 4명 이하일 때 표시 */}
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
        onLogin={setUser}
      />
      
      <VoteModal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        question={currentQuestion}
        user={user}
        onVoteComplete={handleVoteComplete}
      />

      {isAdmin && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </div>
  );
};

export default Index;
