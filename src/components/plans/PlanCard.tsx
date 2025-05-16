
import type { Plan } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Tag, Users, CalendarDays, BarChart3 } from 'lucide-react';
import Image from 'next/image';

interface PlanCardProps {
  plan: Plan;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  return (
    <Link href={`/plans/${plan.id}`} className="block group">
      <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
        <div className="relative h-48 w-full">
          <Image 
            src={`https://placehold.co/400x200.png?text=${encodeURIComponent(plan.name.substring(0,15))}`} 
            alt={plan.name} 
            layout="fill" 
            objectFit="cover"
            data-ai-hint="fitness abstract"
          />
           <div className="absolute top-2 right-2">
            <Badge variant={plan.price === 0 ? "secondary" : "default"}>
                {plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}
            </Badge>
          </div>
        </div>
        <CardHeader>
          <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">{plan.name}</CardTitle>
          <CardDescription className="text-sm truncate h-10">{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span>Goal: {plan.goal}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>Duration: {plan.duration}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>For: {plan.targetAudience}</span>
          </div>
           <div className="flex items-center gap-2 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span>{plan.rating.toFixed(1)} / 5.0</span>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex items-center w-full">
            <Avatar className="h-8 w-8 mr-2">
              {plan.trainerAvatarUrl && <AvatarImage src={plan.trainerAvatarUrl} alt={plan.trainerName || 'Trainer'} />}
              <AvatarFallback>{plan.trainerName ? plan.trainerName.charAt(0) : 'T'}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">By {plan.trainerName || 'Unknown Trainer'}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default PlanCard;
