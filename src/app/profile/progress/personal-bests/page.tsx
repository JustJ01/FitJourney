
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAllUserProgress } from '@/lib/data';
import type { ProgressEntry } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Trophy, BarChart, Search, SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface PersonalBest {
  name: string;
  maxWeight: number;
}

export default function PersonalBestsPage() {
  const { user } = useAuth();
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      setLoading(true);
      getAllUserProgress(user.id)
        .then(data => {
          setProgressEntries(data);
        })
        .catch(err => {
          console.error("Failed to fetch progress for personal bests:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const allPersonalBests = useMemo(() => {
    if (!progressEntries.length) return [];

    const exerciseStats: { [key: string]: { maxWeight: number } } = {};

    progressEntries.forEach(entry => {
      if (entry.weight === undefined || entry.weight === null) return;

      if (!exerciseStats[entry.exerciseName]) {
        exerciseStats[entry.exerciseName] = { maxWeight: entry.weight };
      } else if (entry.weight > exerciseStats[entry.exerciseName].maxWeight) {
        exerciseStats[entry.exerciseName].maxWeight = entry.weight;
      }
    });

    return Object.entries(exerciseStats)
      .map(([name, stats]) => ({ name, maxWeight: stats.maxWeight }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [progressEntries]);
  
  const filteredPersonalBests = useMemo(() => {
    if (!searchTerm) {
      return allPersonalBests;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return allPersonalBests.filter(pb =>
      pb.name.toLowerCase().includes(lowercasedFilter)
    );
  }, [allPersonalBests, searchTerm]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                All Personal Bests
              </CardTitle>
              <CardDescription>
                Your heaviest recorded lift for every exercise you've logged.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/profile/progress">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Progress Overview
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for an exercise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full md:w-1/2 lg:w-1/3"
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPersonalBests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise</TableHead>
                  <TableHead className="text-right">Heaviest Lift</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersonalBests.map(pb => (
                  <TableRow key={pb.name}>
                    <TableCell className="font-medium">{pb.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-base font-semibold">{pb.maxWeight} kg</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <Alert>
                {searchTerm ? <SearchX className="h-4 w-4" /> : <BarChart className="h-4 w-4" />}
                <AlertTitle>{searchTerm ? "No Exercises Found" : "No Personal Bests Yet"}</AlertTitle>
                <AlertDescription>
                  {searchTerm
                    ? "No exercises match your search term. Try another search."
                    : "Log some workouts with weight to see your personal bests appear here!"}
                </AlertDescription>
              </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

