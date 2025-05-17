import type { GeneratePersonalizedPlanOutput } from '@/ai/flows/generate-personalized-plan';
import type { ACTUAL_PLAN_BMI_CATEGORIES } from '@/lib/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'trainer';
}

export interface Trainer extends User {
  role: 'trainer';
  bio?: string;
  specializations?: string[];
  avatarUrl?: string;
}

export interface Exercise {
  id: string;
  name: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Daily' | string; // string for AI flexibility
  sets: number;
  reps: string; // Can be "10-12" or "To failure"
  instructions?: string;
  planId: string;
}

export type BMICategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | 'All';
export type PlanSpecificBMICategory = typeof ACTUAL_PLAN_BMI_CATEGORIES[number];

export interface Plan {
  id: string;
  name: string;
  description: string;
  duration: string; // e.g., "4 weeks", "3 months"
  goal: string; // e.g., "Weight Loss", "Muscle Gain"
  rating: number; // 1-5
  price: number; // 0 for free plans
  targetAudience: string; // e.g., "Beginners", "Advanced Athletes"
  trainerId: string;
  trainerName?: string;
  trainerAvatarUrl?: string;
  ageMin: number;
  ageMax: number;
  bmiCategories: PlanSpecificBMICategory[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  exercises?: Exercise[];
  isPublished?: boolean;
}

// For AI Plan Generation form input
export interface AIPlanRequest {
  age: number;
  fitnessGoal: string;
  bmi: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Simplified AI Plan structure matching Genkit output for internal use after generation
export type AIGeneratedPlan = GeneratePersonalizedPlanOutput['plan'];

export interface PlanFilters {
  ageRange: [number, number];
  bmiCategory: BMICategory | ''; // Can be 'All' or specific, or '' for reset state
  rating: number | null;
  price: [number, number];
  duration: string; // e.g. "1-4 weeks", "1-3 months", "3+ months", or "" for any
  searchTerm: string;
}
