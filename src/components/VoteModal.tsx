
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Vote, Users, UserCheck } from "lucide-react";

interface User {
  id: string;
  nickname: string;
  affiliation: string;
}

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  user: User | null;
  onVoteComplete: () => void;
}

const VoteModal = ({ isOpen, onClose, question, user, onVoteComplete }: VoteModalProps) => {
  const [candidates, setCandidates] = useState<User[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      generateCandidates();
    }
  }, [isOpen, user]);

  const generateCandidates = () => {
    // 더미 사용자 데이터 (4명으로 설정)
    const allMembers: User[] = [
      { id: '1', nickname: '코딩왕', affiliation: '우아한테크코스' },
      { id: '2', nickname: '디버거', affiliation: '우아한테크코스' },
      { id: '3', nickname: '알고리즘마스터', affiliation: '우아한테크코스' },
      { id: '4', nickname: '풀스택개발자', affiliation: '우아한테크코스' },
    ];

    // 현재 사용자 제외
    const otherMembers = allMembers.filter(member => member.id !== user?.id);
    
    // 전체 멤버를 선택지로 제공 (4명 이하이므로)
    setCandidates(otherMembers);
  };

  const handleVote = async () => {
    if (!selectedCandidate) {
      toast({
        title: "선택해주세요",
        description: "투표할 대상을 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // 투표 결과 저장
      const voteData = {
        voterId: user!.id,
        candidateId: selectedCandidate.id,
        question: question,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString()
      };

      // 로컬스토리지에 투표 기록 저장
      const votes = JSON.parse(localStorage.getItem('votes') || '[]');
      votes.push(voteData);
      localStorage.setItem('votes', JSON.stringify(votes));

      // 알림 데이터 생성 (선택된 후보자에게 알림)
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const notification = {
        id: Date.now().toString(),
        recipientId: selectedCandidate.id,
        type: 'vote',
        message: `누군가 당신에게 투표했습니다: "${question}"`,
        read: false,
        timestamp: new Date().toISOString()
      };
      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      onVoteComplete();
      onClose();
      
      toast({
        title: "투표 완료!",
        description: `${selectedCandidate.nickname}님에게 익명 투표가 전송되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "투표 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 border-none text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg text-white">
            <Vote className="h-5 w-5 mr-2" />
            오늘의 투표
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Question Card - 이미지 참고하여 디자인 개선 */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center">
              <span className="text-3xl">🤔</span>
            </div>
            <h2 className="text-xl font-bold text-white leading-relaxed">
              {question}
            </h2>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <p className="text-sm text-white/80">
              익명으로 투표합니다. 선택된 분에게만 알림이 전송됩니다.
            </p>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Users className="h-3 w-3 mr-1" />
              {candidates.length}명 중 선택
            </Badge>
          </div>

          {/* Candidates Grid - 이미지 스타일 참고 */}
          <div className="grid grid-cols-2 gap-3">
            {candidates.map((candidate) => (
              <Card 
                key={candidate.id}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                  selectedCandidate?.id === candidate.id 
                    ? 'ring-2 ring-white bg-white/30 scale-105' 
                    : 'bg-white/10 hover:bg-white/20'
                } border-white/20`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <CardContent className="p-4 text-center space-y-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {candidate.nickname.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{candidate.nickname}</p>
                    <p className="text-xs text-white/70">@{candidate.nickname.toLowerCase()}</p>
                  </div>
                  {selectedCandidate?.id === candidate.id && (
                    <UserCheck className="h-5 w-5 text-white mx-auto" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {candidates.length === 0 && (
            <div className="text-center py-8 text-white/70">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>투표할 수 있는 멤버가 없습니다.</p>
            </div>
          )}

          {/* Vote Button */}
          <div className="pt-4">
            <Button 
              onClick={handleVote}
              disabled={!selectedCandidate || loading}
              className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold py-3 rounded-2xl"
              size="lg"
            >
              {loading ? "투표 중..." : "스토어에서 HYPE 검색!"}
            </Button>
            
            {/* 친구 초대 버튼 - 4명 이하일 때 표시 */}
            {candidates.length <= 3 && (
              <Button 
                variant="outline"
                className="w-full mt-3 border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  toast({
                    title: "친구 초대",
                    description: "곧 친구 초대 기능이 추가될 예정입니다!",
                  });
                }}
              >
                친구 초대하기
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoteModal;
