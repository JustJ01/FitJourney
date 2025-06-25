
import type { GeneratePersonalizedPlanOutput } from '@/ai/flows/generate-personalized-plan';
import type { ACTUAL_PLAN_BMI_CATEGORIES } from '@/lib/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'trainer';
  avatarUrl?: string; // Will now store Cloudinary URL
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  gender?: 'male' | 'female' | 'other';
}

export interface Trainer extends User {
  role: 'trainer';
  bio?: string;
  specializations?: string[];
}

export interface UserProfileUpdateData {
  name?: string;
  avatarUrl?: string; // This will be the Cloudinary URL string or "" for removal
  age?: number;
  weight?: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface TrainerProfileUpdateData extends UserProfileUpdateData {
  bio?: string;
  specializations?: string[];
}


export interface Exercise {
  id: string;
  name: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'Daily' | string;
  sets: number;
  reps: string;
  instructions?: string;
  planId: string;
}

export type BMICategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | 'All';
export type PlanSpecificBMICategory = typeof ACTUAL_PLAN_BMI_CATEGORIES[number];

export interface Plan {
  id: string;
  name: string;
  description: string;
  duration: string;
  goal: string;
  rating: number;
  numberOfRatings?: number;
  price: number;
  targetAudience: string;
  trainerId: string;
  trainerName?: string;
  trainerAvatarUrl?: string; // Will now store Cloudinary URL
  ageMin: number;
  ageMax: number;
  bmiCategories: PlanSpecificBMICategory[];
  createdAt: string;
  updatedAt: string;
  exercises?: Exercise[];
  isPublished?: boolean;
  imageUrl?: string; // Will now store Cloudinary URL
}

export interface AIPlanRequest {
  age: number;
  fitnessGoal: string;
  bmi: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  availableEquipment?: string;
  workoutFrequency?: string;
  muscleFocus?: string;
}

export type AIGeneratedPlan = GeneratePersonalizedPlanOutput['plan'];

export interface PlanFilters {
  ageRange: [number, number];
  bmiCategory: BMICategory | '';
  rating: number | null;
  price: [number, number];
  duration: string;
  searchTerm: string;
}

export interface PlanRating { 
  userId: string;
  planId: string;
  ratingValue: number; 
  ratedAt: string; 
}

export interface Review { 
  id: string; 
  planId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string; 
  rating: number; 
  comment: string;
  createdAt: string; 
  updatedAt?: string; 
}

export interface ProgressEntry {
  id: string;
  userId: string;
  planId: string;
  exerciseId: string;
  exerciseName: string;
  date: string; // ISO string
  weight?: number;
  reps?: number;
  sets?: number;
  duration?: number; // in minutes for cardio/timed exercises
  notes?: string;
  caloriesBurned?: number;
}

export interface UserPlanStatus {
  id: string; // planId
  userId: string;
  planId: string;
  completedDays: number[];
  startDate: string; // ISO String
  lastUpdated: string; // ISO string
}
