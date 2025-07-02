
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Vote, Heart, MessageCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoginModal from "@/components/LoginModal";
import VoteModal from "@/components/VoteModal";
import AdminModal from "@/components/AdminModal";

const Index = () => {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [todayQuestion, setTodayQuestion] = useState("");
  const [hasVotedToday, setHasVotedToday] = useState(false);
  const [memberCount, setMemberCount] = useState(8);
  const { toast } = useToast();

  useEffect(() => {
    // 로컬스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      checkTodayVote(parsedUser.id);
    }
    
    // 오늘의 질문 가져오기
    fetchTodayQuestion();
    
    // 멤버 수 가져오기
    fetchMemberCount();
  }, []);

  const fetchTodayQuestion = async () => {
    // 실제 API 연동 시 구현
    setTodayQuestion("오늘 가장 함께 점심을 먹고 싶은 사람은?");
  };

  const fetchMemberCount = async () => {
    // 실제 API 연동 시 구현
    setMemberCount(8);
  };

  const checkTodayVote = async (userId) => {
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
    localStorage.setItem(`lastVote_${user.id}`, today);
    toast({
      title: "투표 완료!",
      description: "익명으로 투표가 전송되었습니다.",
    });
  };

  const isAdmin = user?.email === 'admin@woowacourse.io';

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

        {/* Today's Question Card */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-pink-500 to-red-500 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Vote className="h-5 w-5 mr-2" />
              오늘의 질문
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/90 font-medium">
              {todayQuestion}
            </p>
            {hasVotedToday ? (
              <div className="flex items-center space-x-2 bg-white/20 rounded-lg p-3">
                <Heart className="h-4 w-4 text-pink-200" />
                <span className="text-sm text-white/80">오늘 투표를 완료했습니다</span>
              </div>
            ) : (
              <Button
                onClick={handleVote}
                className="w-full bg-white text-pink-600 hover:bg-gray-50"
                size="lg"
              >
                <Vote className="h-4 w-4 mr-2" />
                투표하기
              </Button>
            )}
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
        question={todayQuestion}
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
