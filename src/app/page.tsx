
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { Lightbulb, ListChecks, Zap, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // No longer directly used here
import { getHighestRatedPlans, getFeaturedReviews } from "@/lib/data";
import type { Plan, Review } from "@/types";
import FeaturedReviewCard from "@/components/home/FeaturedReviewCard"; // Import the new component

export default async function HomePage() {
  const featuredPlansPromise = getHighestRatedPlans(3);
  const featuredReviewsPromise = getFeaturedReviews(2);

  const [featuredPlans, featuredReviews] = await Promise.all([
    featuredPlansPromise,
    featuredReviewsPromise,
  ]);

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


  return (
    <div className="flex flex-col items-center text-center space-y-12">
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4 text-left">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  Welcome to {APP_NAME}
                </h1>
                <p className="max-w-[600px] text-foreground/80 md:text-xl">
                  Your ultimate companion for achieving your fitness goals. Discover personalized plans, generate AI-powered workouts, and connect with expert trainers.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href="/plans">Explore Fitness Plans</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/ai-generator">Generate AI Workout</Link>
                </Button>
              </div>
            </div>
            <Image
              src="https://res.cloudinary.com/dtls6wwkz/image/upload/v1750886243/fitnesslogo_b67tzc.jpg"
              alt="Fitness illustration"
              data-ai-hint="group fitness class"
              width={600}
              height={400}
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Elevate Your Fitness Journey</h2>
              <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                {APP_NAME} offers a suite of tools designed to help you succeed, whether you're a beginner or a seasoned athlete.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 pt-12">
            <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                  <ListChecks className="h-8 w-8" />
                </div>
                <CardTitle>Curated Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Browse a diverse library of fitness plans crafted by professional trainers, tailored to various goals and levels.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                <div className="p-3 rounded-full bg-accent/10 text-accent mb-2">
                  <Lightbulb className="h-8 w-8" />
                </div>
                <CardTitle>AI-Powered Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Generate personalized workout plans in seconds using our intelligent AI, adapted to your unique profile and preferences.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center">
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                  <Zap className="h-8 w-8" />
                </div>
                <CardTitle>Trainer Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  For trainers: a dedicated dashboard to create, manage, and share your fitness plans with the world.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Fitness Plans Section - Now Dynamic */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Discover</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Top Rated Fitness Plans</h2>
            <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Get started with some of our most popular and effective fitness plans, highly rated by our community.
            </p>
          </div>
          {featuredPlans.length > 0 ? (
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
              {featuredPlans.map((plan) => (
                <Card key={plan.id} className="shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <CardHeader className="p-0">
                    <Image
                      src={plan.imageUrl || "https://placehold.co/400x225.png"}
                      alt={plan.name}
                      data-ai-hint={plan.imageUrl ? plan.name : `${plan.goal.toLowerCase()} workout`}
                      width={400}
                      height={225}
                      className="rounded-t-lg object-cover aspect-[16/9]"
                    />
                  </CardHeader>
                  <CardContent className="p-6 flex-grow text-left">
                    <CardTitle className="mb-2 text-xl">{plan.name}</CardTitle>
                    <div className="flex items-center gap-0.5 mb-2">
                      {renderStars(plan.rating || 0, plan.id)}
                      {(plan.numberOfRatings || 0) > 0 && (
                        <span className="text-sm text-foreground/70 ml-1.5">({(plan.rating || 0).toFixed(1)})</span>
                      )}
                    </div>
                    <CardDescription className="text-sm line-clamp-3">{plan.description}</CardDescription>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/plans/${plan.id}`}>View Plan</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No featured plans available at the moment. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Testimonials Section - Now Dynamic */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Success Stories</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Users Say</h2>
            <p className="max-w-[900px] text-foreground/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Hear from individuals who have transformed their fitness with {APP_NAME}.
            </p>
          </div>
          {featuredReviews.length > 0 ? (
            <div className="mx-auto grid max-w-4xl items-start gap-8 sm:grid-cols-1 md:gap-12 lg:grid-cols-2">
              {featuredReviews.map((review) => (
                <FeaturedReviewCard key={`${review.planId}-${review.id}`} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No featured reviews available yet. Be the first to review a plan!</p>
          )}
        </div>
      </section>

    </div>
  );
}
