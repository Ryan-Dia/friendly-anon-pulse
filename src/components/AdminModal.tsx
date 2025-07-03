import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Vote, Edit, UserX, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { 
  getQuestions, 
  updateQuestion, 
  setActiveQuestion, 
  createQuestion, 
  deleteQuestion,
  getAllProfiles,
  getTodayVotes 
} from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  nickname: string;
  affiliation: string;
  createdAt: string;
}

interface Question {
  id: string;
  content: string;
  is_active: boolean;
  order_index: number;
}

const AdminModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<{ id: string; content: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 질문 데이터 로드
      const questionsData = await getQuestions();
      setQuestions(questionsData.sort((a, b) => a.order_index - b.order_index));
      
      // 사용자 데이터 로드
      const usersData = await getAllProfiles();
      setUsers(usersData);
      
      // 투표 데이터 로드
      const votesData = await getTodayVotes();
      setVotes(votesData);
      
    } catch (error) {
      console.error('Admin data load error:', error);
      toast({
        title: "데이터 로딩 오류",
        description: "관리자 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.trim()) {
      toast({
        title: "입력 오류",
        description: "질문 내용을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      const maxOrderIndex = Math.max(...questions.map(q => q.order_index), -1);
      await createQuestion({
        content: newQuestion.trim(),
        order_index: maxOrderIndex + 1
      });
      
      setNewQuestion("");
      await loadData();
      
      toast({
        title: "질문 생성 완료",
        description: "새로운 질문이 추가되었습니다.",
      });
    } catch (error) {
      console.error('Question creation error:', error);
      toast({
        title: "질문 생성 실패",
        description: "질문을 생성하는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion || !editingQuestion.content.trim()) {
      toast({
        title: "입력 오류",
        description: "질문 내용을 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateQuestion(editingQuestion.id, editingQuestion.content.trim());
      setEditingQuestion(null);
      await loadData();
      
      toast({
        title: "질문 수정 완료",
        description: "질문이 수정되었습니다.",
      });
    } catch (error) {
      console.error('Question update error:', error);
      toast({
        title: "질문 수정 실패",
        description: "질문을 수정하는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('정말로 이 질문을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteQuestion(questionId);
      await loadData();
      
      toast({
        title: "질문 삭제 완료",
        description: "질문이 삭제되었습니다.",
      });
    } catch (error) {
      console.error('Question deletion error:', error);
      toast({
        title: "질문 삭제 실패",
        description: "질문을 삭제하는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleSetActiveQuestion = async (questionId: string) => {
    try {
      await setActiveQuestion(questionId);
      await loadData();
      
      toast({
        title: "활성 질문 변경",
        description: "활성 질문이 변경되었습니다.",
      });
    } catch (error) {
      console.error('Active question set error:', error);
      toast({
        title: "활성 질문 변경 실패",
        description: "활성 질문을 변경하는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    try {
      const currentQuestion = questions[currentIndex];
      const targetQuestion = questions[targetIndex];
      
      // 순서 교체
      await updateQuestion(currentQuestion.id, currentQuestion.content, targetQuestion.order_index);
      await updateQuestion(targetQuestion.id, targetQuestion.content, currentQuestion.order_index);
      
      await loadData();
      
      toast({
        title: "질문 순서 변경",
        description: "질문 순서가 변경되었습니다.",
      });
    } catch (error) {
      console.error('Question move error:', error);
      toast({
        title: "순서 변경 실패",
        description: "질문 순서를 변경하는데 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const getVoteStats = () => {
    const voteCount: Record<string, number> = {};
    
    votes.forEach(vote => {
      const candidateName = vote.candidate?.nickname || '알 수 없음';
      voteCount[candidateName] = (voteCount[candidateName] || 0) + 1;
    });
    
    return Object.entries(voteCount).sort(([,a], [,b]) => b - a);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>데이터를 불러오는 중...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Settings className="h-5 w-5 mr-2 text-blue-500" />
            관리자 대시보드
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="questions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">질문 관리</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="stats">투표 통계</TabsTrigger>
          </TabsList>
          
          <TabsContent value="questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Vote className="h-5 w-5 mr-2" />
                    질문 목록
                  </div>
                  <Badge>{questions.length}개</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 새 질문 추가 */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <Label htmlFor="new-question">새 질문 추가</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="new-question"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="새로운 질문을 입력하세요"
                      className="flex-1"
                    />
                    <Button onClick={handleCreateQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  </div>
                </div>

                {/* 질문 목록 */}
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div key={question.id} className={`p-4 rounded-lg border ${
                      question.is_active 
                        ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white border-pink-300' 
                        : 'bg-white border-gray-200'
                    }`}>
                      {editingQuestion?.id === question.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editingQuestion.content}
                            onChange={(e) => setEditingQuestion({
                              ...editingQuestion,
                              content: e.target.value
                            })}
                            className="bg-white text-gray-900"
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={handleUpdateQuestion}>
                              저장
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingQuestion(null)}
                              className="bg-white text-gray-900"
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className={question.is_active ? "bg-white/20 text-white border-white/30" : ""}>
                                #{index + 1}
                              </Badge>
                              {question.is_active && (
                                <Badge className="bg-green-500/80 text-white">현재 활성</Badge>
                              )}
                            </div>
                            <p className={`font-medium ${question.is_active ? 'text-white' : 'text-gray-900'}`}>
                              {question.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {/* 순서 변경 버튼 */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveQuestion(question.id, 'up')}
                              disabled={index === 0}
                              className={question.is_active ? "text-white hover:bg-white/20" : ""}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => moveQuestion(question.id, 'down')}
                              disabled={index === questions.length - 1}
                              className={question.is_active ? "text-white hover:bg-white/20" : ""}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            
                            {/* 활성화 버튼 */}
                            {!question.is_active && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetActiveQuestion(question.id)}
                              >
                                활성화
                              </Button>
                            )}
                            
                            {/* 수정 버튼 */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingQuestion({
                                id: question.id,
                                content: question.content
                              })}
                              className={question.is_active ? "text-white hover:bg-white/20" : ""}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* 삭제 버튼 */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className={question.is_active ? "text-white hover:bg-white/20" : "text-red-600 hover:bg-red-50"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {questions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Vote className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>등록된 질문이 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
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
                      <Badge>{votes.length}표</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>참여율</span>
                      <Badge variant="secondary">
                        {users.length > 0 ? Math.round((votes.length / users.length) * 100) : 0}%
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