
import type { User, Trainer, Plan, Exercise, BMICategory, AIGeneratedPlan, PlanSpecificBMICategory } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { ACTUAL_PLAN_BMI_CATEGORIES } from './constants';

// Mock Users
export let mockUsers: User[] = [
  { id: 'user1', name: 'Alice Member', email: 'alice@example.com', role: 'member' },
  { id: 'user2', name: 'Bob Member', email: 'bob@example.com', role: 'member' },
];

// Mock Trainers
export let mockTrainers: Trainer[] = [
  { 
    id: 'trainer1', 
    name: 'Charlie Trainer', 
    email: 'charlie@example.com', 
    role: 'trainer', 
    bio: 'Certified fitness coach with 10 years of experience specializing in strength training and nutrition.',
    specializations: ['Strength Training', 'Nutrition'],
    avatarUrl: 'https://placehold.co/100x100.png?text=CT'
  },
  { 
    id: 'trainer2', 
    name: 'Diana Trainer', 
    email: 'diana@example.com', 
    role: 'trainer', 
    bio: 'Yoga instructor and wellness expert focused on holistic fitness and mind-body connection.',
    specializations: ['Yoga', 'Wellness', 'Pilates'],
    avatarUrl: 'https://placehold.co/100x100.png?text=DT'
  },
];

// Mock Exercises
export let mockExercises: Exercise[] = [
  // Plan 1 Exercises
  { id: 'ex1', planId: 'plan1', dayOfWeek: 'Monday', name: 'Squats', sets: 3, reps: '8-12', instructions: 'Focus on form.' },
  { id: 'ex2', planId: 'plan1', dayOfWeek: 'Monday', name: 'Bench Press', sets: 3, reps: '8-12' },
  { id: 'ex3', planId: 'plan1', dayOfWeek: 'Wednesday', name: 'Deadlifts', sets: 1, reps: '5' },
  { id: 'ex4', planId: 'plan1', dayOfWeek: 'Wednesday', name: 'Overhead Press', sets: 3, reps: '8-12' },
  { id: 'ex5', planId: 'plan1', dayOfWeek: 'Friday', name: 'Rows', sets: 3, reps: '8-12' },
  { id: 'ex6', planId: 'plan1', dayOfWeek: 'Friday', name: 'Pull-ups', sets: 3, reps: 'To failure' },
  // Plan 2 Exercises
  { id: 'ex7', planId: 'plan2', dayOfWeek: 'Tuesday', name: 'Sun Salutation A', sets: 5, reps: 'Flow', instructions: 'Warm-up sequence.' },
  { id: 'ex8', planId: 'plan2', dayOfWeek: 'Tuesday', name: 'Warrior II Pose', sets: 3, reps: '30s hold each side' },
  { id: 'ex9', planId: 'plan2', dayOfWeek: 'Thursday', name: 'Downward Dog', sets: 5, reps: '1 min hold' },
  { id: 'ex10', planId: 'plan2', dayOfWeek: 'Thursday', name: 'Triangle Pose', sets: 3, reps: '30s hold each side' },
  // Plan 3 Exercises
  { id: 'ex11', planId: 'plan3', dayOfWeek: 'Monday', name: 'Running', sets: 1, reps: '30 minutes', instructions: 'Maintain a steady pace.' },
  { id: 'ex12', planId: 'plan3', dayOfWeek: 'Wednesday', name: 'Cycling', sets: 1, reps: '45 minutes' },
  { id: 'ex13', planId: 'plan3', dayOfWeek: 'Friday', name: 'Swimming', sets: 1, reps: '30 minutes' },
];

// Mock Plans
export let mockPlans: Plan[] = [
  {
    id: 'plan1',
    name: 'Beginner Strength Builder',
    description: 'A 4-week plan to build foundational strength for beginners.',
    duration: '4 Weeks',
    goal: 'Muscle Gain',
    rating: 4.5,
    price: 29.99,
    targetAudience: 'Beginners',
    trainerId: 'trainer1',
    trainerName: 'Charlie Trainer',
    trainerAvatarUrl: 'https://placehold.co/100x100.png?text=CT',
    ageMin: 18,
    ageMax: 40,
    bmiCategories: ['Normal', 'Overweight'] as PlanSpecificBMICategory[],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    isPublished: true,
  },
  {
    id: 'plan2',
    name: 'Yoga for Flexibility',
    description: 'Improve your flexibility and find your center with this 6-week yoga plan.',
    duration: '6 Weeks',
    goal: 'Improve Flexibility',
    rating: 4.8,
    price: 19.99,
    targetAudience: 'All Levels',
    trainerId: 'trainer2',
    trainerName: 'Diana Trainer',
    trainerAvatarUrl: 'https://placehold.co/100x100.png?text=DT',
    ageMin: 16,
    ageMax: 60,
    bmiCategories: ['Underweight', 'Normal', 'Overweight'] as PlanSpecificBMICategory[],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    isPublished: true,
  },
  {
    id: 'plan3',
    name: 'Cardio Blast Challenge',
    description: 'An 8-week cardio focused plan to boost endurance and burn calories.',
    duration: '8 Weeks',
    goal: 'Improve Endurance',
    rating: 4.2,
    price: 0, // Free plan
    targetAudience: 'Intermediate',
    trainerId: 'trainer1',
    trainerName: 'Charlie Trainer',
    trainerAvatarUrl: 'https://placehold.co/100x100.png?text=CT',
    ageMin: 20,
    ageMax: 50,
    bmiCategories: ['Normal', 'Overweight', 'Obese'] as PlanSpecificBMICategory[],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    isPublished: false, // Unpublished plan for dashboard testing
  },
];

