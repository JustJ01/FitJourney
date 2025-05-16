
"use client";

import type { AIGeneratedPlan } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarDays, Dumbbell, Layers, Repeat, Save, Sparkles, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { saveAIPlanAsNew } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';


interface GeneratedPlanViewProps {
  plan: AIGeneratedPlan | null;
  onRegenerate?: () => void; // Optional: if regeneration is needed
}

const GeneratedPlanView: React.FC<GeneratedPlanViewProps> = ({ plan, onRegenerate }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [planName, setPlanName] = useState(plan?.goal ? `AI: ${plan.goal}` : "AI Generated Plan");
  const [planDescription, setPlanDescription] = useState(plan?.goal ? `An AI generated plan focusing on ${plan.goal}. Duration: ${plan?.duration}.` : "Customizable AI generated plan.");

  if (!plan) {
    return null;
  }

  const handleSavePlan = async () => {
    if (!user || user.role !== 'trainer' || !plan) return;
    
    if(!planName.trim() || !planDescription.trim()){
      toast({ title: "Error", description: "Plan name and description are required to save.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const savedPlan = await saveAIPlanAsNew(plan, user.id, planName, planDescription);
      toast({
        title: "Plan Saved!",
        description: `${savedPlan.name} has been added to your drafts in the dashboard.`,
        action: <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/plans/${savedPlan.id}/edit`}>Edit Plan</Button>
      });
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Failed to save AI plan:", error);
      toast({ title: "Save Failed", description: "Could not save the plan. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Group exercises by day
  const exercisesByDay: Record<string, AIGeneratedPlan['exercises']> = plan.exercises.reduce((acc, ex) => {
    const day = ex.day || 'Unassigned'; // Handle cases where day might be missing
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(ex);
    return acc;
  }, {} as Record<string, AIGeneratedPlan['exercises']>);

  const orderedDays = Object.keys(exercisesByDay).sort((a, b) => {
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Daily", "Unassigned"];
    return daysOrder.indexOf(a) - daysOrder.indexOf(b);
  });


  return (
    <Card className="w-full shadow-xl mt-8">
      <CardHeader className="text-center">
         <div className="mx-auto bg-accent/10 text-accent p-3 rounded-full w-fit mb-2">
            <Sparkles className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">Your AI-Generated Fitness Plan</CardTitle>
        <CardDescription>Here's a personalized plan crafted by our AI. Review and save it if you're a trainer!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary"/>
                <p><strong className="font-medium">Goal:</strong> {plan.goal}</p>
            </div>
            <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary"/>
                <p><strong className="font-medium">Duration:</strong> {plan.duration}</p>
            </div>
        </div>

        <h3 className="text-xl font-semibold flex items-center gap-2 mt-4">
            <Dumbbell className="h-6 w-6 text-primary"/> Workout Schedule
        </h3>
        {Object.keys(exercisesByDay).length > 0 ? (
        <Accordion type="multiple" defaultValue={orderedDays.length > 0 ? [orderedDays[0]] : []} className="w-full">
          {orderedDays.map((day) => (
            <AccordionItem value={day} key={day}>
              <AccordionTrigger className="text-lg font-semibold hover:text-primary">{day}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-3 pl-4 border-l-2 border-primary/30 ml-2">
                  {exercisesByDay[day].map((exercise, index) => (
                    <li key={index} className="py-2 rounded-md">
                      <h4 className="font-medium text-md text-foreground">{exercise.exerciseName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                            <Layers className="h-4 w-4 text-accent" /> Sets: {exercise.sets}
                        </span>
                        <span className="flex items-center gap-1">
                            <Repeat className="h-4 w-4 text-accent" /> Reps: {exercise.reps}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        ) : (
            <p className="text-muted-foreground p-4 text-center">The AI did not generate specific exercises for this plan.</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
        {onRegenerate && (
          <Button variant="outline" onClick={onRegenerate} disabled={isSaving}>
            <Sparkles className="mr-2 h-4 w-4" /> Regenerate Plan
          </Button>
        )}
        {user?.role === 'trainer' && (
          <>
            <Button onClick={() => setShowSaveDialog(true)} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" /> {isSaving ? "Saving..." : "Save Plan to Dashboard"}
            </Button>
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save AI Generated Plan</DialogTitle>
                  <DialogDescription>
                    Provide a name and description for this plan. It will be saved as a draft in your dashboard.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label htmlFor="planName" className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <Input id="planName" value={planName} onChange={(e) => setPlanName(e.target.value)} className="mt-1"/>
                  </div>
                  <div>
                    <label htmlFor="planDescription" className="block text-sm font-medium text-gray-700">Plan Description</label>
                    <Textarea id="planDescription" value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} className="mt-1" rows={3}/>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
                  <Button onClick={handleSavePlan} disabled={isSaving || !planName.trim() || !planDescription.trim()}>
                    {isSaving ? "Saving..." : "Save as Draft"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default GeneratedPlanView;
