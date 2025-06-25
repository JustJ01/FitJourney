
"use client";

import type { ProgressEntry } from '@/types';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, subDays, isAfter, startOfWeek, differenceInCalendarDays } from 'date-fns';
import { Dumbbell, TrendingUp, Calendar, Flame, Trophy, Clock, BarChartHorizontalBig, Zap, ArrowLeft, Trash2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { Button } from '../ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { deleteProgressEntry } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ProgressOverviewProps {
  entries: ProgressEntry[];
}

const CustomTooltip = ({ active, payload, label, unit = 'kg' }: any) => {
    if (active && payload && payload.length) {
      const formattedLabel = payload[0].payload.week || format(new Date(label), 'MMM d, yyyy');
      return (
        <div className="p-2 bg-background border rounded-md shadow-lg text-sm">
          <p className="font-bold">{formattedLabel}</p>
          <p>{`${payload[0].name}: ${payload[0].value.toLocaleString()} ${unit}`}</p>
        </div>
      );
    }
    return null;
};


// Function to calculate streaks
const calculateStreaks = (dates: Date[]) => {
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };
    
    const sortedUniqueDates = [...new Set(dates.map(d => d.toISOString().split('T')[0]))]
        .map(d => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());

    if (sortedUniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < sortedUniqueDates.length; i++) {
        if (i === 0) {
            currentStreak = 1;
        } else {
            const diff = differenceInCalendarDays(sortedUniqueDates[i], sortedUniqueDates[i-1]);
            if (diff === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }
    }
    longestStreak = Math.max(longestStreak, currentStreak);
    
    const lastWorkoutDate = sortedUniqueDates[sortedUniqueDates.length - 1];
    const today = new Date();
    const isLastWorkoutRecent = differenceInCalendarDays(today, lastWorkoutDate) <= 1;

    return {
        currentStreak: isLastWorkoutRecent ? currentStreak : 0,
        longestStreak: longestStreak,
    };
};

