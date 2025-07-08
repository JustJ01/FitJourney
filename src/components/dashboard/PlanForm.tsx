
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import type { Plan, Exercise, BMICategory, PlanSpecificBMICategory } from '@/types';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ExerciseInput from "./ExerciseInput";
import { PlusCircle, Save, Trash2, Activity, Sparkles, Wand2, DownloadCloud, Image as ImageIcon, UploadCloud, XCircle } from "lucide-react";
import { BMI_CATEGORIES, FITNESS_GOALS, PLAN_DURATIONS, DEFAULT_AGE_RANGE, ACTUAL_PLAN_BMI_CATEGORIES } from "@/lib/constants";
import { Separator } from "../ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import React, { useState, useCallback, useEffect } from "react";
import { suggestPlanModifications, type SuggestPlanModificationsInput, type SuggestPlanModificationsOutput } from "@/ai/flows/suggest-plan-modifications";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import NextImage from 'next/image';

const exerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Exercise name is required."),
  dayOfWeek: z.string().min(1, "Day of week is required."),
  sets: z.coerce.number().min(1, "Sets must be at least 1."),
  reps: z.string().min(1, "Reps description is required."),
  instructions: z.string().optional().default(""),
});

const planFormSchema = z.object({
  name: z.string().min(3, "Plan name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  duration: z.string().min(1, "Duration is required."),
  goal: z.string().min(1, "Goal is required."),
  price: z.coerce.number().min(0, "Price cannot be negative.").optional().default(0),
  targetAudience: z.string().min(1, "Target audience is required."),
  ageMin: z.coerce.number().min(10).max(100),
  ageMax: z.coerce.number().min(10).max(100),
  bmiCategories: z.array(z.enum(ACTUAL_PLAN_BMI_CATEGORIES)).min(1, "At least one BMI category must be selected."),
  imageUrl: z.string().optional().default(""),
  exercises: z.array(exerciseSchema).optional().default([]),
  isPublished: z.boolean().optional().default(false),
}).refine(data => data.ageMin <= data.ageMax, {
  message: "Min age cannot be greater than max age.",
  path: ["ageMin"],
});

export type PlanFormData = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  initialData?: Plan;
  onSubmit: (data: PlanFormData, newImageUrl?: string, removeImage?: boolean) => Promise<void>;
  isSubmitting: boolean; // This prop comes from the parent page (CreatePlanPage/EditPlanPage)
  submitButtonText?: string;
}

const bmiCategoriesForForm = BMI_CATEGORIES.filter(c => c !== 'All') as PlanSpecificBMICategory[];

