
"use client";

import type { ChatRoom, ParticipantStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';

interface ChatListProps {
  chatRooms: ChatRoom[];
  selectedChatRoomId?: string;
  participantStatuses: Record<string, ParticipantStatus>;
}

export default function ChatList({ chatRooms, selectedChatRoomId, participantStatuses }: ChatListProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className="flex flex-col">
      {chatRooms.length === 0 && (
        <p className="p-4 text-center text-sm text-muted-foreground">
          No conversations yet. Message a trainer from a plan details page to start.
        </p>
      )}
      {chatRooms.map(room => {
        const otherParticipantId = room.participantIds.find(id => id !== user.id);
        if (!otherParticipantId) return null;

        const otherParticipant = room.participants[otherParticipantId];
        const initial = otherParticipant.name.charAt(0).toUpperCase();

        const timeAgo = room.lastMessageTimestamp
          ? formatDistanceToNowStrict(new Date(room.lastMessageTimestamp), { addSuffix: true })
          : '';
        
        const isDeletedForUser = room.deletedBy?.[user.id];
        const lastMessageText = isDeletedForUser ? '' : (room.lastMessage || 'No messages yet...');
        const isUnread = !isDeletedForUser && !!room.lastMessage && !room.readBy?.includes(user.id);

        return (
          <Link
            key={room.id}
            href={`/chat?chatRoomId=${room.id}`}
            className={cn(
              "flex items-center gap-3 p-3 border-b hover:bg-muted/50 transition-colors relative",
              room.id === selectedChatRoomId && "bg-muted"
            )}
          >
             {isUnread && (
              <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
            )}
            <Avatar className="h-12 w-12 relative">
              <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden pl-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold truncate">{otherParticipant.name}</h3>
                <time className="text-xs text-muted-foreground flex-shrink-0 ml-2">{timeAgo}</time>
              </div>
              <p className={cn(
                "text-sm text-muted-foreground truncate",
                isUnread && "font-bold text-foreground"
              )}>
                {lastMessageText}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