export const ProgressOverview: React.FC<ProgressOverviewProps> = ({ entries }) => {
  const { user } = useAuth();
  const [currentEntries, setCurrentEntries] = useState(entries);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    setCurrentEntries(entries);
  }, [entries]);

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to delete entries.", variant: "destructive" });
      return;
    }
    setIsDeleting(entryId);
    try {
      await deleteProgressEntry(user.id, entryId);
      setCurrentEntries(prev => prev.filter(e => e.id !== entryId));
      toast({ title: "Success", description: "Activity log deleted." });
    } catch (error) {
      console.error("Failed to delete progress entry:", error);
      toast({ title: "Error", description: "Could not delete the entry.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };


  const { 
    volumeChartData, 
    durationChartData,
    caloriesChartData,
    weeklyTotalVolume,
    weeklyTotalDuration,
    weeklyTotalCalories,
    personalBests,
    streaks,
    consistencyChartData,
  } = useMemo(() => {
    const dataByDate: { [key: string]: { volume: number, duration: number, calories: number, sessions: number } } = {};
    let calculatedWeeklyTotalVolume = 0;
    let calculatedWeeklyTotalDuration = 0;
    let calculatedWeeklyTotalCalories = 0;
    const sevenDaysAgo = subDays(new Date(), 7);
    const exerciseStats: { [key: string]: { count: number, maxWeight: number } } = {};
    const workoutDates: Date[] = [];

    currentEntries.forEach(entry => {
      const date = new Date(entry.date);
      workoutDates.push(date);
      const dateString = format(date, 'yyyy-MM-dd');
      const volume = (entry.weight || 0) * (entry.reps || 0) * (entry.sets || 0);
      const duration = entry.duration || 0;
      const calories = entry.caloriesBurned || 0;
      
      if (!dataByDate[dateString]) {
          dataByDate[dateString] = { volume: 0, duration: 0, calories: 0, sessions: 1 };
      }
      dataByDate[dateString].volume += volume;
      dataByDate[dateString].duration += duration;
      dataByDate[dateString].calories += calories;

      if (isAfter(date, sevenDaysAgo)) {
        calculatedWeeklyTotalVolume += volume;
        calculatedWeeklyTotalDuration += duration;
        calculatedWeeklyTotalCalories += calories;
      }
      
      if (!exerciseStats[entry.exerciseName]) {
          exerciseStats[entry.exerciseName] = { count: 0, maxWeight: 0 };
      }
      exerciseStats[entry.exerciseName].count++;
      if (entry.weight && entry.weight > exerciseStats[entry.exerciseName].maxWeight) {
          exerciseStats[entry.exerciseName].maxWeight = entry.weight;
      }
    });
    
    const topExercises = Object.entries(exerciseStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.maxWeight - a.maxWeight);


    const processedVolumeChartData = [];
    const processedDurationChartData = [];
    const processedCaloriesChartData = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateString = format(date, 'yyyy-MM-dd');
      processedVolumeChartData.push({ date: dateString, volume: dataByDate[dateString]?.volume || 0 });
      processedDurationChartData.push({ date: dateString, duration: dataByDate[dateString]?.duration || 0 });
      processedCaloriesChartData.push({ date: dateString, calories: dataByDate[dateString]?.calories || 0 });
    }
    
    const weeklyConsistency: { [key: string]: number } = {};
    for (let i=0; i<4; i++) {
      const weekStart = startOfWeek(subDays(new Date(), i*7), {weekStartsOn: 1});
      const weekLabel = `${format(weekStart, 'MMM d')}`;
      weeklyConsistency[weekLabel] = 0;
    }
    [...new Set(workoutDates.map(d => d.toISOString().split('T')[0]))].forEach(dateStr => {
        const date = new Date(dateStr);
        const weekStart = startOfWeek(date, {weekStartsOn: 1});
        const weekLabel = `${format(weekStart, 'MMM d')}`;
        if(weeklyConsistency.hasOwnProperty(weekLabel)) {
            weeklyConsistency[weekLabel]++;
        }
    });
    const processedConsistencyData = Object.entries(weeklyConsistency)
        .map(([week, sessions]) => ({week, sessions}))
        .reverse();

    const calculatedStreaks = calculateStreaks(workoutDates);

    return { 
        volumeChartData: processedVolumeChartData, 
        durationChartData: processedDurationChartData,
        caloriesChartData: processedCaloriesChartData,
        weeklyTotalVolume: calculatedWeeklyTotalVolume,
        weeklyTotalDuration: calculatedWeeklyTotalDuration,
        weeklyTotalCalories: calculatedWeeklyTotalCalories,
        personalBests: topExercises,
        streaks: calculatedStreaks,
        consistencyChartData: processedConsistencyData,
    };
  }, [currentEntries]);

  const recentEntries = useMemo(() => {
    return currentEntries.slice(0, 10);
  }, [currentEntries]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary"/>
                This Week's Summary
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
             <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Volume Lifted</p>
                <p className="text-2xl font-bold text-primary">{weeklyTotalVolume.toLocaleString()} kg</p>
             </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Time Exercising</p>
                <p className="text-2xl font-bold text-primary">{weeklyTotalDuration} min</p>
             </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Calories Burned</p>
                <p className="text-2xl font-bold text-primary">{weeklyTotalCalories.toLocaleString()}</p>
             </div>
             <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Workout Streak</p>
                <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                    <Flame className="h-6 w-6"/> {streaks.currentStreak} day{streaks.currentStreak !== 1 && 's'}
                </p>
             </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChartHorizontalBig className="h-5 w-5 text-primary"/>Workout Consistency</CardTitle>
              <CardDescription>Number of workout sessions per week for the last 4 weeks.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={consistencyChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="week" type="category" width={80}/>
                        <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<CustomTooltip unit="sessions"/>} />
                        <Bar 
                            dataKey="sessions" 
                            name="Sessions"
                            fill="hsl(var(--primary))" 
                            radius={[0, 4, 4, 0]}
                            barSize={35}
                         />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary"/>Personal Bests</CardTitle>
              <CardDescription>Your heaviest lifts for your most frequent exercises.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 {personalBests.length > 0 ? (
                    <ul className="space-y-3">
                        {personalBests.map(pb => (
                            <li key={pb.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                <span className="font-medium">{pb.name}</span>
                                <Badge variant="secondary" className="text-base">{pb.maxWeight} kg</Badge>
                            </li>
                        ))}
                    </ul>
                 ) : (
                    <p className="text-muted-foreground text-center py-4">Log more workouts to see your personal bests!</p>
                 )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/profile/progress/personal-bests">
                  <Trophy className="mr-2 h-4 w-4" /> View All Personal Bests
                </Link>
              </Button>
            </CardFooter>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary"/>Total Volume Lifted (Last 30 Days)</CardTitle>
          <CardDescription>Visual representation of your total weight lifted per day. Hover over a bar for details.</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => format(new Date(d), 'd MMM')}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval={2}
                    />
                    <YAxis 
                        domain={[0, (dataMax: number) => dataMax + 500]}
                        tickFormatter={(value) => value > 0 ? `${value / 1000}k` : '0'}
                        label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<CustomTooltip unit="kg"/>}/>
                    <Legend verticalAlign="top" height={36}/>
                    <Bar 
                        dataKey="volume" 
                        name="Total Volume"
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary"/>Calories Burned (Last 30 Days)</CardTitle>
          <CardDescription>Estimated calories burned per day from logged workouts.</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caloriesChartData} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => format(new Date(d), 'd MMM')}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval={2}
                    />
                    <YAxis 
                        domain={[0, (dataMax: number) => dataMax + 50]}
                        label={{ value: 'Calories', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<CustomTooltip unit="kcal"/>}/>
                    <Legend verticalAlign="top" height={36}/>
                    <Bar 
                        dataKey="calories" 
                        name="Calories Burned"
                        fill="hsl(var(--accent))" 
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/>Time Spent Exercising (Last 30 Days)</CardTitle>
          <CardDescription>Total minutes spent working out per day.</CardDescription>
        </CardHeader>
        <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={durationChartData} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                        <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        tickFormatter={(d) => format(new Date(d), 'd MMM')}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                        interval={2}
                    />
                    <YAxis 
                        label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip unit="min"/>}/>
                    <Legend verticalAlign="top" height={36}/>
                    <Area 
                        type="monotone" 
                        dataKey="duration" 
                        name="Total Duration"
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorDuration)" />
                </AreaChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary"/>Recent Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
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
              {recentEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="font-medium flex items-center gap-2"><Dumbbell className="h-4 w-4 text-muted-foreground"/> {entry.exerciseName}</TableCell>
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
                        <Badge variant="secondary" className="font-mono">
                            {entry.caloriesBurned} kcal
                        </Badge>
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
                            This action cannot be undone. This will permanently delete this progress log entry for "{entry.exerciseName}" on {format(new Date(entry.date), 'MMM d, yyyy')}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
