
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addReview, getUserPlanRating } from '@/lib/data';
import type { Review } from '@/types';
import { cn } from '@/lib/utils';

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Rating is required.").max(5),
  comment: z.string()
    .max(1000, "Comment cannot exceed 1000 characters.")
    .optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  planId: string;
  onReviewSubmitted: () => void; 
  existingUserReview?: Review | null;
}

export default function ReviewForm({ planId, onReviewSubmitted, existingUserReview }: ReviewFormProps) {
  const { user } = useAuth();
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialRating, setInitialRating] = useState<number>(0);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });
  
  useEffect(() => {
    if (justSubmitted) {
      setJustSubmitted(false); // Reset the flag for the next interaction or prop change
      return; // Skip re-populating the form immediately after submission
    }

    const setFormFromProps = async () => {
      let ratingToSet = 0;
      let commentToSet = '';

      if (existingUserReview) {
        ratingToSet = existingUserReview.rating;
        commentToSet = existingUserReview.comment || '';
      } else if (user && user.role === 'member') {
        const quickRating = await getUserPlanRating(user.id, planId);
        if (quickRating !== null) {
          ratingToSet = quickRating;
        }
      }
      
      form.reset({ 
        rating: ratingToSet, 
        comment: commentToSet 
      });
      setInitialRating(ratingToSet);
    };
    
    setFormFromProps();
  }, [existingUserReview, user, planId, form, setInitialRating, justSubmitted]);

  // Reset justSubmitted flag if planId or user changes, to allow population for new context
  useEffect(() => {
    setJustSubmitted(false);
  }, [planId, user]);


  const selectedRating = form.watch('rating');

  const onSubmit = async (data: ReviewFormData) => {
    if (!user || user.role !== 'member') {
      toast({ title: "Error", description: "Only members can submit reviews/ratings.", variant: "destructive" });
      return;
    }
    if (data.rating === 0) {
      toast({ title: "Rating Required", description: "Please select a star rating.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addReview(
        user.id,
        planId,
        data.rating,
        data.comment
      );
      toast({ title: "Feedback Submitted!", description: "Thank you for your feedback." });
      
      form.reset({ rating: 0, comment: '' }); 
      setInitialRating(0); 
      setJustSubmitted(true); // Signal that a submission just happened

      onReviewSubmitted(); // Notify parent
    } catch (error) {
      console.error("Failed to submit review/rating:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not submit your feedback.";
      toast({ title: "Submission Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'member') {
    return <p className="text-sm text-muted-foreground">Log in as a member to rate and review this plan.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-card shadow">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Your Rating*</FormLabel>
              <FormControl>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => field.onChange(starValue)}
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
                          "h-7 w-7",
                          (hoverRating ?? selectedRating ?? initialRating) >= starValue
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground",
                          isSubmitting && "opacity-70"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="comment" className="text-base font-semibold">Your Comment (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  id="comment"
                  placeholder="Share your thoughts on this plan..."
                  rows={4}
                  {...field}
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting || selectedRating === 0} className="w-full sm:w-auto">
          {isSubmitting ? "Submitting..." : (existingUserReview && !justSubmitted ? "Update Feedback" : "Submit Feedback")}
        </Button>
      </form>
    </Form>
  );
}

