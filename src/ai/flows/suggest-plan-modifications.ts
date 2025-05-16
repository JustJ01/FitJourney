'use server';

/**
 * @fileOverview Suggests modifications to an existing fitness plan based on trainer feedback.
 *
 * - suggestPlanModifications - A function that suggests modifications to a fitness plan.
 * - SuggestPlanModificationsInput - The input type for the suggestPlanModifications function.
 * - SuggestPlanModificationsOutput - The return type for the suggestPlanModifications function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPlanModificationsInputSchema = z.object({
  existingPlan: z.string().describe('The existing fitness plan in JSON format.'),
  modificationRequest: z
    .string()
    .describe(
      'The requested modifications to the plan (e.g., make it harder, use less equipment).'
    ),
});
export type SuggestPlanModificationsInput = z.infer<
  typeof SuggestPlanModificationsInputSchema
>;

const SuggestPlanModificationsOutputSchema = z.object({
  modifiedPlan: z
    .string()
    .describe('The modified fitness plan in JSON format.'),
});
export type SuggestPlanModificationsOutput = z.infer<
  typeof SuggestPlanModificationsOutputSchema
>;

export async function suggestPlanModifications(
  input: SuggestPlanModificationsInput
): Promise<SuggestPlanModificationsOutput> {
  return suggestPlanModificationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPlanModificationsPrompt',
  input: {schema: SuggestPlanModificationsInputSchema},
  output: {schema: SuggestPlanModificationsOutputSchema},
  prompt: `You are a fitness expert. Given an existing fitness plan and a
    modification request, generate a modified fitness plan that satisfies the request.

Existing Plan:
{{{existingPlan}}}

Modification Request:
{{{modificationRequest}}}

Modified Plan (in JSON format):`,
});

const suggestPlanModificationsFlow = ai.defineFlow(
  {
    name: 'suggestPlanModificationsFlow',
    inputSchema: SuggestPlanModificationsInputSchema,
    outputSchema: SuggestPlanModificationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
