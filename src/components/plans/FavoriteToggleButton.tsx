
"use client";

import { useState, useEffect, type MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button'; // Import ButtonProps
import { useAuth } from '@/hooks/useAuth';
import { addPlanToFavorites, removePlanFromFavorites, isPlanFavorited } from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface FavoriteToggleButtonProps {
  planId: string;
  className?: string;
  size?: ButtonProps["size"]; 
}

const FavoriteToggleButton: React.FC<FavoriteToggleButtonProps> = ({ planId, className, size = "icon" }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    let isMounted = true;
    if (user && user.role === 'member') {
      setIsLoading(true);
      isPlanFavorited(user.id, planId)
        .then(status => {
          if (isMounted) setIsFavorited(status);
        })
        .catch(err => {
          console.error("Error checking favorite status:", err);
          if (isMounted) toast({ title: "Error", description: "Could not load favorite status.", variant: "destructive" });
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      if (isMounted) {
        setIsLoading(false);
        setIsFavorited(false); 
      }
    }
    return () => { isMounted = false; };
  }, [user, planId]);

  const handleToggleFavorite = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (!user) {
      toast({ title: "Login Required", description: "Please log in to save plans."});
      router.push('/login?redirect=' + window.location.pathname);
      return;
    }
    if (user.role !== 'member') {
      toast({ title: "Action Not Allowed", description: "Only members can save plans.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorited) {
        await removePlanFromFavorites(user.id, planId);
        setIsFavorited(false);
        toast({ title: "Plan Unfavorited", description: "Removed from your saved plans." });
      } else {
        await addPlanToFavorites(user.id, planId);
        setIsFavorited(true);
        toast({ title: "Plan Favorited!", description: "Added to your saved plans." });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast({ title: "Error", description: "Could not update favorite status.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'member') {
    // Don't render the button if user is not a member or not logged in.
    // Alternatively, render a disabled button or a "login to favorite" prompt.
    return null;
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        "p-1.5 rounded-full text-muted-foreground hover:text-rose-500 focus-visible:ring-rose-500",
        "hover:bg-rose-100 dark:hover:bg-rose-900/30",
        isFavorited && "text-rose-500 hover:text-rose-600",
        className
      )}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all duration-200 ease-in-out",
          isFavorited && "fill-rose-500"
        )}
      />
    </Button>
  );
};

export default FavoriteToggleButton;
