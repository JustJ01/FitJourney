
"use client";

import type { Review } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewListItemProps {
  review: Review;
}

export default function ReviewListItem({ review }: ReviewListItemProps) {
  const userNameInitial = review.userName ? review.userName.charAt(0).toUpperCase() : 'U';
  const timeAgo = review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : '';

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border">
            {review.userAvatarUrl && <AvatarImage src={review.userAvatarUrl} alt={review.userName} />}
            <AvatarFallback className="bg-primary/20 text-primary">{userNameInitial}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{review.userName}</p>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
                />
              ))}
               <span className="ml-2 text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{review.comment}</p>
      </CardContent>
    </Card>
  );
}
