
"use client";

import { useState } from 'react';
import type { Review } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface FeaturedReviewCardProps {
  review: Review;
}

const COMMENT_CHARACTER_LIMIT = 150; // Adjust as needed

const FeaturedReviewCard: React.FC<FeaturedReviewCardProps> = ({ review }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const userNameInitial = review.userName ? review.userName.charAt(0).toUpperCase() : 'U';
  const needsTruncation = review.comment.length > COMMENT_CHARACTER_LIMIT;

  return (
    <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 text-left flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={review.userAvatarUrl || "https://placehold.co/100x100.png"} alt={review.userName} data-ai-hint={review.userAvatarUrl ? review.userName : "fitness user"}/>
            <AvatarFallback>{userNameInitial}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{review.userName}</CardTitle>
            <div className="flex text-yellow-400">
              {[...Array(review.rating)].map((_, i) => <Star key={`review-star-${review.planId}-${review.id}-${i}`} className="h-4 w-4 fill-current" />)}
              {[...Array(5 - review.rating)].map((_, i) => <Star key={`review-empty-star-${review.planId}-${review.id}-${i}`} className="h-4 w-4 text-muted-foreground" />)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className={cn(
          "italic text-foreground/80",
          !isExpanded && needsTruncation && "line-clamp-3" // Apply line-clamp only if not expanded and needs truncation
        )}>
          "{review.comment}"
        </p>
        {needsTruncation && (
          <Button
            variant="link"
            size="sm"
            onClick={(e) => {
                e.preventDefault(); // Prevent card link navigation if it's part of a larger Link
                setIsExpanded(!isExpanded);
            }}
            className="p-0 h-auto mt-1 text-primary hover:text-primary/80"
          >
            {isExpanded ? "Read less" : "Read more"}
          </Button>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground mt-auto pt-4 border-t">
        Reviewed plan: <Button variant="link" size="sm" asChild className="p-0 h-auto ml-1"><Link href={`/plans/${review.planId}`}>View Plan</Link></Button>
      </CardFooter>
    </Card>
  );
};

export default FeaturedReviewCard;
