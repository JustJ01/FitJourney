
"use client";

import { useState, useEffect } from 'react';
import type { Plan, UserPlanStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { updateUserPlanDayStatus } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';

interface PlanProgressTrackerProps {
  plan: Plan;
  initialStatus: UserPlanStatus | null;
  onStatusChange: () => void;
}

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
      return value * 30; 
    case 'day':
    case 'days':
      return value;
    default:
      return 0;
  }
};

const PlanProgressTracker: React.FC<PlanProgressTrackerProps> = ({ plan, initialStatus, onStatusChange }) => {
  const { user } = useAuth();
  const [completedDays, setCompletedDays] = useState<number[]>(initialStatus?.completedDays || []);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  useEffect(() => {
    setCompletedDays(initialStatus?.completedDays || []);
  }, [initialStatus]);

  if (!user || user.role !== 'member') {
    return null; // Don't show the tracker for trainers or guests
  }

  const totalDays = parseDurationToDays(plan.duration);
  if (totalDays === 0) {
    return null; // Don't show if duration is invalid
  }

  const completionPercentage = totalDays > 0 ? (completedDays.length / totalDays) * 100 : 0;
  const daysCompletedCount = completedDays.length;

  const handleDayToggle = async (day: number) => {
    setIsUpdating(day);
    const isNowCompleted = !completedDays.includes(day);

    try {
      await updateUserPlanDayStatus(user.id, plan.id, day, isNowCompleted);
      setCompletedDays(prev => 
        isNowCompleted ? [...prev, day].sort((a,b)=>a-b) : prev.filter(d => d !== day)
      );
      toast({
        title: `Day ${day} ${isNowCompleted ? 'Completed!' : 'Unmarked'}`,
        description: isNowCompleted ? "Great job, keep it up!" : "Progress updated.",
      });
      onStatusChange(); // Notify parent to refresh data
    } catch (error) {
      console.error(`Failed to update day ${day} status`, error);
      toast({ title: "Update Failed", description: "Could not save your progress.", variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };
  
  const getDaysSinceStart = () => {
    if (!initialStatus?.startDate) return null;
    return formatDistanceToNowStrict(new Date(initialStatus.startDate), { addSuffix: true });
  }

  return (
    <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary"/>
            Your Plan Progress
        </CardTitle>
        <CardDescription>Track your completion day-by-day. Stay consistent!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <div className="flex justify-between items-end mb-1 text-sm">
                <span className="font-medium text-muted-foreground">
                    Plan Started: {initialStatus?.startDate ? getDaysSinceStart() : 'Not started yet. Check a day to begin!'}
                </span>
                <span className="font-semibold text-primary">{Math.round(completionPercentage)}% Complete</span>
            </div>
          <Progress value={completionPercentage} className="w-full h-3" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{daysCompletedCount} of {totalDays} days completed</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Daily Checklist</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-muted/30">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
              <div key={day} className="flex items-center space-x-2 p-2 bg-background rounded-md shadow-sm">
                <Checkbox
                  id={`day-${day}`}
                  checked={completedDays.includes(day)}
                  onCheckedChange={() => handleDayToggle(day)}
                  disabled={isUpdating === day}
                  aria-label={`Mark day ${day} as complete`}
                />
                <Label htmlFor={`day-${day}`} className="text-sm font-medium leading-none cursor-pointer">
                  Day {day}
                </Label>
                {isUpdating === day && <Skeleton className="h-4 w-4 rounded-full animate-spin" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanProgressTracker;
