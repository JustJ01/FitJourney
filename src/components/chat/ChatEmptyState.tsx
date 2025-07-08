
import { MessageSquareDashed } from 'lucide-react';

export default function ChatEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
      <MessageSquareDashed className="h-16 w-16 mb-4" />
      <h2 className="text-xl font-semibold text-foreground">Select a conversation</h2>
      <p className="mt-1">Choose a conversation from the list on the left to start chatting.</p>
    </div>
  );
}
