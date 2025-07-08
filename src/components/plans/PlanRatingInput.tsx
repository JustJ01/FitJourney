
"use client";

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { addOrUpdatePlanRating, getUserPlanRating } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanRatingInputProps {
  planId: string;
}

export default function PlanRatingInput({ planId }: PlanRatingInputProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentUserRating, setCurrentUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUserRating, setIsLoadingUserRating] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (user && user.role === 'member') {
      setIsLoadingUserRating(true);
      getUserPlanRating(user.id, planId)
        .then(rating => {
          if (isMounted) setCurrentUserRating(rating);
        })
        .catch(err => {
          if (isMounted) console.error("Error fetching user rating:", err);
          
        })
        .finally(() => {
          if (isMounted) setIsLoadingUserRating(false);
        });
    } else {
      if (isMounted) setIsLoadingUserRating(false);
    }
    return () => { isMounted = false; };
  }, [user, planId]);

  const handleSetRating = async (ratingValue: number) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to rate plans.", variant: "destructive" });
      return;
    }
    if (user.role !== 'member') {
      toast({ title: "Action Not Allowed", description: "Only members can rate plans.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrUpdatePlanRating(user.id, planId, ratingValue);
      setCurrentUserRating(ratingValue);
      toast({ title: "Rating Submitted!", description: `You rated this plan ${ratingValue} star(s).` });
      router.refresh(); // Refresh server component data
    } catch (error) {
      console.error("Failed to submit rating:", error);
      toast({ title: "Error", description: "Could not submit your rating.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const starsArray = [1, 2, 3, 4, 5];

  if (!user || user.role !== 'member') {
    return <p className="text-sm text-muted-foreground">Login as a member to rate this plan.</p>;
  }

  if (isLoadingUserRating) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 text-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {currentUserRating ? `Your Rating: ${currentUserRating} Star(s)` : "Rate this plan:"}
      </p>
      <div className="flex items-center gap-1">
        {starsArray.map((starValue) => (
          <button
            key={starValue}
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSetRating(starValue)}
            onMouseEnter={() => !isSubmitting && setHoverRating(starValue)}
            onMouseLeave={() => !isSubmitting && setHoverRating(null)}
            className={cn(
              "p-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSubmitting ? "cursor-not-allowed" : "hover:bg-accent/50"
            )}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                "h-6 w-6",
                (hoverRating ?? currentUserRating ?? 0) >= starValue
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground",
                isSubmitting && "opacity-70"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
