
"use client";

import { useState } from 'react';
import type { ProgressEntry } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { deleteProgressEntry } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dumbbell, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

interface PlanHistoryLogProps {
  entries: ProgressEntry[];
  onDeleteEntry: (entryId: string) => void;
}

export default function PlanHistoryLog({ entries, onDeleteEntry }: PlanHistoryLogProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (entryId: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to delete entries.", variant: "destructive" });
      return;
    }
    setIsDeleting(entryId);
    try {
      await deleteProgressEntry(user.id, entryId);
      onDeleteEntry(entryId); // Parent component will show toast
    } catch (error) {
      console.error("Failed to delete progress entry:", error);
      toast({ title: "Error", description: "Could not delete the entry.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Your Log For This Plan
        </CardTitle>
        <CardDescription>A complete history of your logged workouts for this specific plan.</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Metrics</TableHead>
                <TableHead className="text-right">Calories</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" /> {entry.exerciseName}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {entry.weight != null && <Badge variant="outline">Wt: {entry.weight}kg</Badge>}
                      {entry.reps != null && <Badge variant="outline">Reps: {entry.reps}</Badge>}
                      {entry.sets != null && <Badge variant="outline">Sets: {entry.sets}</Badge>}
                      {entry.duration != null && <Badge variant="outline">Time: {entry.duration}min</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.caloriesBurned != null && (
                      <Badge variant="secondary" className="font-mono">{entry.caloriesBurned} kcal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isDeleting === entry.id} aria-label="Delete entry">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this log for "{entry.exerciseName}" on {format(new Date(entry.date), 'MMM d, yyyy')}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(entry.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting === entry.id}
                          >
                            {isDeleting === entry.id ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No progress has been logged for this plan yet.</p>
            <p className="text-sm">Use the "Log Progress" button on an exercise to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
