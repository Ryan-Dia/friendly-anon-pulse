
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Plus, Lightbulb, Settings, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  nickname: string;
  affiliation: string;
}

interface Post {
  id: string;
  type: 'question' | 'improvement';
  content: string;
  author: string;
  timestamp: string;
}

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const BoardModal = ({ isOpen, onClose, user }: BoardModalProps) => {
  const [activeTab, setActiveTab] = useState<'question' | 'improvement'>('question');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPosts();
    }
  }, [isOpen]);

  const loadPosts = () => {
    const savedPosts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    setPosts(savedPosts.sort((a: Post, b: Post) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const handleSubmitPost = () => {
    if (!user || !newPostContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      type: activeTab,
      content: newPostContent.trim(),
      author: user.nickname,
      timestamp: new Date().toISOString()
    };

    const savedPosts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    const updatedPosts = [newPost, ...savedPosts];
    localStorage.setItem('boardPosts', JSON.stringify(updatedPosts));
    
    setPosts(updatedPosts);
    setNewPostContent('');
    setIsWriting(false);
    
    toast({
      title: "게시글 작성 완료!",
      description: activeTab === 'question' ? "새로운 질문 아이디어가 등록되었습니다." : "개선사항이 등록되었습니다.",
    });
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

  const filteredPosts = posts.filter(post => post.type === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <MessageSquare className="h-5 w-5 mr-2" />
            게시판
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex space-x-2">
            <Button
              variant={activeTab === 'question' ? 'default' : 'outline'}
              onClick={() => setActiveTab('question')}
              className="flex items-center space-x-2"
            >
              <Lightbulb className="h-4 w-4" />
              <span>질문 아이디어</span>
            </Button>
            <Button
              variant={activeTab === 'improvement' ? 'default' : 'outline'}
              onClick={() => setActiveTab('improvement')}
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>개선사항</span>
            </Button>
          </div>

          {/* Write Post */}
          {user && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {activeTab === 'question' ? '새로운 질문 제안하기' : '개선사항 제안하기'}
                  </CardTitle>
                  {!isWriting && (
                    <Button size="sm" onClick={() => setIsWriting(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      글쓰기
                    </Button>
                  )}
                </div>
              </CardHeader>
              {isWriting && (
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder={activeTab === 'question' 
                      ? "어떤 질문이 있으면 재미있을까요? 예: '가장 함께 커피를 마시고 싶은 사람은?'" 
                      : "어떤 부분을 개선하면 좋을까요?"}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex space-x-2">
                    <Button onClick={handleSubmitPost} disabled={!newPostContent.trim()}>
                      등록하기
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsWriting(false);
                      setNewPostContent('');
                    }}>
                      취소
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Posts List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{activeTab === 'question' ? '질문 아이디어' : '개선사항'}</span>
                <Badge variant="outline">{filteredPosts.length}개</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredPosts.length > 0 ? (
                <div className="space-y-3">
                  {filteredPosts.map((post, index) => (
                    <div key={post.id}>
                      <div className="p-4 rounded-lg bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{post.author}</span>
                            <Badge variant="secondary" className="text-xs">
                              {post.type === 'question' ? '질문' : '개선'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(post.timestamp)}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                      </div>
                      {index < filteredPosts.length - 1 && (
                        <Separator className="my-3" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {activeTab === 'question' ? (
                    <>
                      <Lightbulb className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">아직 제안된 질문이 없습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        재미있는 질문 아이디어를 제안해주세요!
                      </p>
                    </>
                  ) : (
                    <>
                      <Settings className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">아직 개선사항이 없습니다.</p>
                      <p className="text-xs text-gray-400 mt-1">
                        더 좋은 서비스를 위한 아이디어를 알려주세요!
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BoardModal;
