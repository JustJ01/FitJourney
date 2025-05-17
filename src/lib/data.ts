
import type { User, Trainer, Plan, Exercise, BMICategory, AIGeneratedPlan, PlanSpecificBMICategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ACTUAL_PLAN_BMI_CATEGORIES } from './constants';

// Mock Users & Trainers - Kept for AuthContext until it's refactored for Firebase Auth
export let mockUsers: User[] = [
  { id: 'user1', name: 'Alice Member', email: 'alice@example.com', role: 'member' },
  { id: 'user2', name: 'Bob Member', email: 'bob@example.com', role: 'member' },
];

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
// --- End Mock Users & Trainers ---


// --- Data Access Functions ---

// Get all published plans with their exercises
export const getPublishedPlans = async (): Promise<Plan[]> => {
  const plansCollectionRef = collection(db, 'plans');
  const q = query(plansCollectionRef, where('isPublished', '==', true));
  const querySnapshot = await getDocs(q);

  const plans: Plan[] = [];
  for (const planDoc of querySnapshot.docs) {
    const planData = planDoc.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

    const exercisesCollectionRef = collection(db, 'plans', planDoc.id, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesCollectionRef);
    const exercises: Exercise[] = exercisesSnapshot.docs.map(exDoc => ({
      id: exDoc.id,
      ...exDoc.data(),
      planId: planDoc.id
    } as Exercise));

    let trainerName = planData.trainerName;
    let trainerAvatarUrl = planData.trainerAvatarUrl;

    if (planData.trainerId && (!trainerName || !trainerAvatarUrl)) {
        const trainer = await getTrainerById(planData.trainerId);
        trainerName = trainer?.name;
        trainerAvatarUrl = trainer?.avatarUrl;
    }

    plans.push({
      id: planDoc.id,
      ...planData,
      createdAt: planData.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: planData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      exercises,
      trainerName, // Ensure these are populated
      trainerAvatarUrl, // Ensure these are populated
    } as Plan);
  }
  return plans;
};

// Get a single plan by ID with its exercises
export const getPlanById = async (id: string): Promise<Plan | undefined> => {
  const planDocRef = doc(db, 'plans', id);
  const planDocSnap = await getDoc(planDocRef);

  if (planDocSnap.exists()) {
    const planData = planDocSnap.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

    const exercisesCollectionRef = collection(db, 'plans', id, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesCollectionRef);
    const exercises: Exercise[] = exercisesSnapshot.docs.map(exDoc => ({
      id: exDoc.id,
      ...exDoc.data(),
      planId: id
    } as Exercise));
    
    let trainerName = planData.trainerName;
    let trainerAvatarUrl = planData.trainerAvatarUrl;

    if (planData.trainerId && (!trainerName || !trainerAvatarUrl)) {
        const trainer = await getTrainerById(planData.trainerId);
        trainerName = trainer?.name;
        trainerAvatarUrl = trainer?.avatarUrl;
    }

    return {
      id: planDocSnap.id,
      ...planData,
      createdAt: planData.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: planData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      exercises,
      trainerName, // Ensure these are populated
      trainerAvatarUrl, // Ensure these are populated
    } as Plan;
  }
  return undefined;
};

// Get plans by trainer ID
export const getPlansByTrainerId = async (trainerId: string): Promise<Plan[]> => {
  const plansCollectionRef = collection(db, 'plans');
  const q = query(plansCollectionRef, where('trainerId', '==', trainerId));
  const querySnapshot = await getDocs(q);

  const plans: Plan[] = [];
  for (const planDoc of querySnapshot.docs) {
    const planData = planDoc.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

    const exercisesCollectionRef = collection(db, 'plans', planDoc.id, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesCollectionRef);
    const exercises: Exercise[] = exercisesSnapshot.docs.map(exDoc => ({
      id: exDoc.id,
      ...exDoc.data(),
      planId: planDoc.id
    } as Exercise));

    let trainerName = planData.trainerName;
    let trainerAvatarUrl = planData.trainerAvatarUrl;

    if (planData.trainerId && (!trainerName || !trainerAvatarUrl)) {
        const trainer = await getTrainerById(planData.trainerId);
        trainerName = trainer?.name;
        trainerAvatarUrl = trainer?.avatarUrl;
    }

    plans.push({
      id: planDoc.id,
      ...planData,
      createdAt: planData.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: planData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      exercises,
      trainerName, // Ensure these are populated
      trainerAvatarUrl, // Ensure these are populated
    } as Plan);
  }
  return plans;
};

// Get trainer by ID
export const getTrainerById = async (id: string): Promise<Trainer | undefined> => {
  if (!id) return undefined;
  const trainerDocRef = doc(db, 'trainers', id); // Assuming 'trainers' collection
  const trainerDocSnap = await getDoc(trainerDocRef);

  if (trainerDocSnap.exists()) {
    return {
      id: trainerDocSnap.id,
      ...trainerDocSnap.data()
    } as Trainer;
  }
  // Fallback to mockTrainers if not found in DB - for AuthContext which still uses mocks
  const mockTrainer = mockTrainers.find(t => t.id === id);
  if (mockTrainer) {
    console.warn(`Trainer ID ${id} fetched from mock data as fallback for AuthContext. Ensure 'trainers' collection in Firestore is populated.`);
    return mockTrainer;
  }
  return undefined;
};


