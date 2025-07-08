
"use client";

import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { DAYS_OF_WEEK } from '@/lib/constants';
import { Textarea } from '../ui/textarea';
import React from 'react';

interface ExerciseInputProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  index: number;
  onRemoveExercise: (index: number) => void;
  
}

const ExerciseInput: React.FC<ExerciseInputProps> = React.memo(({ control, index, onRemoveExercise }) => {

  const handleRemove = () => {
    onRemoveExercise(index);
  };

  const nameFieldName = `exercises.${index}.name` as FieldPath<FieldValues>;
  const dayOfWeekFieldName = `exercises.${index}.dayOfWeek` as FieldPath<FieldValues>;
  const setsFieldName = `exercises.${index}.sets` as FieldPath<FieldValues>;
  const repsFieldName = `exercises.${index}.reps` as FieldPath<FieldValues>;
  const instructionsFieldName = `exercises.${index}.instructions` as FieldPath<FieldValues>;

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/20 relative shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={control}
          name={nameFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`exerciseName-${index}`} className="text-xs">Exercise Name</FormLabel>
              <FormControl>
                <Input
                  id={`exerciseName-${index}`}
                  placeholder="e.g., Squats"
                  {...field}
                  className="text-sm h-9"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={dayOfWeekFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`dayOfWeek-${index}`} className="text-xs">Day of Week</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger id={`dayOfWeek-${index}`} className="text-sm h-9">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day} value={day} className="text-sm">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <FormField
          control={control}
          name={setsFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`sets-${index}`} className="text-xs">Sets</FormLabel>
              <FormControl>
                <Input
                  id={`sets-${index}`}
                  type="number"
                  placeholder="e.g., 3"
                  {...field}
                  onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                  className="text-sm h-9"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={repsFieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor={`reps-${index}`} className="text-xs">Reps</FormLabel>
              <FormControl>
                <Input
                  id={`reps-${index}`}
                  placeholder="e.g., 8-12 or To Failure"
                  {...field}
                  className="text-sm h-9"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name={instructionsFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor={`instructions-${index}`} className="text-xs">Instructions (Optional)</FormLabel>
            <FormControl>
              <Textarea
                id={`instructions-${index}`}
                placeholder="e.g., Keep back straight."
                {...field}
                className="text-sm min-h-[60px]"
                rows={2}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleRemove}
        className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-7 w-7"
        aria-label="Remove exercise"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

ExerciseInput.displayName = 'ExerciseInput';

export default ExerciseInput;
