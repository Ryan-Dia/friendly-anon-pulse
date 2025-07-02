
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, User } from "lucide-react";

interface User {
  id: string;
  email: string;
  nickname: string;
  affiliation: string;
}

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ParticipantsModal = ({ isOpen, onClose }: ParticipantsModalProps) => {
  const [participants, setParticipants] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadParticipants();
    }
  }, [isOpen]);

  const loadParticipants = () => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const woowacourseMembers = savedUsers.filter((user: User) => user.affiliation === '우아한테크코스');
    setParticipants(woowacourseMembers);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Users className="h-5 w-5 mr-2" />
            참여자 목록
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>우아한테크코스 크루</span>
              <Badge>{participants.length}명</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {participants.length > 0 ? (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {participant.nickname.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{participant.nickname}</p>
                      <p className="text-sm text-gray-600">{participant.affiliation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">아직 참여자가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsModal;
