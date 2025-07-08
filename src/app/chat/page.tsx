
import ChatLayout from '@/components/chat/ChatLayout';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

function ChatPageContent({ searchParams }: { searchParams: { chatRoomId?: string } }) {
  const chatRoomId = searchParams.chatRoomId;
  return <ChatLayout currentChatRoomId={chatRoomId} />;
}

export default function ChatPage({ searchParams }: { searchParams: { chatRoomId?: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent searchParams={searchParams} />
    </Suspense>
  );
}
