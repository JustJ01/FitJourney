
"use client";

import type { ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { deleteMessage } from '@/lib/data';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';


interface MessageBubbleProps {
  message: ChatMessage;
  isSender: boolean;
  otherParticipantId: string | undefined;
}

export default function MessageBubble({ message, isSender, otherParticipantId }: MessageBubbleProps) {
  const { user } = useAuth();
  const isReadByRecipient = otherParticipantId ? message.readBy.includes(otherParticipantId) : false;

  const handleDelete = async () => {
    if (!user) return;
    try {
        await deleteMessage(message.chatRoomId, message.id, user.id);
        toast({ title: "Message Deleted" });
    } catch(error) {
        console.error("Failed to delete message:", error);
        toast({ title: "Error", description: "Could not delete message.", variant: "destructive"});
    }
  }

  const messageContent = (
    <>
      <p className={cn("text-sm whitespace-pre-wrap", message.isDeleted && "italic text-muted-foreground")}>{message.text}</p>
      <div className="flex items-center justify-end gap-1.5 text-xs mt-1">
        <span className={cn(isSender ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {format(new Date(message.timestamp), 'p')}
        </span>
        {isSender && !message.isDeleted && (
          isReadByRecipient 
          ? <CheckCheck className="h-4 w-4 text-sky-200" /> 
          : <Check className="h-4 w-4 text-primary-foreground/70" />
        )}
      </div>
    </>
  );

  return (
    <div className={cn("flex items-end gap-2 group", isSender ? "justify-end" : "justify-start")}>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div
                    className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-3 py-2 cursor-pointer",
                    isSender
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    )}
                >
                    {messageContent}
                </div>
            </DropdownMenuTrigger>
            {isSender && !message.isDeleted && (
                <DropdownMenuContent align={isSender ? "end" : "start"}>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this message? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            )}
        </DropdownMenu>
    </div>
  );
}
