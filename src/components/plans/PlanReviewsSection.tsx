
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Review } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import ReviewForm from './ReviewForm';
import ReviewListItem from './ReviewListItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getReviewsByPlanId } from '@/lib/data';
import { toast } from '@/hooks/use-toast';


interface PlanReviewsSectionProps {
  planId: string;
  initialReviews: Review[];
  onFeedbackSubmitted: () => void; // New prop
}

export default function PlanReviewsSection({ planId, initialReviews, onFeedbackSubmitted }: PlanReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);


  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    try {
      const freshReviews = await getReviewsByPlanId(planId);
      setReviews(freshReviews);
    } catch (error) {
      console.error("Failed to fetch updated reviews:", error);
      toast({title: "Error", description: "Could not load latest reviews.", variant: "destructive"})
    } finally {
      setIsLoadingReviews(false);
    }
  }, [planId]);


  const handleReviewSubmittedForSection = () => {
    fetchReviews(); // Refresh the list of reviews in this section
    onFeedbackSubmitted(); // Notify parent (PlanDetailsPage) to refresh other related components
  };
  
  useEffect(() => {
    // Set initial reviews when the prop changes or on initial load
    // This is important if initialReviews are fetched server-side and passed down
    setReviews(initialReviews);
  }, [initialReviews]);


  const existingUserReview = user ? reviews.find(r => r.userId === user.id) : null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Feedback & Reviews
        </CardTitle>
        <CardDescription>Share your experience or see what others think about this plan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {user && user.role === 'member' && (
          <ReviewForm
            planId={planId}
            onReviewSubmitted={handleReviewSubmittedForSection} // Use the new handler
            existingUserReview={existingUserReview}
          />
        )}
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 border-t pt-4">
            {reviews.length > 0 ? `What ${reviews.length} ${reviews.length === 1 ? 'person is' : 'people are'} saying:` : "No reviews yet."}
          </h3>
          {isLoadingReviews && reviews.length === 0 ? ( 
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 border rounded-md">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/6" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewListItem key={review.id} review={review} />
              ))}
            </div>
          ) : (
            !isLoadingReviews && <p className="text-sm text-muted-foreground">Be the first to share your feedback on this plan!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
