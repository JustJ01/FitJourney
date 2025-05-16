
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { Lightbulb, ListChecks, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
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
              src="https://placehold.co/600x400.png"
              alt="Fitness illustration"
              data-ai-hint="fitness workout"
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
    </div>
  );
}