export const createPlan = async (
  planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'>,
  exercisesData: Omit<Exercise, 'id' | 'planId'>[]
): Promise<Plan> => {
  const trainerDetails = await getTrainerById(planData.trainerId);

  const planDocData = {
    ...planData,
    trainerName: trainerDetails?.name || 'Unknown Trainer',
    trainerAvatarUrl: trainerDetails?.avatarUrl || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isPublished: planData.isPublished === undefined ? false : planData.isPublished,
  };

  const planDocRef = await addDoc(collection(db, 'plans'), planDocData);
  const planId = planDocRef.id;

  const batch = writeBatch(db);
  exercisesData.forEach(ex => {
    const exerciseDocRef = doc(collection(db, 'plans', planId, 'exercises'));
    batch.set(exerciseDocRef, ex);
  });
  await batch.commit();

  // Fetch the newly created plan to return it with IDs and timestamps
  const newPlan = await getPlanById(planId);
  if (!newPlan) {
    throw new Error("Failed to retrieve newly created plan.");
  }
  return newPlan;
};

export const updatePlan = async (
  planId: string,
  planData: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'>>,
  exercisesData: Omit<Exercise, 'id' | 'planId'>[]
): Promise<Plan | undefined> => {
  const planDocRef = doc(db, 'plans', planId);

  const planUpdateData = {
    ...planData,
    updatedAt: serverTimestamp(),
  };
  if(planData.trainerId && (planData.trainerName === undefined || planData.trainerAvatarUrl === undefined)){
      const trainerDetails = await getTrainerById(planData.trainerId);
      planUpdateData.trainerName = trainerDetails?.name || planData.trainerName || 'Unknown Trainer';
      planUpdateData.trainerAvatarUrl = trainerDetails?.avatarUrl || planData.trainerAvatarUrl || '';
  }


  // Update the main plan document
  await updateDoc(planDocRef, planUpdateData);

  // Manage exercises: delete existing ones and add new ones
  const exercisesCollectionRef = collection(db, 'plans', planId, 'exercises');
  const existingExercisesSnapshot = await getDocs(exercisesCollectionRef);

  const batch = writeBatch(db);

  // Delete existing exercises
  existingExercisesSnapshot.docs.forEach(exDoc => {
    batch.delete(doc(db, 'plans', planId, 'exercises', exDoc.id));
  });

  // Add new exercises
  exercisesData.forEach(ex => {
    const newExerciseDocRef = doc(collection(db, 'plans', planId, 'exercises')); // Generate new ID
    batch.set(newExerciseDocRef, ex);
  });

  await batch.commit();

  // Fetch the updated plan to return it
  return getPlanById(planId);
};

export const deletePlan = async (planId: string): Promise<boolean> => {
  const planDocRef = doc(db, 'plans', planId);
  const exercisesCollectionRef = collection(db, 'plans', planId, 'exercises');

  try {
    const batch = writeBatch(db);

    // Delete all exercises in the subcollection
    const exercisesSnapshot = await getDocs(exercisesCollectionRef);
    exercisesSnapshot.forEach(exDoc => {
      batch.delete(doc(db, 'plans', planId, 'exercises', exDoc.id));
    });

    // Delete the main plan document
    batch.delete(planDocRef);

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting plan:", error);
    return false;
  }
};

export const saveAIPlanAsNew = async (
  aiPlan: AIGeneratedPlan,
  trainerId: string,
  planName: string,
  planDescription: string
): Promise<Plan> => {
  const trainerDetails = await getTrainerById(trainerId);
  if (!trainerDetails) {
    console.error(`Trainer with ID ${trainerId} not found for AI plan save.`);
    // Fallback or throw error - for now, let createPlan handle trainer lookup
  }

  // Construct plan data suitable for createPlan
  const planDataForCreation: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'> = {
    name: planName,
    description: planDescription,
    duration: aiPlan.duration,
    goal: aiPlan.goal,
    rating: 0, // Default rating for new AI plans
    price: 0,  // Default price for new AI plans
    targetAudience: "AI Generated", // Or be more specific based on AI input if possible
    trainerId: trainerId,
    trainerName: trainerDetails?.name, // Will be re-fetched by createPlan if undefined
    trainerAvatarUrl: trainerDetails?.avatarUrl, // Will be re-fetched by createPlan if undefined
    ageMin: 18, // Default, consider making this configurable or part of AI output
    ageMax: 65, // Default
    bmiCategories: [ACTUAL_PLAN_BMI_CATEGORIES[1]], // Default to 'Normal'
    isPublished: false, // AI plans are drafts by default
  };

  const exercisesData: Omit<Exercise, 'id' | 'planId'>[] = aiPlan.exercises.map(ex => ({
    name: ex.exerciseName,
    dayOfWeek: ex.day,
    sets: ex.sets,
    reps: ex.reps,
    instructions: "", // AI plans might not have detailed instructions initially
  }));

  return createPlan(planDataForCreation, exercisesData);
};