const PlanForm: React.FC<PlanFormProps> = ({ initialData, onSubmit: onSubmitFromProps, isSubmitting: parentIsSubmitting, submitButtonText = "Save Plan" }) => {
  const [planImageFile, setPlanImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [markImageForRemoval, setMarkImageForRemoval] = useState(false);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false); // Local submitting state for image upload

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      imageUrl: initialData.imageUrl || "",
      exercises: (initialData.exercises || []).map(ex => ({
        id: ex.id,
        name: ex.name || "",
        dayOfWeek: ex.dayOfWeek || "Monday",
        sets: ex.sets || 0,
        reps: ex.reps || "",
        instructions: ex.instructions || "",
      })),
      isPublished: initialData.isPublished || false,
      bmiCategories: initialData.bmiCategories.filter(cat => ACTUAL_PLAN_BMI_CATEGORIES.includes(cat as any)) as PlanSpecificBMICategory[],
    } : {
      name: "",
      description: "",
      duration: PLAN_DURATIONS[2],
      goal: FITNESS_GOALS[0],
      price: 0,
      targetAudience: "Beginners",
      ageMin: DEFAULT_AGE_RANGE[0],
      ageMax: DEFAULT_AGE_RANGE[1],
      bmiCategories: ['Normal'] as PlanSpecificBMICategory[],
      imageUrl: "",
      exercises: [],
      isPublished: false,
    },
  });

  useEffect(() => {
    if (initialData?.imageUrl && !planImageFile) {
      setImagePreview(initialData.imageUrl);
      form.setValue('imageUrl', initialData.imageUrl);
    }
  }, [initialData?.imageUrl, planImageFile, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [modificationRequest, setModificationRequest] = useState("");
  const [aiSuggestedPlanJSON, setAiSuggestedPlanJSON] = useState<string | null>(null);
  const [aiSuggestedPlanTextual, setAiSuggestedPlanTextual] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isApplyingSuggestions, setIsApplyingSuggestions] = useState(false);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPlanImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      form.setValue('imageUrl', '');
      setMarkImageForRemoval(false);
    }
  };

  const handleRemoveImage = () => {
    setPlanImageFile(null);
    setImagePreview(null);
    form.setValue('imageUrl', '');
    setMarkImageForRemoval(true);
  };

  const handleFormSubmit = async (data: PlanFormData) => {
    setLocalIsSubmitting(true);
    let uploadedImageUrl: string | undefined = data.imageUrl; // Keep existing if no new file & not removing
    let imageShouldBeRemoved = markImageForRemoval;

    if (planImageFile) {
      const formData = new FormData();
      formData.append('file', planImageFile);
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Image upload failed');
        }
        const result = await response.json();
        uploadedImageUrl = result.secure_url;
        imageShouldBeRemoved = false;
      } catch (error) {
        console.error("Failed to upload image to Cloudinary via API:", error);
        toast({ title: "Image Upload Failed", description: (error as Error).message, variant: "destructive" });
        setLocalIsSubmitting(false);
        return;
      }
    } else if (markImageForRemoval) {
        uploadedImageUrl = ""; // Explicitly set to empty string to signify removal
    }

    await onSubmitFromProps(data, uploadedImageUrl, imageShouldBeRemoved);
    setLocalIsSubmitting(false);
  };

  const handleAddExercise = () => {
    append({ name: "", dayOfWeek: "Monday", sets: 3, reps: "10-12", instructions: "" });
  };

  const handleRequestAISuggestions = async () => {
    if (!modificationRequest.trim()) {
      toast({ title: "Error", description: "Please enter your modification request.", variant: "destructive" });
      return;
    }
    setIsSuggesting(true);
    setAiSuggestedPlanJSON(null);
    setAiSuggestedPlanTextual(null);
    try {
      const currentPlanData = form.getValues();
      const planForAI = {
        name: currentPlanData.name,
        description: currentPlanData.description,
        duration: currentPlanData.duration,
        goal: currentPlanData.goal,
        targetAudience: currentPlanData.targetAudience,
        ageMin: currentPlanData.ageMin,
        ageMax: currentPlanData.ageMax,
        bmiCategories: currentPlanData.bmiCategories,
        price: currentPlanData.price,
        isPublished: currentPlanData.isPublished,
        imageUrl: imagePreview || currentPlanData.imageUrl,
        exercises: currentPlanData.exercises.map(ex => ({
          name: ex.name,
          dayOfWeek: ex.dayOfWeek,
          sets: ex.sets,
          reps: ex.reps,
          instructions: ex.instructions,
        })),
      };

      const input: SuggestPlanModificationsInput = {
        existingPlan: JSON.stringify(planForAI, null, 2),
        modificationRequest: modificationRequest,
      };
      const result: SuggestPlanModificationsOutput = await suggestPlanModifications(input);

      setAiSuggestedPlanJSON(result.modifiedPlanJSON);
      setAiSuggestedPlanTextual(result.modifiedPlanTextual);

      toast({ title: "AI Suggestions Ready", description: "Review the AI's suggestions below." });
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "AI Suggestion Failed", description: errorMessage, variant: "destructive" });
      setAiSuggestedPlanJSON('Error: Could not generate valid JSON. ' + errorMessage);
      setAiSuggestedPlanTextual('Error: Could not generate textual plan. ' + errorMessage);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleApplyAISuggestions = () => {
    if (!aiSuggestedPlanJSON) {
        toast({ title: "Error", description: "No AI suggestions (JSON) available to apply.", variant: "destructive" });
        return;
    }
    setIsApplyingSuggestions(true);
    try {
        const suggestedData = JSON.parse(aiSuggestedPlanJSON);

        const fieldsToUpdate: (keyof PlanFormData)[] = [
            'name', 'description', 'duration', 'goal', 'targetAudience',
            'ageMin', 'ageMax', 'price', 'isPublished'
        ];

        fieldsToUpdate.forEach(key => {
            if (suggestedData.hasOwnProperty(key)) {
                form.setValue(key, suggestedData[key] as any, { shouldValidate: true, shouldDirty: true });
            }
        });

        if (suggestedData.hasOwnProperty('imageUrl') && typeof suggestedData.imageUrl === 'string') {
            setImagePreview(suggestedData.imageUrl);
            form.setValue('imageUrl', suggestedData.imageUrl, { shouldValidate: true, shouldDirty: true });
            setPlanImageFile(null);
            setMarkImageForRemoval(false);
        }

        if (suggestedData.hasOwnProperty('bmiCategories') && Array.isArray(suggestedData.bmiCategories)) {
            const validBmiCategories = suggestedData.bmiCategories.filter((cat: string) =>
                ACTUAL_PLAN_BMI_CATEGORIES.includes(cat as PlanSpecificBMICategory)
            );
            form.setValue('bmiCategories', validBmiCategories as PlanSpecificBMICategory[], { shouldValidate: true, shouldDirty: true });
        } else if (suggestedData.hasOwnProperty('bmiCategories')) {
             console.warn("AI suggested 'bmiCategories' but it was not an array:", suggestedData.bmiCategories);
        }

        if (suggestedData.hasOwnProperty('exercises') && Array.isArray(suggestedData.exercises)) {
            const formattedExercises = suggestedData.exercises.map((ex: any) => ({
                name: ex.name || ex.exerciseName || "",
                dayOfWeek: ex.dayOfWeek || ex.day || "Monday",
                sets: typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets) || 3,
                reps: ex.reps || "",
                instructions: ex.instructions || "",
            }));
            form.setValue('exercises', formattedExercises, { shouldValidate: true, shouldDirty: true });
        } else if (suggestedData.hasOwnProperty('exercises')) {
            console.warn("AI suggested 'exercises' but it was not an array:", suggestedData.exercises);
        }

        toast({ title: "AI Suggestions Applied", description: "The form has been updated. Please review and save." });
    } catch (error) {
        console.error("Error applying AI suggestions:", error);
        toast({ title: "Application Failed", description: "Could not apply AI suggestions. The JSON might be invalid or not match the expected plan structure.", variant: "destructive" });
    } finally {
        setIsApplyingSuggestions(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{initialData ? "Edit Fitness Plan" : "Create New Fitness Plan"}</CardTitle>
            <CardDescription>
              {initialData ? "Update the details of your fitness plan." : "Fill in the details to create a new fitness plan for your clients."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <FormItem>
                <FormLabel>Plan Image (Optional)</FormLabel>
                <div className="flex items-center gap-4">
                    {imagePreview ? (
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-md overflow-hidden border group">
                        <NextImage src={imagePreview} alt="Plan image preview" fill className="object-cover" />
                         <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleRemoveImage}
                            aria-label="Remove image"
                          >
                            <XCircle className="h-5 w-5"/>
                        </Button>
                        </div>
                    ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-md border border-dashed flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
                            <UploadCloud className="h-10 w-10 mb-2"/>
                            <span>No Image</span>
                        </div>
                    )}
                    <div className="flex-grow">
                        <FormControl>
                            <Input
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleImageFileChange}
                                className="text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </FormControl>
                        <FormDescription className="mt-1 text-xs">Max 5MB. PNG, JPG, WEBP accepted. This will replace any existing image.</FormDescription>
                    </div>
                </div>
                 <FormMessage>{form.formState.errors.imageUrl?.message}</FormMessage>
            </FormItem>

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
                  <FormLabel>Price (INR)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="0 for free" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ageMin" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Min Age</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 18" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="ageMax" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Max Age</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 65" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)}/></FormControl>
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
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary"/>
                        Exercises
                    </CardTitle>
                    <Dialog open={showSuggestDialog} onOpenChange={setShowSuggestDialog}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm">
                                <Sparkles className="mr-2 h-4 w-4"/> AI Suggestions
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>AI Plan Modification Suggestions</DialogTitle>
                                <DialogDescription>
                                    Describe how you'd like to modify the current plan, and the AI will provide suggestions.
                                    The current plan details (name, description, exercises, etc.) will be sent to the AI.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="modificationRequest">Your Modification Request:</Label>
                                    <Textarea
                                        id="modificationRequest"
                                        value={modificationRequest}
                                        onChange={(e) => setModificationRequest(e.target.value)}
                                        placeholder="e.g., Make this plan more suitable for advanced users by adding heavier compound lifts, or shorten the duration to 2 weeks focusing on HIIT."
                                        rows={4}
                                        className="mt-1"
                                    />
                                </div>
                                <Button onClick={handleRequestAISuggestions} disabled={isSuggesting || !modificationRequest.trim()} className="w-full sm:w-auto">
                                    {isSuggesting ? "Getting Suggestions..." : <><Wand2 className="mr-2 h-4 w-4" /> Get AI Suggestions</>}
                                </Button>
                                {aiSuggestedPlanTextual && (
                                    <div className="mt-4 space-y-2">
                                        <Label htmlFor="aiSuggestedPlanTextualOutput">AI Suggested Plan (Narrative):</Label>
                                        <Textarea
                                            id="aiSuggestedPlanTextualOutput"
                                            value={aiSuggestedPlanTextual}
                                            readOnly
                                            rows={8}
                                            className="mt-1 font-sans text-sm bg-muted/50"
                                        />
                                         <Button variant="outline" size="sm" className="mt-1" onClick={() => navigator.clipboard.writeText(aiSuggestedPlanTextual || "")}>
                                            Copy Narrative Plan
                                        </Button>
                                    </div>
                                )}
                                {aiSuggestedPlanJSON && (
                                    <div className="mt-4 space-y-2">
                                        <Label htmlFor="aiSuggestedPlanJSONOutput">AI Suggested Plan (JSON):</Label>
                                        <Textarea
                                            id="aiSuggestedPlanJSONOutput"
                                            value={aiSuggestedPlanJSON}
                                            readOnly
                                            rows={10}
                                            className="mt-1 font-mono text-xs bg-muted/50"
                                        />
                                        <div className="flex gap-2 mt-1">
                                            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(aiSuggestedPlanJSON || "")}>
                                                Copy JSON
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={handleApplyAISuggestions}
                                                disabled={isApplyingSuggestions || !aiSuggestedPlanJSON.startsWith('{') }
                                            >
                                                {isApplyingSuggestions ? "Applying..." : <><DownloadCloud className="mr-2 h-4 w-4"/> Apply to Form</>}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setShowSuggestDialog(false)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
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
                    key={field.id}
                    control={form.control}
                    index={index}
                    onRemoveExercise={remove}
                />
                ))}
                <Button type="button" variant="outline" onClick={handleAddExercise} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Exercise
                </Button>
            </CardContent>
         </Card>

        <div className="flex justify-end pt-6 border-t">
            <Button type="submit" disabled={parentIsSubmitting || localIsSubmitting} size="lg" className="w-full sm:w-auto">
                <Save className="mr-2 h-5 w-5" />
                {(parentIsSubmitting || localIsSubmitting) ? "Saving..." : submitButtonText}
            </Button>
        </div>
      </form>
    </Form>
  );
};

export default PlanForm;
