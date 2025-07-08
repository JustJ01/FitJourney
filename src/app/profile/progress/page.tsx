
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { ProgressEntry, Plan, UserPlanStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getAllUserProgress, getAllUserPlanStatuses, getAllPurchasedPlans } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Activity, ListFilter, Clock, CheckCircle, Dumbbell as DumbbellIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProgressOverview } from '@/components/profile/ProgressOverview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Helper to parse duration string to total days
const parseDurationToDays = (duration: string): number => {
    if (!duration) return 0;
    const parts = duration.toLowerCase().split(' ');
    if (parts.length < 2) return 0;
  
    const value = parseInt(parts[0]);
    const unit = parts[1];
  
    if (isNaN(value)) return 0;
  
    switch (unit) {
      case 'week':
      case 'weeks':
        return value * 7;
      case 'month':
      case 'months':
        return value * 30; // Approximation
      case 'day':
      case 'days':
        return value;
      default:
        return 0;
    }
  };
  

export default function MyProgressPage() {
    const { user } = useAuth();
    const [allProgressEntries, setAllProgressEntries] = useState<ProgressEntry[]>([]);
    const [allPlanStatuses, setAllPlanStatuses] = useState<UserPlanStatus[]>([]);
    const [trackedPlans, setTrackedPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setLoading(true);
            Promise.all([
                getAllPurchasedPlans(user.id),
                getAllUserProgress(user.id),
                getAllUserPlanStatuses(user.id)
            ]).then(([purchasedPlans, progressData, statusData]) => {
                setTrackedPlans(purchasedPlans);
                setAllProgressEntries(progressData);
                setAllPlanStatuses(statusData);
            })
            .catch(err => {
                console.error("Failed to fetch progress for purchased plans:", err);
                toast({ title: "Error", description: "Could not load your progress data.", variant: "destructive" });
            })
            .finally(() => setLoading(false));
        }
    }, [user]);

    const entriesFromPurchasedPlans = useMemo(() => {
        const purchasedPlanIds = new Set(trackedPlans.map(p => p.id));
        return allProgressEntries.filter(entry => purchasedPlanIds.has(entry.planId));
    }, [allProgressEntries, trackedPlans]);

    const entriesForOverview = useMemo(() => {
        if (selectedPlanId === 'all' || selectedPlanId === 'all-activity') {
            return entriesFromPurchasedPlans;
        }
        return entriesFromPurchasedPlans.filter(entry => entry.planId === selectedPlanId);
    }, [entriesFromPurchasedPlans, selectedPlanId]);
    
    const planSummaries = useMemo(() => {
        return trackedPlans.map(plan => {
            const status = allPlanStatuses.find(s => s.planId === plan.id);
            const entries = entriesFromPurchasedPlans.filter(e => e.planId === plan.id);

            const totalDays = parseDurationToDays(plan.duration || '0');
            const completedDays = status?.completedDays?.length || 0;
            const completionPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
            
            const totalVolume = entries.reduce((acc, entry) => acc + ((entry.weight || 0) * (entry.reps || 0) * (entry.sets || 0)), 0);
            const totalTime = entries.reduce((acc, entry) => acc + (entry.duration || 0), 0);

            return {
                ...plan,
                totalDays,
                completedDays,
                completionPercentage,
                totalVolume,
                totalTime,
            };
        }).filter(summary => summary.totalDays > 0 || summary.totalVolume > 0 || summary.totalTime > 0) as (Plan & { totalDays: number, completedDays: number, completionPercentage: number, totalVolume: number, totalTime: number })[];
    }, [trackedPlans, allPlanStatuses, entriesFromPurchasedPlans]);


    if (loading) {
        return (
            <div className="space-y-6">
                 <CardHeader className="text-center">
                    <Skeleton className="h-10 w-12 mx-auto bg-primary/20" />
                    <Skeleton className="h-8 w-64 mx-auto mt-2" />
                    <Skeleton className="h-5 w-80 mx-auto mt-1" />
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
             <CardHeader className="text-center">
                <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-4">
                    <History className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">My Progress History</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    An overview of your progress across all your purchased fitness plans.
                </p>
            </CardHeader>

            {(trackedPlans.length > 0 || allProgressEntries.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <ListFilter className="h-5 w-5 text-primary" /> Filter Your View
                        </CardTitle>
                        <CardDescription>Select a view to analyze your progress.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-xs">
                             <Label htmlFor="plan-filter">Filter by View</Label>
                            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                                <SelectTrigger id="plan-filter">
                                    <SelectValue placeholder="Select a view" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Plan Summaries</SelectItem>
                                    <SelectItem value="all-activity">All Progress Activity</SelectItem>
                                    {trackedPlans.map(plan => (
                                        <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedPlanId === 'all' ? (
                // Show summary cards
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {planSummaries.length > 0 ? (
                        planSummaries.map(summary => (
                            <Card 
                                key={summary.id} 
                                className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                                onClick={() => setSelectedPlanId(summary.id)}
                            >
                                <CardHeader>
                                    <CardTitle>{summary.name}</CardTitle>
                                    <CardDescription>{summary.duration || 'N/A'}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-medium flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" />Completion</span>
                                            <span className="text-sm font-semibold">{summary.completedDays}/{summary.totalDays} days</span>
                                        </div>
                                        <Progress value={summary.completionPercentage} className="h-2" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <DumbbellIcon className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="text-muted-foreground">Volume</p>
                                                <p className="font-semibold">{summary.totalVolume.toLocaleString()} kg</p>
                                            </div>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-primary" />
                                            <div>
                                                <p className="text-muted-foreground">Time</p>
                                                <p className="font-semibold">{summary.totalTime} min</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                         <div className="md:col-span-2">
                             <Alert>
                                <Activity className="h-4 w-4" />
                                <AlertTitle>{trackedPlans.length === 0 ? "No Purchased Plans" : "No Progress Logged Yet"}</AlertTitle>
                                <AlertDescription>
                                    {trackedPlans.length === 0
                                        ? <>You have not purchased any plans yet. <Button variant="link" asChild className="p-0 h-auto"><Link href="/plans">Explore plans</Link></Button> to get started.</>
                                        : "You haven't logged any workout progress. Go to a plan's detail page and use the \"Log Progress\" button to get started!"
                                    }
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </div>
            ) : (
                // Show detailed charts for selected plan or for all activity
                <ProgressOverview entries={entriesForOverview} />
            )}
        </div>
    );
}
