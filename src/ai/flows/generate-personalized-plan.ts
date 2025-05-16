// use server'
'use server';

/**
 * @fileOverview Generates a personalized fitness plan based on user input.
 *
 * - generatePersonalizedPlan - A function that generates a personalized fitness plan.
 * - GeneratePersonalizedPlanInput - The input type for the generatePersonalizedPlan function.
 * - GeneratePersonalizedPlanOutput - The return type for the generatePersonalizedPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedPlanInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
  fitnessGoal: z.string().describe('The fitness goal of the user, e.g., weight loss, muscle gain, endurance.'),
  bmi: z.number().describe('The BMI of the user.'),
  experienceLevel: z.string().describe('The experience level of the user, e.g., beginner, intermediate, advanced.'),
});
export type GeneratePersonalizedPlanInput = z.infer<typeof GeneratePersonalizedPlanInputSchema>;

const GeneratePersonalizedPlanOutputSchema = z.object({
  plan: z.object({
    goal: z.string().describe('The overall goal of the fitness plan.'),
    duration: z.string().describe('The duration of the fitness plan, e.g., 4 weeks, 8 weeks.'),
    exercises: z.array(
      z.object({
        day: z.string().describe('The day of the week for the exercise.'),
        exerciseName: z.string().describe('The name of the exercise.'),
        sets: z.number().describe('The number of sets for the exercise.'),
        reps: z.string().describe('The number of reps for the exercise, or a description like "until failure".'),
      })
    ).describe('A list of sample exercises for the fitness plan.'),
  }).describe('The generated fitness plan.'),
});
export type GeneratePersonalizedPlanOutput = z.infer<typeof GeneratePersonalizedPlanOutputSchema>;

export async function generatePersonalizedPlan(input: GeneratePersonalizedPlanInput): Promise<GeneratePersonalizedPlanOutput> {
  return generatePersonalizedPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedPlanPrompt',
  input: {schema: GeneratePersonalizedPlanInputSchema},
  output: {schema: GeneratePersonalizedPlanOutputSchema},
  prompt: `You are a personal fitness trainer who will create a personalized fitness plan for the user.

  The user will provide their age, fitness goal, BMI, and experience level. You will generate a structured plan with goal, duration, and sample exercises tailored to their needs.

  Age: {{{age}}}
  Fitness Goal: {{{fitnessGoal}}}
  BMI: {{{bmi}}}
  Experience Level: {{{experienceLevel}}}

  Please generate a fitness plan with a goal, duration, and a sample list of exercises for each day of the week.
  Make sure to output the plan in the correct JSON format.`,
});

const generatePersonalizedPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedPlanFlow',
    inputSchema: GeneratePersonalizedPlanInputSchema,
    outputSchema: GeneratePersonalizedPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
