
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
  availableEquipment: z.string().optional().describe('The equipment available to the user, e.g., dumbbells, resistance bands, full gym.'),
  workoutFrequency: z.string().optional().describe('The preferred number of workout days per week, e.g., 3 days, 5 days.'),
  muscleFocus: z.string().optional().describe('Specific muscle groups or areas the user wants to focus on, e.g., upper body, legs, core.'),
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
        instructions: z.string().optional().describe('Brief instructions or tips for performing the exercise.'),
      })
    ).describe('A list of sample exercises for the fitness plan, including brief instructions for each.'),
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

  The user will provide their age, fitness goal, BMI, and experience level.
  {{#if availableEquipment}}They have the following equipment available: {{{availableEquipment}}}{{/if}}
  {{#if workoutFrequency}}They prefer to work out {{{workoutFrequency}}}{{/if}}
  {{#if muscleFocus}}They want to focus on {{{muscleFocus}}}{{/if}}
  You will generate a structured plan with goal, duration, and sample exercises tailored to their needs.

  User Profile:
  Age: {{{age}}}
  Fitness Goal: {{{fitnessGoal}}}
  BMI: {{{bmi}}}
  Experience Level: {{{experienceLevel}}}
  {{#if availableEquipment}}Available Equipment: {{{availableEquipment}}}{{/if}}
  {{#if workoutFrequency}}Preferred Workout Frequency: {{{workoutFrequency}}}{{/if}}
  {{#if muscleFocus}}Specific Muscle Focus: {{{muscleFocus}}}{{/if}}

  Please generate a fitness plan with a goal, duration, and a sample list of exercises for each day of the week. For each exercise, also provide brief instructions or tips for performing it.
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

