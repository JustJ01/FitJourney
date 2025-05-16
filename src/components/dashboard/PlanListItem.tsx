
"use client";

import type { Plan } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3, Trash2, Eye, EyeOff, CalendarDays, Target, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PlanListItemProps {
  plan: Plan;
  onDelete: (planId: string) => Promise<void>;
}

const PlanListItem: React.FC<PlanListItemProps> = ({ plan, onDelete }) => {
  
  const handleDelete = async () => {
    await onDelete(plan.id);
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <Badge variant={plan.isPublished ? "default" : "secondary"} className="capitalize">
            {plan.isPublished ? <><Eye className="mr-1 h-3 w-3"/>Published</> : <><EyeOff className="mr-1 h-3 w-3"/>Draft</>}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Duration: {plan.duration}</p>
        <p className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Goal: {plan.goal}</p>
        <p className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Audience: {plan.targetAudience}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/plans/${plan.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/plans/${plan.id}/edit`}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the plan "{plan.name}" and all its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Yes, delete plan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default PlanListItem;
