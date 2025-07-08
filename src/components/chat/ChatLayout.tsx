

"use client";

import { useState, useEffect } from 'react';
import type { ChatRoom, ParticipantStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ChatEmptyState from './ChatEmptyState';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';

interface ChatLayoutProps {
  currentChatRoomId?: string;
}

export default function ChatLayout({ currentChatRoomId }: ChatLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, ParticipantStatus>>({});


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(chatRoomsRef, where('participantIds', 'array-contains', user.id));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const roomsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const deletedByData = data.deletedBy || {};
            const clientDeletedBy: {[key: string]: string} = {};
            Object.keys(deletedByData).forEach(key => {
                if (deletedByData[key] instanceof Timestamp) {
                    clientDeletedBy[key] = deletedByData[key].toDate().toISOString();
                }
            });

            return {
                id: doc.id,
                ...data,
                updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
                deletedBy: clientDeletedBy
            } as ChatRoom
        })
        .filter(room => {
            const isDeletedForUser = room.deletedBy?.[user.id];
            // Keep the room if it's not deleted by the user
            if (!isDeletedForUser) {
                return true;
            }
            // Also keep the room if it's the one currently being viewed, even if deleted
            if (room.id === currentChatRoomId) {
                return true;
            }
            // Otherwise, filter it out
            return false;
        });
        
        // Sort client-side to avoid needing a composite index
        roomsData.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });

        setChatRooms(roomsData);
        setLoading(false);
    }, (error) => {
        console.error("Failed to fetch chat rooms with snapshot:", error);
        toast({ title: "Error", description: "Could not load your conversations.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [user, currentChatRoomId]);

   // New useEffect to listen to participant statuses
   useEffect(() => {
    if (chatRooms.length === 0 || !user) {
        setParticipantStatuses({});
        return;
    }

    const uniqueParticipantIds = new Map<string, 'member' | 'trainer'>();
    chatRooms.forEach(room => {
        room.participantIds.forEach(id => {
            if (id !== user.id) {
                const role = room.participants[id]?.role;
                if(role) uniqueParticipantIds.set(id, role);
            }
        });
    });

    const unsubscribes = Array.from(uniqueParticipantIds.entries()).map(([id, role]) => {
        const collectionName = role === 'trainer' ? 'trainers' : 'users';
        const docRef = doc(db, collectionName, id);
        
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const lastSeenTimestamp = data.lastSeen as Timestamp | undefined;
                const lastSeenDate = lastSeenTimestamp?.toDate();

                setParticipantStatuses(prev => ({
                    ...prev,
                    [id]: {
                        lastSeen: lastSeenDate?.toISOString(),
                    }
                }));
            }
        }, (error) => {
            console.error(`Error listening to participant ${id} status:`, error);
        });
    });

    return () => unsubscribes.forEach(unsub => unsub());

  }, [chatRooms, user]);


  const selectedChatRoom = chatRooms.find(cr => cr.id === currentChatRoomId);
  const otherParticipantInSelectedChatId = selectedChatRoom?.participantIds.find(id => id !== user?.id);
  const selectedParticipantStatus = otherParticipantInSelectedChatId ? participantStatuses[otherParticipantInSelectedChatId] : undefined;

  useEffect(() => {
    if (currentChatRoomId && !loading && !selectedChatRoom) {
      router.replace('/chat');
    }
  }, [currentChatRoomId, loading, selectedChatRoom, router]);

  return (
    <div className="flex h-full border rounded-lg overflow-hidden">
      <aside className="w-full md:w-1/3 border-r h-full overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
             {[...Array(5)].map((_, i) => (
               <div key={i} className="flex items-center space-x-3">
                 <Skeleton className="h-12 w-12 rounded-full" />
                 <div className="space-y-2 flex-1">
                   <Skeleton className="h-4 w-3/4" />
                   <Skeleton className="h-3 w-1/2" />
                 </div>
               </div>
             ))}
           </div>
        ) : (
          <ChatList 
            chatRooms={chatRooms} 
            selectedChatRoomId={currentChatRoomId} 
            participantStatuses={participantStatuses} 
          />
        )}
      </aside>
      <main className="flex-1 h-full flex-col hidden md:flex">
        {selectedChatRoom ? (
          <ChatWindow
            key={selectedChatRoom.id}
            chatRoom={selectedChatRoom}
            participantStatus={selectedParticipantStatus}
          />
        ) : (
          <ChatEmptyState />
        )}
      </main>
    </div>
  );
}
