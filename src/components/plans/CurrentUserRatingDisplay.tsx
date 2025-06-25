
"use client";

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserPlanRating } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card imports

interface CurrentUserRatingDisplayProps {
  planId: string;
  refreshKey?: number; // To trigger re-fetch
  className?: string;
}

export default function CurrentUserRatingDisplay({ planId, refreshKey = 0, className }: CurrentUserRatingDisplayProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user && user.role === 'member') {
      setIsLoading(true);
      getUserPlanRating(user.id, planId)
        .then(fetchedRating => {
          if (isMounted) setRating(fetchedRating);
        })
        .catch(err => {
          if (isMounted) console.error("Error fetching user rating for display:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      if (isMounted) {
        setRating(null); 
        setIsLoading(false);
      }
    }
    return () => { isMounted = false; };
  }, [user, planId, refreshKey]);

  if (!user || user.role !== 'member') {
    return null; 
  }

  return (
    <Card className={cn("shadow-md", className)}>
        <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-lg">Your Current Rating</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
            {isLoading ? (
                 <div className="flex items-center gap-0.5 py-2">
                    {[...Array(5)].map((_, i) => (
                        <Star key={`skeleton-star-${i}`} className="h-6 w-6 text-muted animate-pulse" />
                    ))}
                </div>
            ) : rating !== null ? (
                <div className="flex items-center gap-0.5 py-2">
                    {[...Array(5)].map((_, index) => (
                    <Star
                        key={`rating-star-${index}`}
                        className={cn(
                        "h-6 w-6",
                        (rating ?? 0) >= (index + 1)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground"
                        )}
                    />
                    ))}
                    <span className="ml-2 text-md font-semibold text-foreground">({rating}/5)</span>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground py-2 italic">You haven't rated this plan yet.</p>
            )}
        </CardContent>
    </Card>
  );
}
