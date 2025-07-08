
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { AIPlanRequest } from '@/types';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";
import { FITNESS_GOALS, EXPERIENCE_LEVELS, WORKOUT_FREQUENCIES } from "@/lib/constants";

const formSchema = z.object({
  age: z.coerce.number().min(10, "Age must be at least 10.").max(100, "Age must be at most 100."),
  fitnessGoal: z.string().min(1, "Fitness goal is required."),
  bmi: z.coerce.number().min(10, "BMI must be at least 10.").max(50, "BMI must be at most 50."),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  availableEquipment: z.string().optional(),
  workoutFrequency: z.string().optional(),
  muscleFocus: z.string().optional(),
});

interface AIPlanFormProps {
  onSubmit: (data: AIPlanRequest) => void;
  isLoading: boolean;
}

const AIPlanForm: React.FC<AIPlanFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<AIPlanRequest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 30,
      fitnessGoal: FITNESS_GOALS[0],
      bmi: 22,
      experienceLevel: "beginner",
      availableEquipment: "",
      workoutFrequency: WORKOUT_FREQUENCIES[0], 
      muscleFocus: "",
    },
  });

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
            <Lightbulb className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">Personalized AI Fitness Plan</CardTitle>
        <CardDescription>Tell us about yourself, and our AI will craft a unique fitness plan just for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fitnessGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Fitness Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your main goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FITNESS_GOALS.map(goal => (
                        <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bmi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your BMI (Body Mass Index)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g., 22.5" {...field} />
                  </FormControl>
                  <FormDescription>If unsure, estimate or use an online BMI calculator.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fitness Experience Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="availableEquipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Equipment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Dumbbells, resistance bands, full gym access, bodyweight only" {...field} rows={2} />
                  </FormControl>
                  <FormDescription>Let the AI know what you have access to.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="workoutFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Workout Frequency (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How often do you want to work out?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WORKOUT_FREQUENCIES.map(freq => (
                        <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="muscleFocus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specific Muscle Focus (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Upper body, legs, core, glutes" {...field} />
                  </FormControl>
                  <FormDescription>Any particular areas you want to target?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? "Generating Plan..." : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate My Plan
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AIPlanForm;

