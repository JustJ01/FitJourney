
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
  modifiedPlanJSON: z
    .string()
    .describe('The modified fitness plan in JSON format. This should be a complete JSON object representing the updated plan.'),
  modificationSummary: z
    .string()
    .describe('A human-readable summary of the changes made and a brief overview of the modified plan. This should be a textual description, not JSON.'),
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

Please provide two outputs:
1.  The full modified plan in valid JSON format under the key 'modifiedPlanJSON'.
2.  A human-readable summary of the key modifications and an overview of the new plan structure under the key 'modificationSummary'.

Ensure the output is a single JSON object containing these two keys.`,
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

