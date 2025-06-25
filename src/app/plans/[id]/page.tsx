
"use client"; // Required for useState and useEffect

import { use, useEffect, useState, useCallback } from 'react'; // Import 'use' and 'useCallback' from React
import { getPlanById, getTrainerById, getReviewsByPlanId, getUserPlanStatus, getPlanProgressForUser } from '@/lib/data';
import type { Plan, Trainer, Review, UserPlanStatus, ProgressEntry } from '@/types';
// import { notFound } from 'next/navigation'; // notFound() cannot be called in client components directly
import Image from 'next/image';
import { CalendarDays, Target, Users, DollarSign, AlertTriangle, MessageSquare, Star } from 'lucide-react'; // Star instead of StarIcon
import ExerciseDisplay from '@/components/plans/ExerciseDisplay';
import TrainerInfo from '@/components/plans/TrainerInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import FavoriteToggleButton from '@/components/plans/FavoriteToggleButton';
import PlanReviewsSection from '@/components/plans/PlanReviewsSection';
import CurrentUserRatingDisplay from '@/components/plans/CurrentUserRatingDisplay';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { useAuth } from '@/hooks/useAuth';
import PlanProgressTracker from '@/components/plans/PlanProgressTracker';
import PlanHistoryLog from '@/components/plans/PlanHistoryLog';
import { toast } from '@/hooks/use-toast';


interface PlanDetailsPageProps {
  params: { id: string };
}

// Metadata generation remains a server-side concern
// export async function generateMetadata({ params }: PlanDetailsPageProps) { ... }
// For client component, metadata would be handled differently or in a parent layout if static

export default function PlanDetailsPage({ params: paramsProp }: PlanDetailsPageProps) {
  const params = use(paramsProp); // Use React.use() to unwrap the params prop
  const { id } = params; // Destructure id from the resolved params

  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshDataKey, setRefreshDataKey] = useState(0); // For forcing re-fetches
  const [userPlanStatus, setUserPlanStatus] = useState<UserPlanStatus | null>(null);
  const [planProgress, setPlanProgress] = useState<ProgressEntry[]>([]);

  const fetchAllData = useCallback(async () => {
    if (!id || !user) return;
    try {
        const [status, progress] = await Promise.all([
            getUserPlanStatus(user.id, id),
            getPlanProgressForUser(user.id, id)
        ]);
        setUserPlanStatus(status);
        setPlanProgress(progress);
    } catch (err: any) {
        console.error("[PlanDetailsPage Client] Error fetching user-specific plan data:", err);
        setError(err.message || "Failed to load your progress for this plan.");
    }
  }, [id, user]);

  useEffect(() => {
    const fetchPlanData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedPlan = await getPlanById(id);
        
        if (!fetchedPlan) {
          setError("Plan not found.");
          setPlan(null);
          return;
        }
        setPlan(fetchedPlan);

        const [fetchedTrainer, fetchedReviews] = await Promise.all([
             getTrainerById(fetchedPlan.trainerId),
             getReviewsByPlanId(id)
        ]);
        
        setTrainer(fetchedTrainer || null);
        setReviews(fetchedReviews);
        
      } catch (err: any) {
        console.error("[PlanDetailsPage Client] Error fetching initial plan details:", err);
        setError(err.message || "Failed to load plan data.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPlanData();
  }, [id, refreshDataKey]);

  useEffect(() => {
      if (user && user.role === 'member' && id) {
          fetchAllData();
      }
  }, [id, user, fetchAllData, refreshDataKey]);


  const handleFeedbackOrStatusChange = useCallback(() => {
    setRefreshDataKey(prevKey => prevKey + 1);
  }, []);

  const handleProgressDeleted = (entryId: string) => {
    setPlanProgress(prev => prev.filter(p => p.id !== entryId));
    toast({ title: "Log Deleted", description: "Your progress entry has been removed." });
  };
  
  const renderStars = (rating: number, planId: string, starSizeClass = "h-8 w-8", containerClasses = "gap-1") => {
    const numStars = 5;
    const fullStars = Math.floor(rating);
    const fractionalPart = rating - fullStars;
    const filledPercentage = fractionalPart > 0 ? fractionalPart * 100 : 0;
  
    return (
      <div className={`flex items-center ${containerClasses}`}>
        {Array.from({ length: numStars }, (_, i) => {
          const starValue = i + 1;
          if (starValue <= fullStars) {
            return <Star key={`star-full-${planId}-${i}`} className={`${starSizeClass} text-yellow-400 fill-yellow-400`} />;
          } else if (starValue === fullStars + 1 && fractionalPart > 0) {
            return (
              <div key={`star-partial-${planId}-${i}`} className={`relative ${starSizeClass}`}>
                <Star className={`absolute ${starSizeClass} text-gray-300 dark:text-gray-600`} />
                <Star
                  className={`absolute ${starSizeClass} text-yellow-400 fill-yellow-400`}
                  style={{ clipPath: `inset(0 ${100 - filledPercentage}% 0 0)` }}
                />
              </div>
            );
          } else {
            return <Star key={`star-empty-${planId}-${i}`} className={`${starSizeClass} text-gray-300 dark:text-gray-600`} />;
          }
        })}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-96 w-full rounded-lg" /> 
        <Card className="shadow-lg -mt-10 relative z-10 mx-auto max-w-6xl">
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
                {[...Array(5)].map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}
            </CardContent>
        </Card>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <div className="md:col-span-1 space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) { // Handle error state if plan not found or other fetch error
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-2xl font-semibold">Error Loading Plan</h2>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/plans">Back to Plan Explorer</Link>
        </Button>
      </div>
    );
  }
  
  if (!plan) { // Should be covered by error state, but as a fallback
     return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold">Plan Not Found</h2>
        <p className="mt-2 text-muted-foreground">The plan you are looking for does not exist or could not be loaded.</p>
         <Button asChild variant="outline" className="mt-6">
          <Link href="/plans">Back to Plan Explorer</Link>
        </Button>
      </div>
    );
  }


  const planImageSrc = plan.imageUrl || `https://placehold.co/1200x400.png?text=${encodeURIComponent(plan.name)}`;
  const planImageHint = plan.imageUrl ? plan.name : "fitness banner";

  return (
    <div className="space-y-8">
      <article>
        <header className="mb-8">
          <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden shadow-xl mb-6">
            <Image
              src={planImageSrc}
              alt={plan.name}
              fill
              className="object-cover"
              priority
              data-ai-hint={planImageHint}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white flex items-center gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{plan.name}</h1>
                    <p className="text-lg md:text-xl mt-1 opacity-90 max-w-2xl">{plan.description}</p>
                </div>
            </div>
            <div className="absolute top-4 right-4">
                <FavoriteToggleButton planId={plan.id} size="lg" className="bg-background/30 hover:bg-rose-100 dark:bg-foreground/20 dark:hover:bg-rose-800/50 backdrop-blur-sm text-white hover:text-rose-500" />
            </div>
          </div>

          <Card className="shadow-lg -mt-10 relative z-10 mx-auto max-w-6xl">
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
              <div className="flex flex-col items-center justify-center">
                {/* <Star className="h-8 w-8 text-yellow-400 mb-1 fill-current" />  Replaced by renderStars */}
                {renderStars(plan.rating, plan.id, "h-6 w-6", "gap-0.5 mb-1")}
                {plan.numberOfRatings && plan.numberOfRatings > 0 ? (
                  <>
                    <span className="font-semibold text-lg">{plan.rating.toFixed(1)}/5</span>
                    <span className="text-xs text-muted-foreground">({plan.numberOfRatings} reviews)</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Not yet rated</span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center">
                <CalendarDays className="h-8 w-8 text-primary mb-1" />
                <span className="font-semibold text-lg">{plan.duration}</span>
                <span className="text-xs text-muted-foreground">Duration</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <Target className="h-8 w-8 text-primary mb-1" />
                <span className="font-semibold text-lg">{plan.goal}</span>
                <span className="text-xs text-muted-foreground">Primary Goal</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <Users className="h-8 w-8 text-primary mb-1" />
                <span className="font-semibold text-lg">{plan.targetAudience}</span>
                <span className="text-xs text-muted-foreground">Audience</span>
              </div>
              <div className="flex flex-col items-center justify-center">
                <DollarSign className="h-8 w-8 text-green-500 mb-1" />
                <span className="font-semibold text-lg">{plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}</span>
                <span className="text-xs text-muted-foreground">Price</span>
              </div>
            </CardContent>
          </Card>
        </header>

        {!plan.isPublished && (
          <Card className="mb-6 border-yellow-500 bg-yellow-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700">This plan is currently a draft and not visible to members.</p>
                <p className="text-sm text-yellow-600">Publish it from your dashboard to make it available in the Plan Explorer.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <PlanProgressTracker
            plan={plan}
            initialStatus={userPlanStatus}
            onStatusChange={handleFeedbackOrStatusChange}
        />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <ExerciseDisplay exercises={plan.exercises || []} />
             <PlanHistoryLog entries={planProgress} onDeleteEntry={handleProgressDeleted} />
             <PlanReviewsSection 
                planId={plan.id} 
                initialReviews={reviews} 
                onFeedbackSubmitted={handleFeedbackOrStatusChange}
             />
          </div>
          <div className="md:col-span-1 space-y-6">
            <CurrentUserRatingDisplay planId={plan.id} refreshKey={refreshDataKey} />
            <TrainerInfo trainer={trainer || null} />
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Plan Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                 <p><strong>Age Range:</strong> {plan.ageMin} - {plan.ageMax} years</p>
                 <p><strong>Suitable BMI:</strong> {plan.bmiCategories.join(', ')}</p>
                 <p><strong>Last Updated:</strong> {new Date(plan.updatedAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </article>
      <Separator className="my-8"/>
      <div className="text-center">
        <Button asChild variant="outline">
            <Link href="/plans">Back to Plan Explorer</Link>
        </Button>
      </div>
    </div>
  );
}
