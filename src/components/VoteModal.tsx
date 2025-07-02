
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Vote, Users, UserCheck } from "lucide-react";

const VoteModal = ({ isOpen, onClose, question, user, onVoteComplete }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      generateCandidates();
    }
  }, [isOpen, user]);

  const generateCandidates = () => {
    // 더미 사용자 데이터 (실제로는 API에서 가져옴)
    const allMembers = [
      { id: '1', nickname: '코딩왕', affiliation: '우아한테크코스' },
      { id: '2', nickname: '디버거', affiliation: '우아한테크코스' },
      { id: '3', nickname: '알고리즘마스터', affiliation: '우아한테크코스' },
      { id: '4', nickname: '풀스택개발자', affiliation: '우아한테크코스' },
      { id: '5', nickname: '데이터베이스전문가', affiliation: '우아한테크코스' },
      { id: '6', nickname: '프론트엔드구루', affiliation: '우아한테크코스' },
      { id: '7', nickname: '백엔드마스터', affiliation: '우아한테크코스' },
      { id: '8', nickname: 'UX디자이너', affiliation: '우아한테크코스' },
    ];

    // 현재 사용자 제외
    const otherMembers = allMembers.filter(member => member.id !== user?.id);
    
    // 랜덤하게 6명 선택
    const shuffled = otherMembers.sort(() => 0.5 - Math.random());
    const selectedCandidates = shuffled.slice(0, Math.min(6, otherMembers.length));
    
    setCandidates(selectedCandidates);
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
      // 투표 결과 저장 (실제로는 API 호출)
      const voteData = {
        voterId: user.id,
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
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Vote className="h-5 w-5 mr-2 text-pink-500" />
            오늘의 투표
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Question */}
          <Card className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
            <CardContent className="p-4">
              <p className="font-medium text-center">{question}</p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-600">
              익명으로 투표합니다. 선택된 분에게만 알림이 전송됩니다.
            </p>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Users className="h-3 w-3 mr-1" />
              {candidates.length}명 중 선택
            </Badge>
          </div>

          {/* Candidates */}
          <div className="grid gap-3">
            {candidates.map((candidate) => (
              <Card 
                key={candidate.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedCandidate?.id === candidate.id 
                    ? 'ring-2 ring-pink-500 bg-pink-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {candidate.nickname.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{candidate.nickname}</p>
                      <p className="text-xs text-gray-500">{candidate.affiliation}</p>
                    </div>
                  </div>
                  {selectedCandidate?.id === candidate.id && (
                    <UserCheck className="h-5 w-5 text-pink-500" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {candidates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>투표할 수 있는 멤버가 없습니다.</p>
            </div>
          )}

          {/* Vote Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleVote}
              disabled={!selectedCandidate || loading}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              size="lg"
            >
              {loading ? "투표 중..." : "익명 투표하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoteModal;
