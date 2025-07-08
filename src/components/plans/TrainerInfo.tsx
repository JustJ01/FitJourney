
"use client";

import type { Trainer } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, UserCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createOrGetChatRoom } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useState } from 'react';

interface TrainerInfoProps {
  trainer: Trainer | null;
}

const TrainerInfo: React.FC<TrainerInfoProps> = ({ trainer }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  
  const handleMessageTrainer = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "You must be logged in to message a trainer." });
      router.push('/login');
      return;
    }
    if (!trainer || user.id === trainer.id) return;

    setIsCreatingChat(true);
    try {
      const chatRoom = await createOrGetChatRoom(user.id, trainer.id);
      router.push(`/chat?chatRoomId=${chatRoom.id}`);
    } catch (error) {
      console.error("Failed to create or get chat room:", error);
      toast({ title: "Error", description: "Could not start a conversation. Please try again.", variant: "destructive" });
    } finally {
      setIsCreatingChat(false);
    }
  };

  if (!trainer) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Trainer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Trainer details are not available for this plan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Meet Your Trainer
          </span>
           {user && user.role === 'member' && user.id !== trainer.id && (
             <Button
                size="sm"
                variant="outline"
                onClick={handleMessageTrainer}
                disabled={isCreatingChat}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {isCreatingChat ? "Starting..." : "Message"}
              </Button>
            )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            {trainer.avatarUrl && <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />}
            <AvatarFallback className="text-3xl bg-primary/20">{trainer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold text-foreground">{trainer.name}</h3>
            <p className="text-sm text-muted-foreground">{trainer.role === 'trainer' ? 'Certified Trainer' : 'Fitness Enthusiast'}</p>
          </div>
        </div>
        {trainer.bio && <p className="text-foreground/80 text-sm">{trainer.bio}</p>}
        {trainer.specializations && trainer.specializations.length > 0 && (
          <div>
            <h4 className="font-semibold text-md mb-1 text-foreground">Specializations:</h4>
            <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1">
              {trainer.specializations.map((spec, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent"/> {spec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainerInfo;
