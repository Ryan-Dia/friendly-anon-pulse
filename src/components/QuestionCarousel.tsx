import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { getQuestions } from '@/lib/supabase';

interface Question {
  id: string;
  content: string;
  is_active: boolean;
  order_index: number;
}

interface QuestionCarouselProps {
  hasVoted: boolean;
  onVote: () => void;
  questionLoading: boolean;
  onRefreshQuestion: () => void;
}

const QuestionCarousel = ({ hasVoted, onVote, questionLoading, onRefreshQuestion }: QuestionCarouselProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await getQuestions();
      const sortedQuestions = questionsData.sort((a, b) => a.order_index - b.order_index);
      setQuestions(sortedQuestions);
      
      // 활성 질문이 있으면 해당 인덱스로 이동
      const activeIndex = sortedQuestions.findIndex(q => q.is_active);
      if (activeIndex !== -1) {
        setCurrentIndex(activeIndex);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const prevQuestion = () => {
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };

  const currentQuestion = questions[currentIndex];

  if (loading || questionLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">🤔</span>
          </div>
          <p className="text-white/80 text-lg">질문을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white relative overflow-hidden">
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center">
            <span className="text-2xl">❓</span>
          </div>
          <p className="text-white/80 text-lg">질문을 불러올 수 없습니다</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshQuestion}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
        {/* 질문 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevQuestion}
            className="text-white hover:bg-white/20 p-2"
            disabled={questions.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex space-x-1">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextQuestion}
            className="text-white hover:bg-white/20 p-2"
            disabled={questions.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-white/20 rounded-full mx-auto flex items-center justify-center">
            <span className="text-2xl">🤔</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-white font-medium text-lg leading-relaxed min-h-[3rem] flex items-center justify-center">
              {currentQuestion.content}
            </p>
            
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                {currentIndex + 1} / {questions.length}
              </Badge>
              {currentQuestion.is_active && (
                <Badge className="bg-green-500/80 text-white text-xs">
                  활성
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {hasVoted ? (
          <div className="flex items-center justify-center space-x-2 bg-white/20 rounded-2xl p-4">
            <Heart className="h-4 w-4 text-pink-200" />
            <span className="text-sm text-white/90">오늘 투표를 완료했습니다</span>
          </div>
        ) : (
          <Button
            onClick={onVote}
            className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold py-3 rounded-2xl"
            size="lg"
            disabled={!currentQuestion}
          >
            <Vote className="h-4 w-4 mr-2" />
            투표하기
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCarousel;