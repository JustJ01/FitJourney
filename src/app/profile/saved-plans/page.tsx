
"use client";

import { useState, useEffect } from 'react';
import type { Plan } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getFavoritePlans } from '@/lib/data';
import PlanCard from '@/components/plans/PlanCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HeartCrack, ListChecks } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SavedPlansPage() {
  const { user } = useAuth();
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'member') {
      const fetchSavedPlans = async () => {
        setLoading(true);
        try {
          const plans = await getFavoritePlans(user.id);
          setSavedPlans(plans);
        } catch (error) {
          console.error("Failed to fetch saved plans:", error);
          toast({ title: "Error", description: "Could not load your saved plans.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchSavedPlans();
    } else if (user && user.role !== 'member') {
      // Redirect or show message if a non-member (e.g. trainer) tries to access
      // This should ideally be handled by route protection if this page is member-specific
      setLoading(false);
      // router.push('/'); // Or show an "Access Denied" message
    } else {
      setLoading(false); // No user
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-8">
        <header className="text-center">
          <Skeleton className="h-10 w-2/3 mx-auto mb-2" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'member') {
    // AuthGuard in layout should handle this, but good to have a fallback.
    return (
      <Alert variant="destructive">
        <HeartCrack className="h-5 w-5" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>You must be logged in as a member to view saved plans.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center justify-center gap-2">
            <ListChecks className="h-8 w-8"/>
            My Saved Plans
        </h1>
        <p className="mt-2 text-lg text-foreground/80">
          Your collection of favorited fitness plans.
        </p>
      </header>

      {savedPlans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
            // We might want a different version of PlanCard or add props to handle "unfavorite" later
          ))}
        </div>
      ) : (
        <Alert className="bg-card border-primary/30">
          <HeartCrack className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold">No Saved Plans Yet!</AlertTitle>
          <AlertDescription>
            You haven't saved any fitness plans. Explore plans and click the heart icon to save them here.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
