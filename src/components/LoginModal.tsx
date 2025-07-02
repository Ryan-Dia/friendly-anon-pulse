import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, Building, CheckCircle } from "lucide-react";
import { signIn, signUp, getProfile, handleEmailConfirmation } from '@/lib/supabase';

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
  const [emailSent, setEmailSent] = useState(false);
  const [checkingConfirmation, setCheckingConfirmation] = useState(false);
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
      await signIn(formData.email, formData.password);
      const profile = await getProfile();
      
      if (profile) {
        onLogin(profile);
        onClose();
        resetForm();
        toast({
          title: "로그인 성공!",
          description: `안녕하세요, ${profile.nickname}님!`,
        });
      } else {
        toast({
          title: "프로필 로딩 실패",
          description: "프로필을 불러올 수 없습니다. 다시 시도해주세요.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "로그인 실패",
        description: error.message || "이메일 또는 비밀번호가 올바르지 않습니다.",
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

      const result = await signUp(formData.email, formData.password, formData.nickname);
      
      // 이메일 확인이 필요한 경우
      if (result.user && !result.user.email_confirmed_at) {
        setEmailSent(true);
        toast({
          title: "회원가입 완료!",
          description: "이메일을 확인하여 계정을 활성화해주세요.",
        });
      } else {
        // 이메일 확인이 비활성화되어 있거나 이미 확인된 경우
        toast({
          title: "회원가입 성공!",
          description: "로그인 탭에서 로그인해주세요.",
        });
        setIsSignUp(false);
        resetForm();
      }
      
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = "회원가입 중 오류가 발생했습니다.";
      
      if (error.message?.includes('already registered')) {
        errorMessage = "이미 등록된 이메일입니다.";
      } else if (error.message?.includes('invalid email')) {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      } else if (error.message?.includes('weak password')) {
        errorMessage = "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.";
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

  const handleCheckEmailConfirmation = async () => {
    setCheckingConfirmation(true);
    
    try {
      const profile = await handleEmailConfirmation();
      
      if (profile) {
        onLogin(profile);
        onClose();
        resetForm();
        setEmailSent(false);
        toast({
          title: "이메일 확인 완료!",
          description: `환영합니다, ${profile.nickname}님!`,
        });
      } else {
        toast({
          title: "이메일 확인 대기중",
          description: "아직 이메일 확인이 완료되지 않았습니다. 이메일을 확인해주세요.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Email confirmation check error:', error);
      toast({
        title: "확인 실패",
        description: "이메일 확인 상태를 확인할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setCheckingConfirmation(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      nickname: '',
      affiliation: '우아한테크코스'
    });
    setEmailSent(false);
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
        
        {emailSent ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">이메일을 확인해주세요</h3>
              <p className="text-sm text-gray-600">
                {formData.email}로 확인 이메일을 보냈습니다.
              </p>
              <p className="text-xs text-gray-500">
                이메일의 확인 링크를 클릭한 후 아래 버튼을 눌러주세요.
              </p>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={handleCheckEmailConfirmation}
                disabled={checkingConfirmation}
                className="w-full"
              >
                {checkingConfirmation ? (
                  "확인 중..."
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    이메일 확인 완료
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEmailSent(false)}
                className="w-full"
              >
                다시 시도
              </Button>
            </div>
          </div>
        ) : (
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
              
              <div className="text-center text-sm text-gray-500">
                <p>관리자 계정:</p>
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
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;