
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Heart, Vote, Calendar, Bell } from "lucide-react";

interface User {
  id: string;
  nickname: string;
  affiliation: string;
}

interface VoteReceived {
  id: string;
  question: string;
  timestamp: string;
  date: string;
  read: boolean;
}

interface MyPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const MyPage = ({ isOpen, onClose, user }: MyPageProps) => {
  const [votesReceived, setVotesReceived] = useState<VoteReceived[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && user) {
      loadVotesReceived();
    }
  }, [isOpen, user]);

  const loadVotesReceived = () => {
    if (!user) return;

    // 내가 받은 투표들 불러오기
    const allVotes = JSON.parse(localStorage.getItem('votes') || '[]');
    const myVotes = allVotes.filter((vote: any) => vote.candidateId === user.id);
    
    // 투표 기록을 날짜별로 그룹화하고 정리
    const votesMap = new Map();
    
    myVotes.forEach((vote: any) => {
      const key = `${vote.question}-${vote.date}`;
      if (!votesMap.has(key)) {
        votesMap.set(key, {
          id: vote.timestamp,
          question: vote.question,
          timestamp: vote.timestamp,
          date: vote.date,
          count: 1,
          read: vote.read || false
        });
      } else {
        const existing = votesMap.get(key);
        existing.count += 1;
      }
    });

    const votes = Array.from(votesMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setVotesReceived(votes);
    
    // 읽지 않은 투표 수 계산
    const unread = votes.filter(vote => !vote.read).length;
    setUnreadCount(unread);
  };

  const markAllAsRead = () => {
    if (!user) return;

    // 모든 투표를 읽음으로 표시
    const allVotes = JSON.parse(localStorage.getItem('votes') || '[]');
    const updatedVotes = allVotes.map((vote: any) => {
      if (vote.candidateId === user.id) {
        return { ...vote, read: true };
      }
      return vote;
    });
    
    localStorage.setItem('votes', JSON.stringify(updatedVotes));
    
    // 상태 업데이트
    setVotesReceived(prev => prev.map(vote => ({ ...vote, read: true })));
    setUnreadCount(0);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "방금 전";
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <User className="h-5 w-5 mr-2" />
            마이페이지
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">프로필</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user.nickname.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.nickname}</p>
                  <p className="text-sm text-gray-600">{user.affiliation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Votes Received Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-pink-500" />
                  받은 투표
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadCount}개 신규
                    </Badge>
                  )}
                  {unreadCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      모두 읽음
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {votesReceived.length > 0 ? (
                <div className="space-y-3">
                  {votesReceived.map((vote, index) => (
                    <div key={vote.id}>
                      <div className={`p-3 rounded-lg border ${
                        vote.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Vote className="h-4 w-4 text-blue-500" />
                              {!vote.read && (
                                <Bell className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              "{vote.question}"
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              누군가 당신을 선택했습니다! 💝
                            </p>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatDate(vote.timestamp)}
                              </span>
                              {vote.count > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  {vote.count}명이 선택
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < votesReceived.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">아직 받은 투표가 없습니다.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    친구들이 당신을 선택하면 여기에 표시됩니다!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">통계</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">총 받은 투표</span>
                <Badge variant="outline">
                  {votesReceived.reduce((sum, vote) => sum + (vote.count || 1), 0)}개
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">참여한 질문</span>
                <Badge variant="outline">{votesReceived.length}개</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyPage;
