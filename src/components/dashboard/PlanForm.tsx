
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import type { Plan, Exercise, BMICategory, PlanSpecificBMICategory } from '@/types';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ExerciseInput from "./ExerciseInput";
import { PlusCircle, Save, Trash2, Activity } from "lucide-react";
import { BMI_CATEGORIES, FITNESS_GOALS, PLAN_DURATIONS, DEFAULT_AGE_RANGE, ACTUAL_PLAN_BMI_CATEGORIES } from "@/lib/constants";
import { Separator } from "../ui/separator";

const exerciseSchema = z.object({
  id: z.string().optional(), // For existing exercises
  name: z.string().min(1, "Exercise name is required."),
  dayOfWeek: z.string().min(1, "Day of week is required."),
  sets: z.coerce.number().min(1, "Sets must be at least 1."),
  reps: z.string().min(1, "Reps description is required."),
  instructions: z.string().optional(),
});

const planFormSchema = z.object({
  name: z.string().min(3, "Plan name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  duration: z.string().min(1, "Duration is required."),
  goal: z.string().min(1, "Goal is required."),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  price: z.coerce.number().min(0, "Price cannot be negative.").optional().default(0),
  targetAudience: z.string().min(1, "Target audience is required."),
  ageMin: z.coerce.number().min(10).max(100),
  ageMax: z.coerce.number().min(10).max(100),
  bmiCategories: z.array(z.enum(ACTUAL_PLAN_BMI_CATEGORIES)).min(1, "At least one BMI category must be selected."),
  exercises: z.array(exerciseSchema).optional().default([]),
  isPublished: z.boolean().optional().default(false),
}).refine(data => data.ageMin <= data.ageMax, {
  message: "Min age cannot be greater than max age.",
  path: ["ageMin"],
});

export type PlanFormData = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  initialData?: Plan; // For editing
  onSubmit: (data: PlanFormData) => Promise<void>;
  isSubmitting: boolean;
  submitButtonText?: string;
}

// Prepare BMI categories for the form (excluding 'All')
const bmiCategoriesForForm = BMI_CATEGORIES.filter(c => c !== 'All') as PlanSpecificBMICategory[];


const PlanForm: React.FC<PlanFormProps> = ({ initialData, onSubmit, isSubmitting, submitButtonText = "Save Plan" }) => {
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      exercises: initialData.exercises || [],
      isPublished: initialData.isPublished || false,
      // Ensure bmiCategories from initialData (PlanSpecificBMICategory[]) aligns with Zod schema
      bmiCategories: initialData.bmiCategories.filter(cat => ACTUAL_PLAN_BMI_CATEGORIES.includes(cat as any)) as PlanSpecificBMICategory[],
    } : {
      name: "",
      description: "",
      duration: PLAN_DURATIONS[2], // Default to 4 Weeks
      goal: FITNESS_GOALS[0],
      rating: 0,
      price: 0,
      targetAudience: "Beginners",
      ageMin: DEFAULT_AGE_RANGE[0],
      ageMax: DEFAULT_AGE_RANGE[1],
      bmiCategories: ['Normal'] as PlanSpecificBMICategory[], // Default to 'Normal' which is a PlanSpecificBMICategory
      exercises: [],
      isPublished: false,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const handleAddExercise = () => {
    append({ name: "", dayOfWeek: "Monday", sets: 3, reps: "10-12", instructions: "" });
  };

  const handleExerciseChange = (index: number, field: keyof Omit<Exercise, 'id' | 'planId'>, value: string | number) => {
    const currentExercise = fields[index];
    update(index, { ...currentExercise, [field]: value });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{initialData ? "Edit Fitness Plan" : "Create New Fitness Plan"}</CardTitle>
            <CardDescription>
              {initialData ? "Update the details of your fitness plan." : "Fill in the details to create a new fitness plan for your clients."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Full Body Blast" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="goal" render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger></FormControl>
                    <SelectContent>{FITNESS_GOALS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Detailed description of the plan..." {...field} rows={4} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            
            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger></FormControl>
                    <SelectContent>{PLAN_DURATIONS.filter(d=>d!=="Any").map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="targetAudience" render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
                  <FormControl><Input placeholder="e.g., Beginners, Advanced Athletes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0 for free" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Targeting Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ageMin" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Min Age</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 18" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="ageMax" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Max Age</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 65" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="bmiCategories" render={() => (
                    <FormItem>
                        <div className="mb-2">
                        <FormLabel className="text-base">Suitable BMI Categories</FormLabel>
                        <FormDescription>Select all applicable BMI ranges for this plan.</FormDescription>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {bmiCategoriesForForm.map((categoryValue) => (
                            <FormField
                            key={categoryValue}
                            control={form.control}
                            name="bmiCategories"
                            render={({ field }) => {
                                return (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0 bg-muted/20 p-2 rounded-md">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(categoryValue)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), categoryValue])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                (value) => value !== categoryValue
                                                )
                                            );
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">{categoryValue}</FormLabel>
                                </FormItem>
                                );
                            }}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField control={form.control} name="isPublished" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/20">
                <div className="space-y-0.5">
                  <FormLabel>Publish Plan</FormLabel>
                  <FormDescription>
                    Make this plan visible to members in the Plan Explorer.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary"/>
                Exercises
            </CardTitle>
            <CardDescription>Add or modify exercises for this plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && (
                <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>No exercises added yet.</p>
                    <p className="text-sm">Click "Add Exercise" to get started.</p>
                </div>
            )}
            {fields.map((field, index) => (
              <ExerciseInput
                key={field.id || `new-${index}`} // Ensure key for new items
                exercise={field}
                index={index}
                onExerciseChange={handleExerciseChange}
                onRemoveExercise={() => remove(index)}
              />
            ))}
            <Button type="button" variant="outline" onClick={handleAddExercise} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise
            </Button>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full sm:w-auto">
              <Save className="mr-2 h-5 w-5" />
              {isSubmitting ? "Saving..." : submitButtonText}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default PlanForm;
