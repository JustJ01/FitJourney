
import type { Trainer } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, UserCheck } from 'lucide-react';

interface TrainerInfoProps {
  trainer: Trainer | null; // Allow null if trainer data might be missing
}

const TrainerInfo: React.FC<TrainerInfoProps> = ({ trainer }) => {
  if (!trainer) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Trainer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Trainer details are not available for this plan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Meet Your Trainer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            {trainer.avatarUrl && <AvatarImage src={trainer.avatarUrl} alt={trainer.name} />}
            <AvatarFallback className="text-3xl bg-primary/20">{trainer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold text-foreground">{trainer.name}</h3>
            <p className="text-sm text-muted-foreground">{trainer.role === 'trainer' ? 'Certified Trainer' : 'Fitness Enthusiast'}</p>
          </div>
        </div>
        {trainer.bio && <p className="text-foreground/80 text-sm">{trainer.bio}</p>}
        {trainer.specializations && trainer.specializations.length > 0 && (
          <div>
            <h4 className="font-semibold text-md mb-1 text-foreground">Specializations:</h4>
            <ul className="list-disc list-inside text-sm text-foreground/70 space-y-1">
              {trainer.specializations.map((spec, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-accent"/> {spec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainerInfo;
