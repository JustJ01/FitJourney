
import type { Plan } from '@/types';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Tag, Users, CalendarDays, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import FavoriteToggleButton from './FavoriteToggleButton'; // Import the new component

interface PlanCardProps {
  plan: Plan;
}

const renderStars = (rating: number, planId: string, starSizeClass = "h-4 w-4") => {
  const numStars = 5;
  const fullStars = Math.floor(rating);
  const fractionalPart = rating - fullStars;
  const filledPercentage = fractionalPart > 0 ? fractionalPart * 100 : 0;

  return Array.from({ length: numStars }, (_, i) => {
    const starValue = i + 1;
    if (starValue <= fullStars) {
      return <Star key={`star-full-${planId}-${i}`} className={`${starSizeClass} text-yellow-400 fill-yellow-400`} />;
    } else if (starValue === fullStars + 1 && fractionalPart > 0) {
      return (
        <div key={`star-partial-${planId}-${i}`} className={`relative ${starSizeClass}`}>
          <Star className={`absolute ${starSizeClass} text-gray-300 dark:text-gray-600`} />
          <Star
            className={`absolute ${starSizeClass} text-yellow-400 fill-yellow-400`}
            style={{ clipPath: `inset(0 ${100 - filledPercentage}% 0 0)` }}
          />
        </div>
      );
    } else {
      return <Star key={`star-empty-${planId}-${i}`} className={`${starSizeClass} text-gray-300 dark:text-gray-600`} />;
    }
  });
};

const PlanCard: React.FC<PlanCardProps> = ({ plan }) => {
  const imageSrc = plan.imageUrl || `https://placehold.co/400x200.png?text=${encodeURIComponent(plan.name.substring(0,15))}`;
  const imageHint = plan.imageUrl ? plan.name : "fitness abstract"; // Use plan name as hint if specific image, otherwise generic

  return (
    <Link href={`/plans/${plan.id}`} className="block group">
      <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
        <div className="relative h-48 w-full">
          <Image
            src={imageSrc}
            alt={plan.name}
            fill
            className="object-cover"
            data-ai-hint={imageHint}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Basic example, adjust as needed
          />
           <div className="absolute top-3 right-3 flex items-center gap-2">
            <FavoriteToggleButton 
                planId={plan.id} 
                size="icon" 
                className="relative z-10 h-9 w-9 rounded-full bg-black/20 text-white/80 backdrop-blur-sm transition-all hover:bg-black/30 hover:text-white"
            />
            <div className="flex items-center justify-center rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg">
                {plan.price === 0 ? 'Free' : `$${plan.price.toFixed(2)}`}
            </div>
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
           <div className="flex items-center gap-0.5">
            {(plan.numberOfRatings || 0) > 0 ? (
              <>
                {renderStars(plan.rating, plan.id)}
                <span className="text-sm text-foreground/70 ml-1.5">({(plan.rating || 0).toFixed(1)})</span>
              </>
            ) : (
                <span className="text-xs text-muted-foreground italic">Not yet rated</span>
            )}
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
