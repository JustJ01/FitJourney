
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatRoom, ChatMessage, ParticipantStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { sendMessage, markMessagesAsRead, deleteChatForUser } from '@/lib/data';
import MessageBubble from './MessageBubble';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { SendHorizonal, MoreVertical, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  chatRoom: ChatRoom;
  participantStatus?: ParticipantStatus;
}

export default function ChatWindow({ chatRoom, participantStatus }: ChatWindowProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipantId = chatRoom.participantIds.find(id => id !== user?.id);
  const otherParticipant = otherParticipantId ? chatRoom.participants[otherParticipantId] : null;

  const statusText = useMemo(() => {
    if (participantStatus?.lastSeen) {
        return `last seen ${formatDistanceToNow(new Date(participantStatus.lastSeen), { addSuffix: true })}`;
    }
    return null;
  }, [participantStatus]);


  useEffect(() => {
    if (!chatRoom.id || !user?.id) return;
    
    markMessagesAsRead(chatRoom.id, user.id);

    const messagesRef = collection(db, 'chatRooms', chatRoom.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          readBy: data.readBy || [],
        } as ChatMessage);
      });
      setAllMessages(fetchedMessages);
      markMessagesAsRead(chatRoom.id, user.id);
    });

    return () => unsubscribe();
  }, [chatRoom.id, user?.id]);

  const messages = useMemo(() => {
    if (!user) return [];
    const userDeletedAt = chatRoom.deletedBy?.[user.id];
    if (!userDeletedAt) {
        return allMessages;
    }
    return allMessages.filter(msg => new Date(msg.timestamp) > new Date(userDeletedAt));
  }, [allMessages, chatRoom.deletedBy, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage(chatRoom.id, user.id, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleDeleteChat = async () => {
    if (!user) return;
    try {
      await deleteChatForUser(chatRoom.id, user.id);
      toast({ title: "Chat Deleted", description: "The conversation has been removed from your list." });
      router.push('/chat');
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast({ title: "Error", description: "Could not delete the chat.", variant: "destructive" });
    }
  };
  
  if (!otherParticipant) {
      return <div>Error: Could not load participant information.</div>
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-3 p-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Avatar>
              <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
              <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{otherParticipant.name}</h2>
            {statusText && <p className="text-xs text-muted-foreground">{statusText}</p>}
          </div>
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Chat options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Chat</span>
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will hide the chat from your list and clear your view of the history. The other person will still see the full conversation. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteChat} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isSender={msg.senderId === user?.id} otherParticipantId={otherParticipantId} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <footer className="p-3 border-t bg-card">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <SendHorizonal className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
