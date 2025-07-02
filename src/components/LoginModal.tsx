import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building, CheckCircle } from "lucide-react";
import { signIn, signUp, getProfile } from '@/lib/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    affiliation: '우아한테크코스'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login for:', formData.email);
      const result = await signIn(formData.email, formData.password);
      
      // 프로필 확인
      const profile = result.profile || await getProfile();
      
      if (profile) {
        console.log('Login successful, profile found:', profile.nickname);
        onLogin(profile);
        onClose();
        resetForm();
        toast({
          title: "로그인 성공!",
          description: `안녕하세요, ${profile.nickname}님!`,
        });
      } else {
        throw new Error('프로필을 찾을 수 없습니다.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "로그인에 실패했습니다.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "이메일 확인이 필요합니다.";
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      }
      
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 입력 검증
      if (!formData.email || !formData.password || !formData.nickname) {
        toast({
          title: "입력 오류",
          description: "모든 필드를 입력해주세요.",
          variant: "destructive"
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "비밀번호 오류",
          description: "비밀번호는 최소 6자 이상이어야 합니다.",
          variant: "destructive"
        });
        return;
      }

      console.log('Starting signup for:', formData.email);
      const result = await signUp(formData.email, formData.password, formData.nickname);
      
      if (result.profile) {
        console.log('Signup completed successfully:', result.profile.nickname);
        onLogin(result.profile);
        onClose();
        resetForm();
        toast({
          title: "회원가입 성공!",
          description: `환영합니다, ${result.profile.nickname}님!`,
        });
      } else {
        throw new Error('프로필 생성에 실패했습니다.');
      }
      
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      
      if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        errorMessage = "이미 등록된 이메일입니다. 로그인을 시도해보세요.";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      } else if (error.message?.includes('weak password')) {
        errorMessage = "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.";
      } else if (error.message?.includes('다시 로그인해주세요')) {
        errorMessage = error.message;
        // 회원가입은 성공했지만 로그인 실패한 경우 로그인 탭으로 전환
        setIsSignUp(false);
        setFormData({ ...formData, password: '' });
      }
      
      toast({
        title: "회원가입 실패",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nickname: '',
      affiliation: '우아한테크코스'
    });
  };

  const handleModalClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            with에 오신 것을 환영합니다
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={isSignUp ? 'signup' : 'login'} onValueChange={(value) => {
          setIsSignUp(value === 'signup');
          resetForm();
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">로그인</TabsTrigger>
            <TabsTrigger value="signup">회원가입</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
            
            <div className="text-center text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium">관리자 계정:</p>
              <p>이메일: admin@woowacourse.io</p>
              <p>비밀번호: admin123!</p>
            </div>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요 (최소 6자)"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="nickname"
                    name="nickname"
                    type="text"
                    placeholder="닉네임을 입력하세요"
                    value={formData.nickname}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="affiliation">소속</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="affiliation"
                    name="affiliation"
                    type="text"
                    value={formData.affiliation}
                    className="pl-10 bg-gray-50"
                    disabled
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "가입 중..." : "회원가입"}
              </Button>
            </form>
            
            <div className="text-center text-xs text-gray-500 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
              이메일 확인 없이 즉시 가입됩니다
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;