
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Exercise, ProgressEntry } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { addProgressEntry, getExerciseProgressForUser } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Save, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProgressHistoryChart } from '../charts/ProgressHistoryChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '../ui/skeleton';
import { estimateCalories, type CalorieEstimationInput } from '@/ai/flows/estimate-calories';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface LogProgressDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: Exercise;
}

const progressFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  weight: z.coerce.number().min(0, "Cannot be negative.").optional(),
  reps: z.coerce.number().min(1, "Must be at least 1.").optional(),
  sets: z.coerce.number().min(1, "Must be at least 1.").optional(),
  duration: z.coerce.number().min(0, "Cannot be negative.").optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
    const isNonNegativeNumber = (val: unknown): val is number =>
      typeof val === 'number' && !isNaN(val) && val >= 0;

    const isPositiveNumber = (val: unknown): val is number =>
      typeof val === 'number' && !isNaN(val) && val > 0;

    // If a duration is not logged, then weight, reps, and sets are all required.
    if (!isPositiveNumber(data.duration)) {
        if (!isNonNegativeNumber(data.weight)) {
            ctx.addIssue({
                path: ['weight'],
                message: 'Entry required',
                code: z.ZodIssueCode.custom,
            });
        }
        if (!isPositiveNumber(data.reps)) {
            ctx.addIssue({
                path: ['reps'],
                message: 'Entry required',
                code: z.ZodIssueCode.custom,
            });
        }
        if (!isPositiveNumber(data.sets)) {
            ctx.addIssue({
                path: ['sets'],
                message: 'Entry required',
                code: z.ZodIssueCode.custom,
            });
        }
    }
});

type ProgressFormData = z.infer<typeof progressFormSchema>;

export default function LogProgressDialog({ isOpen, onOpenChange, exercise }: LogProgressDialogProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ProgressEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProgressFormData>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      date: new Date(),
      sets: exercise.sets,
      notes: '',
    },
  });
  
  const fetchHistory = useCallback(async () => {
    if (user && exercise) {
      setLoadingHistory(true);
      try {
        const data = await getExerciseProgressForUser(user.id, exercise.id);
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch exercise history", err);
        toast({ title: "Error", description: "Could not load progress history.", variant: "destructive" });
      } finally {
        setLoadingHistory(false);
      }
    }
  }, [user, exercise]);


  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      form.reset({
        date: new Date(),
        sets: exercise.sets,
        weight: undefined,
        reps: undefined,
        duration: undefined,
        notes: '',
      });
    }
  }, [isOpen, fetchHistory, exercise, form]);
  
  const canEstimateCalories = user && user.age && user.weight && user.height && user.gender;

  const onSubmit = async (data: ProgressFormData) => {
    if (!user || !exercise) return;
    setIsSubmitting(true);

    let caloriesBurned: number | undefined = undefined;

    if (canEstimateCalories && (data.duration || (data.reps && data.sets))) {
        try {
            const aiInput: CalorieEstimationInput = {
                userProfile: {
                    age: user.age!,
                    weight: user.weight!,
                    height: user.height!,
                    gender: user.gender!,
                },
                workoutEntry: {
                    exerciseName: exercise.name,
                    duration: data.duration,
                    weight: data.weight,
                    reps: data.reps,
                    sets: data.sets,
                }
            };
            const result = await estimateCalories(aiInput);
            caloriesBurned = result.estimatedCalories;
            toast({ title: "AI Estimation Complete", description: `Estimated ${caloriesBurned} calories burned.` });
        } catch (aiError) {
            console.error("Calorie estimation AI call failed:", aiError);
            toast({
                title: "AI Calorie Estimation Failed",
                description: "Could not estimate calories, but progress will be logged without it.",
                variant: "destructive"
            });
        }
    }


    try {
      const entry: Omit<ProgressEntry, 'id'> = {
        userId: user.id,
        planId: exercise.planId,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        date: data.date.toISOString(),
        weight: data.weight,
        reps: data.reps,
        sets: data.sets,
        duration: data.duration,
        notes: data.notes,
        caloriesBurned: caloriesBurned,
      };
      await addProgressEntry(entry);
      toast({ title: "Progress Logged!", description: `Your progress for ${exercise.name} has been saved.` });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to log progress", err);
      toast({ title: "Error", description: "Could not save your progress. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Log Progress: {exercise.name}</DialogTitle>
          <DialogDescription>
            Record your performance for this exercise. Previous entries are shown in the chart below.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 overflow-y-auto pr-4">
          <Tabs defaultValue="weight">
              <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="weight">Weight</TabsTrigger>
                  <TabsTrigger value="reps">Reps</TabsTrigger>
                  <TabsTrigger value="duration">Duration</TabsTrigger>
              </TabsList>
              {loadingHistory ? (
                 <Skeleton className="h-64 w-full mt-4" />
              ) : (
                <>
                  <TabsContent value="weight"><ProgressHistoryChart data={history} metric="weight" /></TabsContent>
                  <TabsContent value="reps"><ProgressHistoryChart data={history} metric="reps" /></TabsContent>
                  <TabsContent value="duration"><ProgressHistoryChart data={history} metric="duration" /></TabsContent>
                </>
              )}
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
              {!canEstimateCalories && (
                 <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">Enable AI Calorie Estimation</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                        To get an AI-powered estimate of calories burned, please add your age, weight, height, and gender to your profile.
                    </AlertDescription>
                </Alert>
              )}
              <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                  <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                      <PopoverTrigger asChild>
                          <FormControl>
                          <Button
                              variant={"outline"}
                              className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                              )}
                          >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                          </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                      </PopoverContent>
                      </Popover>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="weight" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl><Input type="number" step="0.5" placeholder="e.g., 50" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="reps" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Reps</FormLabel>
                          <FormControl><Input type="number" placeholder="e.g., 10" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
                  <FormField control={form.control} name="sets" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Sets</FormLabel>
                          <FormControl><Input type="number" placeholder="e.g., 3" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )} />
              </div>
              <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl><Input type="number" placeholder="For timed exercises" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                  </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Felt strong, could increase weight next time." {...field} value={field.value ?? ''}/></FormControl>
                      <FormMessage />
                  </FormItem>
              )} />
              <DialogFooter className="pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Logging..." : <><Save className="mr-2 h-4 w-4"/> Save Log</>}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
