
"use client";

import type { Exercise } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface ExerciseInputProps {
  exercise: Partial<Omit<Exercise, 'id' | 'planId'>>; // Use partial for new/editing exercises
  index: number;
  onExerciseChange: (index: number, field: keyof Omit<Exercise, 'id' | 'planId'>, value: string | number) => void;
  onRemoveExercise: (index: number) => void;
}

const ExerciseInput: React.FC<ExerciseInputProps> = ({ exercise, index, onExerciseChange, onRemoveExercise }) => {
  const handleInputChange = (field: keyof Omit<Exercise, 'id' | 'planId'>, value: string | number) => {
    onExerciseChange(index, field, value);
  };

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/20 relative shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <Label htmlFor={`exerciseName-${index}`} className="text-xs">Exercise Name</Label>
                <Input
                    id={`exerciseName-${index}`}
                    placeholder="e.g., Squats"
                    value={exercise.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-sm h-9"
                />
            </div>
            <div>
                <Label htmlFor={`dayOfWeek-${index}`} className="text-xs">Day of Week</Label>
                <Select
                    value={exercise.dayOfWeek || ''}
                    onValueChange={(value) => handleInputChange('dayOfWeek', value)}
                >
                    <SelectTrigger id={`dayOfWeek-${index}`} className="text-sm h-9">
                    <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day} value={day} className="text-sm">{day}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            <div>
                <Label htmlFor={`sets-${index}`} className="text-xs">Sets</Label>
                <Input
                    id={`sets-${index}`}
                    type="number"
                    placeholder="e.g., 3"
                    value={exercise.sets || ''}
                    onChange={(e) => handleInputChange('sets', parseInt(e.target.value) || 0)}
                    className="text-sm h-9"
                />
            </div>
            <div>
                <Label htmlFor={`reps-${index}`} className="text-xs">Reps</Label>
                <Input
                    id={`reps-${index}`}
                    placeholder="e.g., 8-12 or To Failure"
                    value={exercise.reps || ''}
                    onChange={(e) => handleInputChange('reps', e.target.value)}
                    className="text-sm h-9"
                />
            </div>
        </div>
      <div>
        <Label htmlFor={`instructions-${index}`} className="text-xs">Instructions (Optional)</Label>
        <Textarea
            id={`instructions-${index}`}
            placeholder="e.g., Keep back straight."
            value={exercise.instructions || ''}
            onChange={(e) => handleInputChange('instructions', e.target.value)}
            className="text-sm min-h-[60px]"
            rows={2}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveExercise(index)}
        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-7 w-7"
        aria-label="Remove exercise"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ExerciseInput;
