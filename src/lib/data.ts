
import type { User, Trainer, Plan, Exercise, PlanSpecificBMICategory, AIGeneratedPlan } from '@/types';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { ACTUAL_PLAN_BMI_CATEGORIES } from './constants';


// --- Mock Users & Trainers REMOVED as we are moving to Firebase Auth & Firestore ---

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
      trainerName: trainerName || 'Unknown Trainer', 
      trainerAvatarUrl: trainerAvatarUrl || '', 
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
      trainerName: trainerName || 'Unknown Trainer', 
      trainerAvatarUrl: trainerAvatarUrl || '', 
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
      trainerName: trainerName || 'Unknown Trainer', 
      trainerAvatarUrl: trainerAvatarUrl || '', 
    } as Plan);
  }
  return plans;
};

// Get trainer by ID (Firebase UID)
export const getTrainerById = async (id: string): Promise<Trainer | undefined> => {
  if (!id) return undefined;
  const trainerDocRef = doc(db, 'trainers', id);
  const trainerDocSnap = await getDoc(trainerDocRef);

  if (trainerDocSnap.exists()) {
    return {
      id: trainerDocSnap.id, // This is the Firebase UID
      ...trainerDocSnap.data()
    } as Trainer;
  }
  console.warn(`Trainer profile with ID ${id} not found in Firestore.`);
  return undefined;
};

// Get user (member) by ID (Firebase UID)
export const getUserById = async (id: string): Promise<User | undefined> => {
    if (!id) return undefined;
    const userDocRef = doc(db, 'users', id); // Assuming 'users' collection for members
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return {
            id: userDocSnap.id, // This is the Firebase UID
            ...userDocSnap.data()
        } as User;
    }
    console.warn(`User profile with ID ${id} not found in Firestore 'users' collection.`);
    return undefined;
};


export const createPlan = async (
  planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'>,
  exercisesData: Omit<Exercise, 'id' | 'planId'>[]
): Promise<Plan> => {
  let trainerName = planData.trainerName;
  let trainerAvatarUrl = planData.trainerAvatarUrl;

  if (planData.trainerId && (!trainerName || !trainerAvatarUrl)) {
    const trainerDetails = await getTrainerById(planData.trainerId);
    trainerName = trainerDetails?.name;
    trainerAvatarUrl = trainerDetails?.avatarUrl;
  }


  const planDocData = {
    ...planData,
    trainerName: trainerName || 'Unknown Trainer',
    trainerAvatarUrl: trainerAvatarUrl || '',
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

  const planUpdateData: any = { // Use any for flexibility, will be type-checked by Firestore
    ...planData,
    updatedAt: serverTimestamp(),
  };
  
  if(planData.trainerId && (planData.trainerName === undefined || planData.trainerAvatarUrl === undefined)){
      const trainerDetails = await getTrainerById(planData.trainerId);
      planUpdateData.trainerName = trainerDetails?.name || planData.trainerName || 'Unknown Trainer';
      planUpdateData.trainerAvatarUrl = trainerDetails?.avatarUrl || planData.trainerAvatarUrl || '';
  }


  await updateDoc(planDocRef, planUpdateData);

  const exercisesCollectionRef = collection(db, 'plans', planId, 'exercises');
  const existingExercisesSnapshot = await getDocs(exercisesCollectionRef);

  const batch = writeBatch(db);

  existingExercisesSnapshot.docs.forEach(exDoc => {
    batch.delete(doc(db, 'plans', planId, 'exercises', exDoc.id));
  });

  exercisesData.forEach(ex => {
    const newExerciseDocRef = doc(collection(db, 'plans', planId, 'exercises'));
    batch.set(newExerciseDocRef, ex);
  });

  await batch.commit();

  return getPlanById(planId);
};

export const deletePlan = async (planId: string): Promise<boolean> => {
  const planDocRef = doc(db, 'plans', planId);
  const exercisesCollectionRef = collection(db, 'plans', planId, 'exercises');

  try {
    const batch = writeBatch(db);

    const exercisesSnapshot = await getDocs(exercisesCollectionRef);
    exercisesSnapshot.forEach(exDoc => {
      batch.delete(doc(db, 'plans', planId, 'exercises', exDoc.id));
    });

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
  
  let trainerDetailsName: string | undefined;
  let trainerDetailsAvatarUrl: string | undefined;

  if (trainerId) {
    const trainerDetails = await getTrainerById(trainerId);
    trainerDetailsName = trainerDetails?.name;
    trainerDetailsAvatarUrl = trainerDetails?.avatarUrl;
  }


  const planDataForCreation: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'> = {
    name: planName,
    description: planDescription,
    duration: aiPlan.duration,
    goal: aiPlan.goal,
    rating: 0, 
    price: 0,  
    targetAudience: "AI Generated", 
    trainerId: trainerId,
    trainerName: trainerDetailsName, 
    trainerAvatarUrl: trainerDetailsAvatarUrl, 
    ageMin: 18, 
    ageMax: 65, 
    bmiCategories: [ACTUAL_PLAN_BMI_CATEGORIES[1]], 
    isPublished: false, 
  };

  const exercisesData: Omit<Exercise, 'id' | 'planId'>[] = aiPlan.exercises.map(ex => ({
    name: ex.exerciseName,
    dayOfWeek: ex.day,
    sets: ex.sets,
    reps: ex.reps,
    instructions: "", 
  }));

  return createPlan(planDataForCreation, exercisesData);
};
