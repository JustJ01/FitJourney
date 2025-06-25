
'use server';
/**
 * @fileOverview An AI flow to estimate calories burned during a workout.
 *
 * - estimateCalories - A function that estimates calories burned.
 * - CalorieEstimationInput - The input type for the estimateCalories function.
 * - CalorieEstimationOutput - The return type for the estimateCalories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalorieEstimationInputSchema = z.object({
  userProfile: z.object({
    age: z.number().describe("User's age in years."),
    weight: z.number().describe("User's weight in kilograms."),
    height: z.number().describe("User's height in centimeters."),
    gender: z.enum(['male', 'female', 'other']).describe("User's gender."),
  }),
  workoutEntry: z.object({
    exerciseName: z.string().describe("Name of the exercise performed."),
    duration: z.number().optional().describe("Duration of the exercise in minutes. Prioritize this for cardio-like exercises."),
    weight: z.number().optional().describe("Weight lifted in kilograms for resistance exercises."),
    reps: z.number().optional().describe("Number of repetitions per set."),
    sets: z.number().optional().describe("Number of sets performed."),
  })
});
export type CalorieEstimationInput = z.infer<typeof CalorieEstimationInputSchema>;

const CalorieEstimationOutputSchema = z.object({
  estimatedCalories: z.number().int().describe("The estimated number of calories burned for the workout session, as a whole number."),
});
export type CalorieEstimationOutput = z.infer<typeof CalorieEstimationOutputSchema>;

export async function estimateCalories(input: CalorieEstimationInput): Promise<CalorieEstimationOutput> {
  return estimateCaloriesFlow(input);
}

const prompt = ai.definePrompt({
    name: 'estimateCaloriesPrompt',
    input: {schema: CalorieEstimationInputSchema},
    output: {schema: CalorieEstimationOutputSchema},
    prompt: `You are a highly-advanced fitness and physiology AI. Your task is to provide an accurate estimate of the calories burned for a specific workout session based on the user's profile and the workout details.

    User Profile:
    - Age: {{{userProfile.age}}} years
    - Weight: {{{userProfile.weight}}} kg
    - Height: {{{userProfile.height}}} cm
    - Gender: {{{userProfile.gender}}}

    Workout Entry:
    - Exercise: {{{workoutEntry.exerciseName}}}
    {{#if workoutEntry.duration}}- Duration: {{{workoutEntry.duration}}} minutes{{/if}}
    {{#if workoutEntry.weight}}- Weight Lifted: {{{workoutEntry.weight}}} kg{{/if}}
    {{#if workoutEntry.reps}}- Repetitions: {{{workoutEntry.reps}}} per set{{/if}}
    {{#if workoutEntry.sets}}- Sets: {{{workoutEntry.sets}}}{{/if}}

    Analyze these factors to provide the best possible estimate for the calories burned. Consider the type of exercise (e.g., 'Squats' is a high-intensity compound movement, 'Bicep Curls' is an isolation movement). Consider that weightlifting for a certain duration burns calories differently than cardio for the same duration. Base your estimation on established metabolic formulas (like METs) but use your advanced knowledge to adjust for the specifics provided.

    Return ONLY the estimated calories in the requested JSON format, as an integer.
    `,
});

const estimateCaloriesFlow = ai.defineFlow(
  {
    name: 'estimateCaloriesFlow',
    inputSchema: CalorieEstimationInputSchema,
    outputSchema: CalorieEstimationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
