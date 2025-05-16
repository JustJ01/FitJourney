
import type { User, Trainer, Plan, Exercise, BMICategory, AIGeneratedPlan, PlanSpecificBMICategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { db } from './firebase'; // Ensure this path is correct and firebase.ts is set up
import { collection, query, where, getDocs, doc, getDoc, Timestamp, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ACTUAL_PLAN_BMI_CATEGORIES } from './constants';

// Mock Users & Trainers - Kept for AuthContext until it's refactored
// These will be used by AuthContext for now.
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
    const planData = planDoc.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

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
      trainerName,
      trainerAvatarUrl,
    } as Plan);
  }
  return plans;
};

// Get a single plan by ID with its exercises
export const getPlanById = async (id: string): Promise<Plan | undefined> => {
  const planDocRef = doc(db, 'plans', id);
  const planDocSnap = await getDoc(planDocRef);

  if (planDocSnap.exists()) {
    const planData = planDocSnap.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

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
      trainerName,
      trainerAvatarUrl,
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
    const planData = planDoc.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

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
      trainerName,
      trainerAvatarUrl,
    } as Plan);
  }
  return plans;
};

// Get trainer by ID
export const getTrainerById = async (id: string): Promise<Trainer | undefined> => {
  if (!id) return undefined;
  const trainerDocRef = doc(db, 'trainers', id);
  const trainerDocSnap = await getDoc(trainerDocRef);

  if (trainerDocSnap.exists()) {
    return {
      id: trainerDocSnap.id,
      ...trainerDocSnap.data()
    } as Trainer;
  }
  // Fallback to mockTrainers if not found in DB, for smoother transition with AuthContext
  const mockTrainer = mockTrainers.find(t => t.id === id);
  if (mockTrainer) {
    console.warn(`Trainer ID ${id} fetched from mock data as fallback. Ensure trainers collection is populated in Firestore.`);
    return mockTrainer;
  }
  return undefined;
};

// --- STUBBED CUD Operations ---
// These will be refactored in a future phase to use Firestore.

export const createPlan = async (
  planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl' | 'exercises'> & { bmiCategories: PlanSpecificBMICategory[] },
  exercisesData: Omit<Exercise, 'id' | 'planId'>[]
): Promise<Plan> => {
  console.warn("Firestore Integration: createPlan is STUBBED and does not write to the database yet. This operation will not persist.");

  const tempId = uuidv4();
  const trainerDetails = mockTrainers.find(t => t.id === planData.trainerId); // Still using mock for trainer details in this stub

  const newPlan: Plan = {
    ...planData,
    id: tempId,
    trainerName: trainerDetails?.name,
    trainerAvatarUrl: trainerDetails?.avatarUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublished: planData.isPublished === undefined ? false : planData.isPublished,
    exercises: exercisesData.map(ex => ({ ...ex, id: uuidv4(), planId: tempId })),
  };
  // In a real scenario, this would be an addDoc call to Firestore.
  // For now, it does nothing persistent.
  return newPlan; // Returns a locally constructed object.
};

export const updatePlan = async (
  planId: string,
  planData: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl' | 'exercises'>> & { bmiCategories?: PlanSpecificBMICategory[] },
  exercisesData: Omit<Exercise, 'id' | 'planId'>[]
): Promise<Plan | undefined> => {
  console.warn("Firestore Integration: updatePlan is STUBBED and does not write to the database yet. This operation will not persist.");
  // This would normally fetch the plan, update it, and save it.
  // For now, we'll simulate by "fetching" what might be in Firestore (which is nothing new).
  // To make it seem like it worked for the UI, we could merge and return.
  const existingPlan = await getPlanById(planId); // This will fetch from Firestore (if exists) or be undefined.
  if (!existingPlan) {
    // If the plan doesn't exist in Firestore (which it wouldn't if created by the stubbed createPlan),
    // then we can't really "update" it in a meaningful way for this stub.
    // For a more robust stub, one might keep an in-memory list, but that's complex.
    console.error(`Stubbed updatePlan: Plan with ID ${planId} not found. Cannot simulate update.`);
    return undefined;
  }

  // Simulate an update locally for the return type.
  const updatedPlanStub: Plan = {
    ...existingPlan,
    ...planData,
    id: planId,
    updatedAt: new Date().toISOString(),
    exercises: exercisesData.map(ex => ({ ...ex, id: (ex as Exercise).id || uuidv4(), planId })), // Try to keep existing exercise IDs if possible
  };
  return updatedPlanStub;
};

export const deletePlan = async (planId: string): Promise<boolean> => {
  console.warn("Firestore Integration: deletePlan is STUBBED and does not write to the database yet. This operation will not persist.");
  // In a real scenario, this would be a deleteDoc call.
  return true; // Simulate success
};

export const saveAIPlanAsNew = async (
  aiPlan: AIGeneratedPlan,
  trainerId: string,
  planName: string,
  planDescription: string
): Promise<Plan> => {
  console.warn("Firestore Integration: saveAIPlanAsNew is STUBBED and uses the stubbed createPlan. This operation will not persist.");

  const trainerDetails = mockTrainers.find(t => t.id === trainerId);
  if (!trainerDetails) {
    // This should ideally throw an error or be handled, but for a stub, a console error is fine.
    console.error(`Stubbed saveAIPlanAsNew: Trainer with ID ${trainerId} not found in mock data.`);
    // Returning a minimal plan structure to avoid breaking the caller too much.
    const tempId = uuidv4();
    return {
      id: tempId,
      name: planName,
      description: planDescription,
      duration: aiPlan.duration,
      goal: aiPlan.goal,
      rating: 0,
      price: 0,
      targetAudience: "AI Generated (Error: Trainer not found)",
      trainerId: trainerId,
      ageMin: 18,
      ageMax: 65,
      bmiCategories: [ACTUAL_PLAN_BMI_CATEGORIES[1]],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: false,
      exercises: aiPlan.exercises.map(ex => ({
        name: ex.exerciseName,
        dayOfWeek: ex.day,
        sets: ex.sets,
        reps: ex.reps,
        instructions: "",
        id: uuidv4(),
        planId: tempId,
      })),
    };
  }

  const planDataForCreation: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'trainerName' | 'trainerAvatarUrl'| 'exercises'> & { bmiCategories: PlanSpecificBMICategory[] } = {
    name: planName,
    description: planDescription,
    duration: aiPlan.duration,
    goal: aiPlan.goal,
    rating: 0,
    price: 0,
    targetAudience: "AI Generated",
    trainerId: trainerId, // Correctly using the passed trainerId
    ageMin: 18,
    ageMax: 65,
    bmiCategories: [ACTUAL_PLAN_BMI_CATEGORIES[1]], // Defaulting to 'Normal'
    isPublished: false,
  };

  const exercisesData: Omit<Exercise, 'id' | 'planId'>[] = aiPlan.exercises.map(ex => ({
    name: ex.exerciseName,
    dayOfWeek: ex.day,
    sets: ex.sets,
    reps: ex.reps,
    instructions: "",
  }));

  // This will call the STUBBED createPlan
  return createPlan(planDataForCreation, exercisesData);
};