// --- Data Access Functions ---

// Get all published plans with their exercises
export const getPublishedPlans = async (): Promise<Plan[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  return mockPlans
    .filter(plan => plan.isPublished)
    .map(plan => ({
      ...plan,
      exercises: mockExercises.filter(ex => ex.planId === plan.id),
    }));
};

// Get a single plan by ID with its exercises
export const getPlanById = async (id: string): Promise<Plan | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const plan = mockPlans.find(p => p.id === id);
  if (plan) {
    return {
      ...plan,
      exercises: mockExercises.filter(ex => ex.planId === plan.id),
    };
  }
  return undefined;
};

// Get plans by trainer ID
export const getPlansByTrainerId = async (trainerId: string): Promise<Plan[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockPlans
    .filter(plan => plan.trainerId === trainerId)
    .map(plan => ({
      ...plan,
      exercises: mockExercises.filter(ex => ex.planId === plan.id),
    }));
};

// Create a new plan
export const createPlan = async (planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl' | 'exercises'> & { bmiCategories: PlanSpecificBMICategory[] }, exercisesData: Omit<Exercise, 'id' | 'planId'>[]): Promise<Plan> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const trainer = mockTrainers.find(t => t.id === planData.trainerId);
  const newPlan: Plan = {
    ...planData,
    id: uuidv4(),
    trainerName: trainer?.name,
    trainerAvatarUrl: trainer?.avatarUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: planData.isPublished === undefined ? false : planData.isPublished,
    bmiCategories: planData.bmiCategories, // Already PlanSpecificBMICategory[] from form
  };
  mockPlans.push(newPlan);

  const newExercises: Exercise[] = exercisesData.map(ex => ({
    ...ex,
    id: uuidv4(),
    planId: newPlan.id,
  }));
  mockExercises.push(...newExercises);
  
  return { ...newPlan, exercises: newExercises };
};

// Update an existing plan
export const updatePlan = async (planId: string, planData: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl' | 'exercises'>> & { bmiCategories?: PlanSpecificBMICategory[] }, exercisesData: Omit<Exercise, 'id' | 'planId'>[]): Promise<Plan | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const planIndex = mockPlans.findIndex(p => p.id === planId);
  if (planIndex === -1) return undefined;

  const currentPlan = mockPlans[planIndex];
  const updatedPlanData = { 
    ...currentPlan, 
    ...planData, 
    updatedAt: new Date().toISOString() 
  };
  
  // Ensure bmiCategories is correctly typed if present in planData
  if (planData.bmiCategories) {
    updatedPlanData.bmiCategories = planData.bmiCategories;
  }


  mockPlans[planIndex] = updatedPlanData;

  // Remove old exercises for this plan and add new ones
  mockExercises = mockExercises.filter(ex => ex.planId !== planId);
  const newExercises: Exercise[] = exercisesData.map(ex => ({
    ...ex,
    id: uuidv4(),
    planId: planId,
  }));
  mockExercises.push(...newExercises);

  return { ...updatedPlanData, exercises: newExercises };
};

// Delete a plan
export const deletePlan = async (planId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const initialLength = mockPlans.length;
  mockPlans = mockPlans.filter(p => p.id !== planId);
  mockExercises = mockExercises.filter(ex => ex.planId !== planId);
  return mockPlans.length < initialLength;
};

// Save AI Generated Plan
export const saveAIPlanAsNew = async (aiPlan: AIGeneratedPlan, trainerId: string, planName: string, planDescription: string): Promise<Plan> => {
  const trainer = mockTrainers.find(t => t.id === trainerId);
  if (!trainer) throw new Error("Trainer not found");

  // For AI generated plans, we can default to a broader set or a specific one like 'Normal'
  // Trainers can refine this later. For now, let's use ['Normal'] or allow it to be an empty array if preferred.
  // Using ACTUAL_PLAN_BMI_CATEGORIES[1] which is 'Normal'
  const defaultBmiCategoryForAI: PlanSpecificBMICategory[] = [ACTUAL_PLAN_BMI_CATEGORIES[1]];


  const planDataForCreation: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl'| 'exercises'> & { bmiCategories: PlanSpecificBMICategory[] } = {
    name: planName,
    description: planDescription,
    duration: aiPlan.duration,
    goal: aiPlan.goal,
    rating: 0, 
    price: 0, 
    targetAudience: "AI Generated", 
    trainerId: trainer.id,
    ageMin: 18, 
    ageMax: 65,
    bmiCategories: defaultBmiCategoryForAI, // AI plans default to 'Normal' or can be configured.
    isPublished: false, 
  };

  const exercisesData: Omit<Exercise, 'id' | 'planId'>[] = aiPlan.exercises.map(ex => ({
    name: ex.exerciseName,
    dayOfWeek: ex.day,
    sets: ex.sets,
    reps: ex.reps,
    instructions: "", // AI plan might not always provide this, default to empty
  }));
  
  // The createPlan function now expects bmiCategories to be PlanSpecificBMICategory[]
  return createPlan(planDataForCreation, exercisesData);
};


// Get trainer by ID
export const getTrainerById = async (id: string): Promise<Trainer | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockTrainers.find(t => t.id === id);
}
