
import type { BMICategory } from '@/types';

export const APP_NAME = "FitJourney";

export const BMI_CATEGORIES: BMICategory[] = ['All', 'Underweight', 'Normal', 'Overweight', 'Obese'];

// Specific BMI categories that a plan can be assigned, excluding 'All'
export const ACTUAL_PLAN_BMI_CATEGORIES = ['Underweight', 'Normal', 'Overweight', 'Obese'] as const;

export const FITNESS_GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Improve Endurance",
  "General Fitness",
  "Increase Strength",
  "Improve Flexibility"
];

export const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const PLAN_DURATIONS = [
  "Any",
  "1 Week",
  "2 Weeks",
  "4 Weeks",
  "6 Weeks",
  "8 Weeks",
  "12 Weeks",
  "3 Months",
  "6 Months",
];

export const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Daily"
] as const;

export const DEFAULT_AGE_RANGE: [number, number] = [18, 65];
export const DEFAULT_PRICE_RANGE: [number, number] = [0, 200];
