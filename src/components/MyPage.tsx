import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Heart, Vote, Calendar, Bell } from "lucide-react";
import { getNotifications, markAllNotificationsAsRead } from '@/lib/supabase';

interface User {
  id: string;
  nickname: string;
  affiliation: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

interface MyPageProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const MyPage = ({ isOpen, onClose, user }: MyPageProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading notifications for user:', user.nickname);
      
      const notificationsData = await getNotifications();
      console.log('Notifications loaded:', notificationsData.length);
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead();
      
      // 상태 업데이트
      setNotifications(prev => prev.map(notification => ({ 
        ...notification, 
        is_read: true 
      })));
      
      console.log('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
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

  const getVoteNotifications = () => {
    return notifications.filter(notification => notification.type === 'vote');
  };

  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.is_read).length;
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

          {/* Notifications Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-pink-500" />
                  받은 투표
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {getUnreadCount() > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {getUnreadCount()}개 신규
                    </Badge>
                  )}
                  {getUnreadCount() > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      모두 읽음
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">알림을 불러오는 중...</p>
                </div>
              ) : getVoteNotifications().length > 0 ? (
                <div className="space-y-3">
                  {getVoteNotifications().map((notification, index) => (
                    <div key={notification.id}>
                      <div className={`p-3 rounded-lg border ${
                        notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Vote className="h-4 w-4 text-blue-500" />
                              {!notification.is_read && (
                                <Bell className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              누군가 당신을 선택했습니다! 💝
                            </p>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < getVoteNotifications().length - 1 && (
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
                  {getVoteNotifications().length}개
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">읽지 않은 알림</span>
                <Badge variant="outline">{getUnreadCount()}개</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyPage;