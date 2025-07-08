
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Plan } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getPlansByTrainerId, deletePlan as deletePlanData } from '@/lib/data';
import PlanListItem from '@/components/dashboard/PlanListItem';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, LayoutGrid, AlertTriangle, Search, ListFilter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TrainerDashboardPage() {
  const { user } = useAuth();
  const [allTrainerPlans, setAllTrainerPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => {
    if (user && user.role === 'trainer') {
      const fetchPlans = async () => {
        setLoading(true);
        try {
          const plans = await getPlansByTrainerId(user.id);
          setAllTrainerPlans(plans);
        } catch (error) {
          console.error("Failed to fetch trainer plans:", error);
          toast({ title: "Error", description: "Could not load your plans.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    } else {
      setLoading(false); 
    }
  }, [user]);

  const filteredPlans = useMemo(() => {
    let plans = [...allTrainerPlans];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      plans = plans.filter(plan =>
        plan.name.toLowerCase().includes(lowerSearchTerm) ||
        plan.description.toLowerCase().includes(lowerSearchTerm) ||
        plan.goal.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (publishedFilter !== "all") {
      plans = plans.filter(plan =>
        publishedFilter === "published" ? plan.isPublished : !plan.isPublished
      );
    }

    return plans;
  }, [allTrainerPlans, searchTerm, publishedFilter]);

  const handleDeletePlan = async (planId: string) => {
    try {
      await deletePlanData(planId);
      setAllTrainerPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
      toast({ title: "Plan Deleted", description: "The plan has been successfully deleted." });
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast({ title: "Error", description: "Could not delete the plan.", variant: "destructive" });
    }
  };

  if (loading && !allTrainerPlans.length) { 
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full" /> {/* For filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'trainer') {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You must be logged in as a trainer to view this page.</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                <LayoutGrid className="h-7 w-7"/>
                Trainer Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your fitness plans and exercises.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/plans/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Plan
          </Link>
        </Button>
      </header>

      <div className="space-y-4 p-4 border rounded-lg bg-card shadow">
        <h3 className="text-lg font-semibold flex items-center gap-2"><ListFilter className="h-5 w-5 text-primary" /> Filter Your Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, goal, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
          <Select value={publishedFilter} onValueChange={(value: "all" | "published" | "draft") => setPublishedFilter(value)}>
            <SelectTrigger className="w-full md:w-auto">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading && <p className="text-center text-muted-foreground">Loading plans...</p>}

      {!loading && filteredPlans.length > 0 ? (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Plans ({filteredPlans.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <PlanListItem key={plan.id} plan={plan} onDelete={handleDeletePlan} />
            ))}
          </div>
        </section>
      ) : (
        !loading && (
          <Alert className="bg-card border-primary/30">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <AlertTitle className="font-semibold">
              {allTrainerPlans.length === 0 ? "No Plans Yet!" : "No Plans Match Filters"}
            </AlertTitle>
            <AlertDescription>
              {allTrainerPlans.length === 0 
                ? "You haven't created any fitness plans. Get started by clicking the \"Create New Plan\" button."
                : "Try adjusting your search term or filter."
              }
            </AlertDescription>
          </Alert>
        )
      )}
    </div>
  );
}
