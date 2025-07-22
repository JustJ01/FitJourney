
"use client";

import { useState } from 'react';
import type { AIPlanRequest, AIGeneratedPlan } from '@/types';
import AIPlanForm from '@/components/ai/AIPlanForm';
import GeneratedPlanView from '@/components/ai/GeneratedPlanView';
import { generatePersonalizedPlan, GeneratePersonalizedPlanOutput } from '@/ai/flows/generate-personalized-plan';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AIPlanGeneratorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AIPlanRequest) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to generate an AI plan." });
      router.push('/login?redirect=/ai-generator');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null); 
    try {
      const result: GeneratePersonalizedPlanOutput = await generatePersonalizedPlan(data);
      if (result && result.plan) {
        setGeneratedPlan(result.plan);
        toast({ title: "Plan Generated!", description: "Your personalized AI fitness plan is ready." });
      } else {
        throw new Error("AI did not return a valid plan structure.");
      }
    } catch (err) {
      console.error("AI Plan Generation Error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during plan generation.";
      setError(errorMessage);
      toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedPlan(null);
    // Ideally, you might want to re-submit the form with the same data or clear it.
    // For now, it just clears the plan, user can submit form again.
  }

  return (
    <div className="space-y-8">
      <AIPlanForm 
        onSubmit={handleSubmit} 
        isLoading={isLoading}
        isLoggedIn={!!user}
      />
      {error && (
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Generating Plan</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {generatedPlan && <GeneratedPlanView plan={generatedPlan} onRegenerate={handleRegenerate} />}
    </div>
  );
}
