
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Vote, Trash2, Edit, Plus, UserX } from "lucide-react";

const AdminModal = ({ isOpen, onClose }) => {
  const [todayQuestion, setTodayQuestion] = useState("오늘 가장 함께 점심을 먹고 싶은 사람은?");
  const [newQuestion, setNewQuestion] = useState("");
  const [users, setUsers] = useState([]);
  const [votes, setVotes] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    // 사용자 데이터 로드
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // 더미 사용자들 추가 (처음에만)
    if (savedUsers.length === 0) {
      const dummyUsers = [
        { id: '1', email: 'user1@woowacourse.io', nickname: '코딩왕', affiliation: '우아한테크코스', createdAt: new Date().toISOString() },
        { id: '2', email: 'user2@woowacourse.io', nickname: '디버거', affiliation: '우아한테크코스', createdAt: new Date().toISOString() },
        { id: '3', email: 'user3@woowacourse.io', nickname: '알고리즘마스터', affiliation: '우아한테크코스', createdAt: new Date().toISOString() },
        { id: '4', email: 'user4@woowacourse.io', nickname: '풀스택개발자', affiliation: '우아한테크코스', createdAt: new Date().toISOString() },
        { id: '5', email: 'user5@woowacourse.io', nickname: '데이터베이스전문가', affiliation: '우아한테크코스', createdAt: new Date().toISOString() },
        { id: '6', email: 'user6@woowacourse.io', nickname: '프론트엔드구루', affiliation: '우아한테크코스', createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('users', JSON.stringify(dummyUsers));
      setUsers(dummyUsers);
    } else {
      setUsers(savedUsers);
    }

    // 투표 데이터 로드
    const savedVotes = JSON.parse(localStorage.getItem('votes') || '[]');
    setVotes(savedVotes);
  };

  const handleUpdateQuestion = () => {
    if (!newQuestion.trim()) {
      toast({
        title: "입력 오류",
        description: "새로운 질문을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setTodayQuestion(newQuestion);
    localStorage.setItem('todayQuestion', newQuestion);
    setNewQuestion("");
    
    toast({
      title: "질문 업데이트 완료",
      description: "오늘의 질문이 변경되었습니다.",
    });
  };

  const handleDeleteUser = (userId) => {
    const updatedUsers = users.filter(user => user.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    toast({
      title: "사용자 삭제 완료",
      description: "사용자가 삭제되었습니다.",
    });
  };

  const getTodayVotes = () => {
    const today = new Date().toDateString();
    return votes.filter(vote => new Date(vote.timestamp).toDateString() === today);
  };

  const getVoteStats = () => {
    const todayVotes = getTodayVotes();
    const voteCount = {};
    
    todayVotes.forEach(vote => {
      const candidate = users.find(u => u.id === vote.candidateId);
      if (candidate) {
        voteCount[candidate.nickname] = (voteCount[candidate.nickname] || 0) + 1;
      }
    });
    
    return Object.entries(voteCount).sort(([,a], [,b]) => b - a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Settings className="h-5 w-5 mr-2 text-blue-500" />
            관리자 대시보드
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="question" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="question">오늘의 질문</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="stats">투표 통계</TabsTrigger>
          </TabsList>
          
          {/* 오늘의 질문 관리 */}
          <TabsContent value="question" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Vote className="h-5 w-5 mr-2" />
                  현재 질문
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg">
                  <p className="font-medium">{todayQuestion}</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="new-question">새로운 질문</Label>
                  <Input
                    id="new-question"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="새로운 질문을 입력하세요"
                  />
                  <Button onClick={handleUpdateQuestion} className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    질문 업데이트
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 사용자 관리 */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    사용자 목록
                  </div>
                  <Badge>{users.length}명</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <Card key={user.id} className="bg-gray-50">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.nickname.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.nickname}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.affiliation}</p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {users.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>등록된 사용자가 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 투표 통계 */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>오늘의 투표 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>총 투표 수</span>
                      <Badge>{getTodayVotes().length}표</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>참여율</span>
                      <Badge variant="secondary">
                        {users.length > 0 ? Math.round((getTodayVotes().length / users.length) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>투표 순위</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getVoteStats().length > 0 ? (
                      getVoteStats().map(([nickname, count], index) => (
                        <div key={nickname} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              {index + 1}위
                            </Badge>
                            <span className="font-medium">{nickname}</span>
                          </div>
                          <Badge>{count}표</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Vote className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>아직 투표가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminModal;
