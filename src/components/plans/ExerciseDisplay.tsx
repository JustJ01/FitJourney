
"use client";

import type { Exercise } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Repeat, Layers, LineChart, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/button';
import { useState } from 'react';
import LogProgressDialog from './LogProgressDialog';

interface ExerciseDisplayProps {
  exercises: Exercise[];
}

const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({ exercises }) => {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

  const handleOpenLogDialog = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsLogDialogOpen(true);
  };
  
  if (!exercises || exercises.length === 0) {
    return <p className="text-muted-foreground">No exercises listed for this plan yet.</p>;
  }

  // Group exercises by day
  const exercisesByDay: Record<string, Exercise[]> = exercises.reduce((acc, ex) => {
    const day = ex.dayOfWeek || 'Unassigned';
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(ex);
    return acc;
  }, {} as Record<string, Exercise[]>);
  
  const orderedDays = Object.keys(exercisesByDay).sort((a, b) => {
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Daily", "Unassigned"];
    return daysOrder.indexOf(a) - daysOrder.indexOf(b);
  });


  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            Workout Schedule
          </CardTitle>
          <CardDescription>Detailed exercises for each day of the plan. Members can log their progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(exercisesByDay).length > 0 ? (
            <Accordion type="multiple" defaultValue={orderedDays.length > 0 ? [orderedDays[0]] : []} className="w-full">
              {orderedDays.map((day) => (
                <AccordionItem value={day} key={day}>
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary">
                    {day}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-4 pl-4 border-l-2 border-primary/30 ml-2">
                      {exercisesByDay[day].map((exercise) => (
                        <li key={exercise.id} className="py-3 rounded-md flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-md text-foreground">{exercise.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Layers className="h-4 w-4 text-accent" /> Sets: {exercise.sets}
                              </span>
                              <span className="flex items-center gap-1">
                                <Repeat className="h-4 w-4 text-accent" /> Reps: {exercise.reps}
                              </span>
                            </div>
                            {exercise.instructions && (
                              <p className="mt-1 text-xs text-foreground/70 italic">
                                Instructions: {exercise.instructions}
                              </p>
                            )}
                          </div>
                          {user?.role === 'member' && (
                            <Button variant="outline" size="sm" onClick={() => handleOpenLogDialog(exercise)}>
                              <LineChart className="mr-2 h-4 w-4" />
                              Log Progress
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground p-4 text-center">This plan does not have any exercises listed yet.</p>
          )}
        </CardContent>
      </Card>
      {selectedExercise && (
        <LogProgressDialog 
          isOpen={isLogDialogOpen}
          onOpenChange={setIsLogDialogOpen}
          exercise={selectedExercise}
        />
      )}
    </>
  );
};

export default ExerciseDisplay;
