
import { getPlanById, getTrainerById } from '@/lib/data';
import type { Plan, Trainer } from '@/types';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Target, BarChart3, Star, Users, DollarSign, AlertTriangle } from 'lucide-react';
import ExerciseDisplay from '@/components/plans/ExerciseDisplay';
import TrainerInfo from '@/components/plans/TrainerInfo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PlanDetailsPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PlanDetailsPageProps) {
  const plan = await getPlanById(params.id);
  if (!plan) {
    return { title: 'Plan Not Found' };
  }
  return {
    title: plan.name,
    description: plan.description,
  };
}

export default async function PlanDetailsPage({ params }: PlanDetailsPageProps) {
  const plan: Plan | undefined = await getPlanById(params.id);
  
  if (!plan) {
    notFound();
  }

  const trainer: Trainer | undefined = await getTrainerById(plan.trainerId);

  return (
    <div className="space-y-8">
      <article>
        <header className="mb-8">
          <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden shadow-xl mb-6">
            <Image
              src={`https://placehold.co/1200x400.png?text=${encodeURIComponent(plan.name)}`}
              alt={plan.name}
              layout="fill"
              objectFit="cover"
              priority
              data-ai-hint="fitness banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{plan.name}</h1>
                <p className="text-lg md:text-xl mt-1 opacity-90 max-w-2xl">{plan.description}</p>
            </div>
          </div>

          <Card className="shadow-lg -mt-16 relative z-10 mx-auto max-w-6xl">
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
              <div className="flex flex-col items-center">
                <Star className="h-8 w-8 text-yellow-400 mb-1 fill-current" />
                <span className="font-semibold text-lg">{plan.rating.toFixed(1)}/5</span>
                <span className="text-xs text-muted-foreground">Rating</span>
              </div>
              <div className="flex flex-col items-center">
                <CalendarDays className="h-8 w-8 text-primary mb-1" />
                <span className="font-semibold text-lg">{plan.duration}</span>
                <span className="text-xs text-muted-foreground">Duration</span>
              </div>
              <div className="flex flex-col items-center">
                <Target className="h-8 w-8 text-primary mb-1" />
                <span className="font-semibold text-lg">{plan.goal}</span>
                <span className="text-xs text-muted-foreground">Primary Goal</span>
              </div>
              <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-primary mb-1" />
                <span className="font-semibold text-lg">{plan.targetAudience}</span>
                <span className="text-xs text-muted-foreground">Audience</span>
              </div>
              <div className="flex flex-col items-center">
                <DollarSign className="h-8 w-8 text-green-500 mb-1" />
                <span className="font-semibold text-lg">{plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}</span>
                <span className="text-xs text-muted-foreground">Price</span>
              </div>
            </CardContent>
          </Card>
        </header>
        
        {!plan.isPublished && (
          <Card className="mb-6 border-yellow-500 bg-yellow-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700">This plan is currently a draft and not visible to members.</p>
                <p className="text-sm text-yellow-600">Publish it from your dashboard to make it available in the Plan Explorer.</p>
              </div>
            </CardContent>
          </Card>
        )}


        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <ExerciseDisplay exercises={plan.exercises || []} />
          </div>
          <div className="md:col-span-1 space-y-6">
            <TrainerInfo trainer={trainer || null} />
            <Card className="shadow-lg">
              <CardHeader><CardTitle>Plan Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                 <p><strong>Age Range:</strong> {plan.ageMin} - {plan.ageMax} years</p>
                 <p><strong>Suitable BMI:</strong> {plan.bmiCategories.join(', ')}</p>
                 <p><strong>Last Updated:</strong> {new Date(plan.updatedAt).toLocaleDateString()}</p>
                 {/* Add more relevant details as needed */}
              </CardContent>
            </Card>
          </div>
        </div>
      </article>
      <Separator className="my-8"/>
      <div className="text-center">
        <Button asChild variant="outline">
            <Link href="/plans">Back to Plan Explorer</Link>
        </Button>
      </div>
    </div>
  );
}
