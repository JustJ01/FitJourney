

import type { User, Trainer, Plan, Exercise, AIGeneratedPlan, UserProfileUpdateData, TrainerProfileUpdateData, PlanSpecificBMICategory, PlanRating, Review, ProgressEntry, UserPlanStatus, ChatRoom, ChatMessage, PurchasedPlan, Sale } from '@/types';
import { db } from './firebase'; // Removed storage import
import { collection, query, where, getDocs, doc, getDoc, Timestamp, addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, setDoc, documentId, FieldPath, runTransaction, orderBy, limit as firestoreLimit, collectionGroup, arrayUnion, deleteField } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { ACTUAL_PLAN_BMI_CATEGORIES } from './constants';

// Get all published plans with their exercises
export const getPublishedPlans = async (): Promise<Plan[]> => {
  try {
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
        rating: planData.rating || 0,
        numberOfRatings: planData.numberOfRatings || 0,
        imageUrl: planData.imageUrl || '',
      } as Plan);
    }
    return plans;
  } catch (error: any) {
    console.error(`[data.ts] Error in getPublishedPlans: ${error.message}`, error);
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission"))) {
        console.error("[data.ts] getPublishedPlans: PERMISSION DENIED. Check Firestore rules.");
    }
    throw error;
  }
};

// Get the top N highest-rated published plans
export const getHighestRatedPlans = async (count: number = 3): Promise<Plan[]> => {
  try {
    const plansCollectionRef = collection(db, 'plans');
    const q = query(
      plansCollectionRef,
      where('isPublished', '==', true),
      orderBy('rating', 'desc'),
      orderBy('numberOfRatings', 'desc'),
      firestoreLimit(count)
    );
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
        rating: planData.rating || 0,
        numberOfRatings: planData.numberOfRatings || 0,
        imageUrl: planData.imageUrl || '',
      } as Plan);
    }
    return plans;
  } catch (error: any) {
    if (error.code === 'failed-precondition' && error.message && error.message.toLowerCase().includes("query requires an index")) {
      console.error(
        `\n\n[CRITICAL FIX REQUIRED IN FIREBASE CONSOLE]\n` +
        `[data.ts] Firestore query in getHighestRatedPlans failed because a composite index is missing.\n` +
        `This is NOT a bug in the Next.js code. You MUST create this index in your Firebase project.\n` +
        `The error message usually provides a direct link to create it. Look for something like: \n` +
        `${error.message}\n` +
        `The query involved filtering on 'isPublished' (ASC) and ordering by 'rating' (DESC) then 'numberOfRatings' (DESC) on the 'plans' collection.\n` +
        `Returning an empty array for featured plans. The homepage will show 'No featured plans'.\n\n`
      );
      return [];
    }
    console.error(`[data.ts] Error in getHighestRatedPlans:`, error);
    throw error;
  }
};


// Get a single plan by ID with its exercises
export const getPlanById = async (id: string): Promise<Plan | undefined> => {
  try {
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

      const fullPlanData = {
        id: planDocSnap.id,
        ...planData,
        createdAt: planData.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: planData.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        exercises,
        trainerName: trainerName || 'Unknown Trainer',
        trainerAvatarUrl: trainerAvatarUrl || '',
        rating: planData.rating || 0,
        numberOfRatings: planData.numberOfRatings || 0,
        imageUrl: planData.imageUrl || '',
      } as Plan;
      return fullPlanData;
    }
    return undefined;
  } catch (error: any) {
    console.error(`[data.ts] Error in getPlanById for ID ${id}:`, error.message);
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission"))) {
        console.error(`[data.ts] getPlanById: PERMISSION DENIED while fetching plan or related data for ID ${id}. Check Firestore rules.`);
    }
    throw error;
  }
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
      rating: planData.rating || 0,
      numberOfRatings: planData.numberOfRatings || 0,
      imageUrl: planData.imageUrl || '',
    } as Plan);
  }
  return plans;
};

// Get trainer by ID (Firebase UID)
export const getTrainerById = async (id: string): Promise<Trainer | undefined> => {
  if (!id) {
    return undefined;
  }
  const trainerDocRef = doc(db, 'trainers', id);
  try {
    const trainerDocSnap = await getDoc(trainerDocRef);
    if (trainerDocSnap.exists()) {
      const data = trainerDocSnap.data();
      return {
        id: trainerDocSnap.id,
        name: data.name || '',
        email: data.email || '',
        role: 'trainer',
        bio: data.bio || '',
        specializations: data.specializations || [],
        avatarUrl: data.avatarUrl || '',
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        lastSeen: (data.lastSeen as Timestamp)?.toDate().toISOString(),
      } as Trainer;
    }
    return undefined;
  } catch (error: any) {
    console.error(`[data.ts] Error in getTrainerById for ID ${id}:`, error.message);
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission"))) {
        console.error(`[data.ts] getTrainerById: PERMISSION DENIED while fetching trainer for ID ${id}. Check Firestore rules.`);
    }
    throw error;
  }
};

// Get user (member) by ID (Firebase UID)
export const getUserById = async (id: string): Promise<User | undefined> => {
    if (!id) {
      return undefined;
    }
    const userDocRef = doc(db, 'users', id);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          return {
              id: userDocSnap.id,
              name: data.name || '',
              email: data.email || '',
              role: 'member', // Assuming this function only fetches members, or role is stored
              avatarUrl: data.avatarUrl || '',
              age: data.age,
              weight: data.weight,
              height: data.height,
              gender: data.gender,
              lastSeen: (data.lastSeen as Timestamp)?.toDate().toISOString(),
          } as User;
      }
      // If not found in 'users', check 'trainers' as a user could be a trainer
      const trainerProfile = await getTrainerById(id);
      if (trainerProfile) return trainerProfile as User; // Cast as User for consistent return type if used generically

      return undefined;
    } catch (error: any) {
      console.error(`[data.ts] Error in getUserById for ID ${id}:`, error.message);
      if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission"))) {
          console.error(`[data.ts] getUserById: PERMISSION DENIED while fetching user for ID ${id}. Check Firestore rules.`);
      }
      throw error;
    }
};

export const createPlan = async (
  planData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises' | 'trainerName' | 'trainerAvatarUrl' | 'rating' | 'numberOfRatings'>,
  exercisesData: Omit<Exercise, 'id' | 'planId'>[]
): Promise<Plan> => {
  let trainerNameResolved: string | undefined;
  let trainerAvatarUrlResolved: string | undefined;

  if (planData.trainerId) {
    const trainerDetails = await getTrainerById(planData.trainerId);
    trainerNameResolved = trainerDetails?.name;
    trainerAvatarUrlResolved = trainerDetails?.avatarUrl;
  }

  const planDocWriteData: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises'> & {createdAt: any, updatedAt: any} = {
    ...planData,
    trainerName: trainerNameResolved || 'Unknown Trainer',
    trainerAvatarUrl: trainerAvatarUrlResolved || '',
    rating: 0,
    numberOfRatings: 0,
    imageUrl: planData.imageUrl || "", // Will come from PlanForm after Cloudinary upload
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isPublished: planData.isPublished === undefined ? false : planData.isPublished,
  };

  const planDocRef = await addDoc(collection(db, 'plans'), planDocWriteData);
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
  planData: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises' | 'rating' | 'numberOfRatings'>>,
  exercisesData: Omit<Exercise, 'id' | 'planId'>[]
): Promise<Plan | undefined> => {
  const planDocRef = doc(db, 'plans', planId);
  
  // Ensure planData is Partial<Plan> without exercises, then add serverTimestamp
  const planUpdateData: Partial<Plan> & { updatedAt: any } = {
      ...planData,
      updatedAt: serverTimestamp(),
  };

  // If trainerId is present and trainerName/AvatarUrl are not, resolve them
  if(planData.trainerId && (planData.trainerName === undefined || planData.trainerAvatarUrl === undefined)){
      const trainerDetails = await getTrainerById(planData.trainerId);
      planUpdateData.trainerName = trainerDetails?.name || planData.trainerName || 'Unknown Trainer';
      planUpdateData.trainerAvatarUrl = trainerDetails?.avatarUrl || planData.trainerAvatarUrl || '';
  }
  
  // If imageUrl is explicitly set to "" in planData, it means remove.
  // If imageUrl is a new URL, it means update.
  // If imageUrl is undefined in planData, it means no change intended from form for this field.
  if (planData.imageUrl !== undefined) {
    planUpdateData.imageUrl = planData.imageUrl;
  }


  await updateDoc(planDocRef, planUpdateData as any); // Cast as any because serverTimestamp type clashes

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
  const ratingsCollectionRef = collection(db, 'plans', planId, 'ratings');
  const reviewsCollectionRef = collection(db, 'plans', planId, 'reviews');

  try {
    // Note: Deleting image from Cloudinary would require its URL and Cloudinary SDK.
    // This is omitted here for simplicity as per the current scope.
    // If planSnap.data()?.imageUrl exists, you'd call Cloudinary's delete API.

    const batch = writeBatch(db);
    const exercisesSnapshot = await getDocs(exercisesCollectionRef);
    exercisesSnapshot.forEach(exDoc => {
      batch.delete(doc(db, 'plans', planId, 'exercises', exDoc.id));
    });
    const ratingsSnapshot = await getDocs(ratingsCollectionRef);
    ratingsSnapshot.forEach(ratingDoc => {
      batch.delete(doc(db, 'plans', planId, 'ratings', ratingDoc.id));
    });
    const reviewsSnapshot = await getDocs(reviewsCollectionRef);
    reviewsSnapshot.forEach(reviewDoc => {
      batch.delete(doc(db, 'plans', planId, 'reviews', reviewDoc.id));
    });

    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    for (const userDoc of usersSnapshot.docs) {
        const favoritePlanRef = doc(db, 'users', userDoc.id, 'favoritePlans', planId);
        const favDocSnap = await getDoc(favoritePlanRef);
        if (favDocSnap.exists()) {
            batch.delete(favoritePlanRef);
        }
    }
    batch.delete(planDocRef);
    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting plan and its subcollections/references:", error);
    return false;
  }
};

export const saveAIPlanAsNew = async (
  aiPlan: AIGeneratedPlan,
  trainerId: string,
  planName: string,
  planDescription: string
): Promise<Plan> => {

  const planDataForCreation: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'exercises' | 'trainerName' | 'trainerAvatarUrl' | 'rating' | 'numberOfRatings' | 'imageUrl'> = {
    name: planName,
    description: planDescription,
    duration: aiPlan.duration,
    goal: aiPlan.goal,
    price: 0,
    targetAudience: "AI Generated",
    trainerId: trainerId,
    ageMin: 18,
    ageMax: 65,
    bmiCategories: [ACTUAL_PLAN_BMI_CATEGORIES[1] as PlanSpecificBMICategory],
    isPublished: false,
    // imageUrl will be empty string by default, can be added via edit later
  };

  const exercisesData: Omit<Exercise, 'id' | 'planId'>[] = aiPlan.exercises.map(ex => ({
    name: ex.exerciseName,
    dayOfWeek: ex.day,
    sets: ex.sets,
    reps: ex.reps,
    instructions: ex.instructions || "",
  }));
  // Pass planDataForCreation which now correctly matches the expected type for createPlan
  return createPlan(planDataForCreation as any, exercisesData);
};

export const updateUserInFirestore = async (userId: string, data: UserProfileUpdateData): Promise<void> => {
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, data);
};

export const updateTrainerInFirestore = async (trainerId: string, data: TrainerProfileUpdateData): Promise<void> => {
  const trainerDocRef = doc(db, 'trainers', trainerId);
  await updateDoc(trainerDocRef, data);
};

export const addPlanToFavorites = async (userId: string, planId: string): Promise<void> => {
  const favoriteDocRef = doc(db, 'users', userId, 'favoritePlans', planId);
  await setDoc(favoriteDocRef, { favoritedAt: serverTimestamp() });
};

export const removePlanFromFavorites = async (userId: string, planId: string): Promise<void> => {
  const favoriteDocRef = doc(db, 'users', userId, 'favoritePlans', planId);
  await deleteDoc(favoriteDocRef);
};

export const isPlanFavorited = async (userId: string, planId: string): Promise<boolean> => {
  if (!userId || !planId) return false;
  const favoriteDocRef = doc(db, 'users', userId, 'favoritePlans', planId);
  const docSnap = await getDoc(favoriteDocRef);
  return docSnap.exists();
};

const getFavoritePlanIds = async (userId: string): Promise<string[]> => {
  const favCollectionRef = collection(db, 'users', userId, 'favoritePlans');
  const snapshot = await getDocs(favCollectionRef);
  return snapshot.docs.map(doc => doc.id);
};

export const getFavoritePlans = async (userId: string): Promise<Plan[]> => {
  const favoritePlanIds = await getFavoritePlanIds(userId);
  if (favoritePlanIds.length === 0) {
    return [];
  }

  const plans: Plan[] = [];
  const CHUNK_SIZE = 30; 

  for (let i = 0; i < favoritePlanIds.length; i += CHUNK_SIZE) {
    const chunk = favoritePlanIds.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      const plansQuery = query(collection(db, 'plans'), where(documentId(), 'in', chunk));
      const querySnapshot = await getDocs(plansQuery);

      for (const planDoc of querySnapshot.docs) {
        const planData = planDoc.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

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
          trainerName: trainerName || 'Unknown Trainer',
          trainerAvatarUrl: trainerAvatarUrl || '',
          rating: planData.rating || 0,
          numberOfRatings: planData.numberOfRatings || 0,
          imageUrl: planData.imageUrl || '',
        } as Plan); 
      }
    }
  }
  return plans;
};


export const addOrUpdatePlanRating = async (userId: string, planId: string, newRatingValue: number): Promise<void> => {
  if (newRatingValue < 1 || newRatingValue > 5) {
    throw new Error("Rating value must be between 1 and 5.");
  }

  const planDocRef = doc(db, 'plans', planId);
  const userRatingDocRef = doc(db, 'plans', planId, 'ratings', userId); 

  try {
    await runTransaction(db, async (transaction) => {
      const planDocSnap = await transaction.get(planDocRef);
      if (!planDocSnap.exists()) {
        throw new Error("Plan not found!");
      }
      const planData = planDocSnap.data();
      let currentAverageRating = planData.rating || 0;
      let currentNumberOfRatings = planData.numberOfRatings || 0;

      const userRatingSnap = await transaction.get(userRatingDocRef);
      const oldRatingValue = userRatingSnap.exists() ? userRatingSnap.data().ratingValue as number : null;

      let newAverageRating: number;
      let newNumberOfRatings: number;

      if (oldRatingValue !== null) { 
        if (currentNumberOfRatings <= 0) { 
             newAverageRating = newRatingValue;
             newNumberOfRatings = 1;
        } else {
            newAverageRating = (currentAverageRating * currentNumberOfRatings - oldRatingValue + newRatingValue) / currentNumberOfRatings;
        }
        newNumberOfRatings = currentNumberOfRatings; 
      } else { 
        newAverageRating = (currentAverageRating * currentNumberOfRatings + newRatingValue) / (currentNumberOfRatings + 1);
        newNumberOfRatings = currentNumberOfRatings + 1;
      }
      
      if (newNumberOfRatings === 0) { 
        newAverageRating = 0;
      }

      transaction.set(userRatingDocRef, {
        ratingValue: newRatingValue,
        ratedAt: serverTimestamp()
      });

      transaction.update(planDocRef, {
        rating: parseFloat(newAverageRating.toFixed(2)),
        numberOfRatings: newNumberOfRatings
      });
    });
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw e;
  }
};

export const getUserPlanRating = async (userId: string, planId: string): Promise<number | null> => {
  if (!userId || !planId) return null;
  const planRatingDocRef = doc(db, 'plans', planId, 'ratings', userId);
  const docSnap = await getDoc(planRatingDocRef);

  if (docSnap.exists()) {
    return docSnap.data().ratingValue as number;
  }
  return null;
};

export const addReview = async (
  userId: string,
  planId: string,
  ratingValue: number,
  comment: string | undefined
): Promise<void> => {
  await addOrUpdatePlanRating(userId, planId, ratingValue);

  const userProfile = await getUserById(userId);
  if (!userProfile) {
    throw new Error("User profile not found for review submission.");
  }
  const userNameToStore = userProfile.name;
  const userAvatarUrlToStore = userProfile.avatarUrl || '';

  const reviewDocRef = doc(db, 'plans', planId, 'reviews', userId);
  const reviewData = {
    planId,
    userId,
    userName: userNameToStore,
    userAvatarUrl: userAvatarUrlToStore,
    rating: ratingValue,
    comment: (comment || "").trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const reviewSnap = await getDoc(reviewDocRef);
  if (reviewSnap.exists()) {
    await updateDoc(reviewDocRef, {
      userName: userNameToStore,
      userAvatarUrl: userAvatarUrlToStore,
      rating: ratingValue,
      comment: (comment || "").trim(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(reviewDocRef, reviewData);
  }
};

export const getReviewsByPlanId = async (planId: string): Promise<Review[]> => {
  const reviews: Review[] = [];
  const reviewsCollectionRef = collection(db, 'plans', planId, 'reviews');
  const q = query(reviewsCollectionRef, orderBy('createdAt', 'desc'));

  try {
    const querySnapshot = await getDocs(q);
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      
      const userProfile = data.userId ? await getUserById(data.userId) : null;

      reviews.push({
        id: docSnap.id,
        planId: data.planId,
        userId: data.userId,
        userName: userProfile?.name || data.userName || 'Anonymous User',
        userAvatarUrl: userProfile?.avatarUrl || data.userAvatarUrl || '',
        rating: data.rating,
        comment: data.comment,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Review);
    }
  } catch (error) {
    console.error(`Error fetching reviews for plan ${planId}:`, error);
  }
  return reviews;
};

export const getFeaturedReviews = async (count: number = 2): Promise<Review[]> => {
  try {
    const reviewsCollectionGroupRef = collectionGroup(db, 'reviews');
    const q = query(
      reviewsCollectionGroupRef,
      orderBy('rating', 'desc'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(count * 5) 
    );
    const querySnapshot = await getDocs(q);

    const reviewsPromises = querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      if (!data.comment || data.comment.trim() === "") {
        return null;
      }
      
      const userProfile = data.userId ? await getUserById(data.userId) : null;
      
      return {
        id: docSnap.id, 
        planId: data.planId, 
        userId: data.userId,
        userName: userProfile?.name || data.userName || 'Anonymous User',
        userAvatarUrl: userProfile?.avatarUrl || data.userAvatarUrl || '',
        rating: data.rating,
        comment: data.comment,
        createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Review;
    });

    const resolvedReviews = (await Promise.all(reviewsPromises)).filter(review => review !== null) as Review[];
    
    return resolvedReviews.slice(0, count);

  } catch (error: any) {
    if (error.code === 'failed-precondition' && error.message && error.message.toLowerCase().includes("query requires an index")) {
      console.error(
        `\n\n[CRITICAL FIX REQUIRED IN FIREBASE CONSOLE]\n` +
        `[data.ts] Firestore query in getFeaturedReviews failed because a composite index is missing for the 'reviews' collection group.\n` +
        `This is NOT a bug in the Next.js code. You MUST create this index in your Firebase project.\n` +
        `The error message usually provides a direct link to create it. Look for something like: \n` +
        `${error.message}\n` +
        `The query involved ordering by 'rating' (DESC) and then 'createdAt' (DESC) on the 'reviews' collection group.\n` +
        `You need to create a composite index on the 'reviews' collection group with fields: 'rating' (Descending) and 'createdAt' (Descending).\n` +
        `Returning an empty array for featured reviews. The homepage will show 'No reviews'.\n\n`
      );
      return [];
    }
    console.error(`[data.ts] Error in getFeaturedReviews: ${error.message}`, error);
    throw error;
  }
};


export const addProgressEntry = async (entry: Omit<ProgressEntry, 'id'>): Promise<string> => {
  const progressCollectionRef = collection(db, 'users', entry.userId, 'progress');
  const docRef = await addDoc(progressCollectionRef, {
      ...entry,
      date: new Date(entry.date), // Store as Firestore Timestamp
  });
  return docRef.id;
};

export const getExerciseProgressForUser = async (userId: string, exerciseId: string): Promise<ProgressEntry[]> => {
  const progressCollectionRef = collection(db, 'users', userId, 'progress');
  // The query is simplified to remove the orderBy clause, which avoids the need for a composite index.
  const q = query(
      progressCollectionRef,
      where('exerciseId', '==', exerciseId)
  );
  const querySnapshot = await getDocs(q);
  const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate().toISOString(),
  } as ProgressEntry));

  // Sorting is now done on the client-side after fetching the data.
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return entries;
};

export const getAllUserProgress = async (userId: string): Promise<ProgressEntry[]> => {
  const progressCollectionRef = collection(db, 'users', userId, 'progress');
  // Removed orderBy to avoid needing a composite index. Sorting will be done client-side.
  const q = query(progressCollectionRef);
  const querySnapshot = await getDocs(q);
  const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate().toISOString(),
  } as ProgressEntry));
  
  // Sort by date descending on the client
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
};

export const getPlanProgressForUser = async (userId: string, planId: string): Promise<ProgressEntry[]> => {
  const progressCollectionRef = collection(db, 'users', userId, 'progress');
  const q = query(
      progressCollectionRef, 
      where('planId', '==', planId)
  );
  const querySnapshot = await getDocs(q);
  const entries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate().toISOString(),
  } as ProgressEntry));
  
  // Sort by date descending on the client
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return entries;
};

export const deleteProgressEntry = async (userId: string, entryId: string): Promise<void> => {
  if (!userId || !entryId) {
    throw new Error("User ID and Entry ID are required to delete a progress entry.");
  }
  const entryDocRef = doc(db, 'users', userId, 'progress', entryId);
  await deleteDoc(entryDocRef);
};

export const getUserPlanStatus = async (userId: string, planId: string): Promise<UserPlanStatus | null> => {
  if (!userId || !planId) return null;
  const statusDocRef = doc(db, 'users', userId, 'planStatus', planId);
  try {
    const docSnap = await getDoc(statusDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId,
        planId,
        completedDays: data.completedDays || [],
        startDate: (data.startDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        lastUpdated: (data.lastUpdated as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as UserPlanStatus;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user plan status for plan ${planId}:`, error);
    return null;
  }
};

export const updateUserPlanDayStatus = async (userId: string, planId: string, day: number, isCompleted: boolean): Promise<void> => {
  if (!userId || !planId) throw new Error("User ID and Plan ID are required.");

  const statusDocRef = doc(db, 'users', userId, 'planStatus', planId);
  const statusDocSnap = await getDoc(statusDocRef);

  if (statusDocSnap.exists()) {
    const currentCompletedDays: number[] = statusDocSnap.data().completedDays || [];
    let newCompletedDays: number[];

    if (isCompleted) {
      if (!currentCompletedDays.includes(day)) {
        newCompletedDays = [...currentCompletedDays, day];
      } else {
        newCompletedDays = currentCompletedDays;
      }
    } else {
      newCompletedDays = currentCompletedDays.filter(d => d !== day);
    }
    
    newCompletedDays.sort((a, b) => a - b);

    await updateDoc(statusDocRef, { 
      completedDays: newCompletedDays,
      lastUpdated: serverTimestamp() 
    });
  } else {
    // First time user is interacting with this plan's progress
    await setDoc(statusDocRef, {
      userId,
      planId,
      completedDays: isCompleted ? [day] : [],
      startDate: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
  }
};

export const getPlansByIds = async (planIds: string[]): Promise<Plan[]> => {
  if (planIds.length === 0) {
    return [];
  }

  const plans: Plan[] = [];
  const CHUNK_SIZE = 30;

  for (let i = 0; i < planIds.length; i += CHUNK_SIZE) {
    const chunk = planIds.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      const plansQuery = query(collection(db, 'plans'), where(documentId(), 'in', chunk));
      const querySnapshot = await getDocs(plansQuery);

      for (const planDoc of querySnapshot.docs) {
        const planData = planDoc.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp };
        
        // This is a lean version for filtering, but now includes duration
        plans.push({
          id: planDoc.id,
          name: planData.name,
          duration: planData.duration, // <-- ADDED
        } as Plan); 
      }
    }
  }
  return plans;
};

export const getAllUserPlanStatuses = async (userId: string): Promise<UserPlanStatus[]> => {
    if (!userId) return [];
    const statusCollectionRef = collection(db, 'users', userId, 'planStatus');
    try {
      const querySnapshot = await getDocs(statusCollectionRef);
      if (querySnapshot.empty) {
        return [];
      }
      return querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId,
          planId: data.planId,
          completedDays: data.completedDays || [],
          startDate: (data.startDate as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
          lastUpdated: (data.lastUpdated as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        } as UserPlanStatus;
      });
    } catch (error) {
      console.error(`Error fetching all user plan statuses for user ${userId}:`, error);
      return []; // Return empty array on error
    }
};

export const getAllPurchasedPlans = async (userId: string): Promise<Plan[]> => {
  const purchasedPlansCollectionRef = collection(db, 'users', userId, 'purchasedPlans');
  const snapshot = await getDocs(purchasedPlansCollectionRef);
  const purchasedPlanIds = snapshot.docs.map(doc => doc.id);

  if (purchasedPlanIds.length === 0) {
    return [];
  }

  const plans: Plan[] = [];
  const CHUNK_SIZE = 30; 

  for (let i = 0; i < purchasedPlanIds.length; i += CHUNK_SIZE) {
    const chunk = purchasedPlanIds.slice(i, i + CHUNK_SIZE);
    if (chunk.length > 0) {
      const plansQuery = query(collection(db, 'plans'), where(documentId(), 'in', chunk));
      const querySnapshot = await getDocs(plansQuery);

      for (const planDoc of querySnapshot.docs) {
        const planData = planDoc.data() as Omit<Plan, 'id' | 'exercises' | 'createdAt' | 'updatedAt'> & { createdAt?: Timestamp, updatedAt?: Timestamp };

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
          trainerName: trainerName || 'Unknown Trainer',
          trainerAvatarUrl: trainerAvatarUrl || '',
          rating: planData.rating || 0,
          numberOfRatings: planData.numberOfRatings || 0,
          imageUrl: planData.imageUrl || '',
        } as Plan); 
      }
    }
  }
  return plans;
};

// CHAT FUNCTIONS

export const createOrGetChatRoom = async (userId1: string, userId2: string): Promise<ChatRoom> => {
  const chatRoomId = [userId1, userId2].sort().join('_');
  const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
  const chatRoomSnap = await getDoc(chatRoomRef);

  if (chatRoomSnap.exists()) {
    const data = chatRoomSnap.data();
    const deletedByData = data.deletedBy || {};
    
    // Convert Firestore Timestamps to ISO strings for the client
    const clientDeletedBy: {[key: string]: string} = {};
    Object.keys(deletedByData).forEach(key => {
        if (deletedByData[key] instanceof Timestamp) {
            clientDeletedBy[key] = deletedByData[key].toDate().toISOString();
        }
    });
    
    // Undelete chat for the user initiating it, if it was previously deleted.
    if (clientDeletedBy[userId1]) {
        delete clientDeletedBy[userId1];
        await updateDoc(chatRoomRef, {
            [`deletedBy.${userId1}`]: deleteField()
        });
    }

    return { 
        id: chatRoomSnap.id, 
        ...data,
        participants: data.participants || {},
        updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
        lastMessageTimestamp: (data.lastMessageTimestamp as Timestamp)?.toDate().toISOString() || undefined,
        deletedBy: clientDeletedBy
    } as ChatRoom;
  } else {
    const user1Profile = await getUserById(userId1);
    const user2Profile = await getUserById(userId2);

    if (!user1Profile || !user2Profile) {
      throw new Error("One or both user profiles not found for chat room creation.");
    }

    const newChatRoomData = {
      participantIds: [userId1, userId2],
      participants: {
        [userId1]: { name: user1Profile.name, avatarUrl: user1Profile.avatarUrl || '', role: user1Profile.role },
        [userId2]: { name: user2Profile.name, avatarUrl: user2Profile.avatarUrl || '', role: user2Profile.role }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
      lastMessageSenderId: '',
      readBy: [],
      deletedBy: {},
    };

    await setDoc(chatRoomRef, newChatRoomData);
    const newSnap = await getDoc(chatRoomRef);
    const newSnapData = newSnap.data();
    return { 
        id: newSnap.id, 
        ...newSnapData,
        updatedAt: (newSnapData?.updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    } as ChatRoom;
  }
};


export const getChatRoomsForUser = async (userId: string): Promise<ChatRoom[]> => {
  const chatRoomsRef = collection(db, 'chatRooms');
  // Removed orderBy to avoid needing a composite index. Sorting will be done on the client.
  const q = query(chatRoomsRef, where('participantIds', 'array-contains', userId));

  try {
    const querySnapshot = await getDocs(q);
    const rooms = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    } as ChatRoom));

    // Sort the rooms by updatedAt timestamp in descending order in the code.
    rooms.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    });

    return rooms;

  } catch (error: any) {
    console.error("Error fetching chat rooms:", error);
    // This specific error might not be hit anymore, but it's good to keep as a safeguard.
    if (error.code === 'failed-precondition' && error.message.toLowerCase().includes("query requires an index")) {
        console.error(
          `\n\n[data.ts] Firestore query in getChatRoomsForUser still requires an index.\n` +
          `The query involved filtering on 'participantIds'. If this error persists, an index might be needed even without ordering.\n`
        );
        return [];
    }
    throw error;
  }
};

export const sendMessage = async (chatRoomId: string, senderId: string, text: string): Promise<void> => {
  const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
  const messagesRef = collection(chatRoomRef, 'messages');
  
  const newMessage: Omit<ChatMessage, 'id' | 'timestamp'> & { timestamp: any } = {
    chatRoomId,
    senderId,
    text,
    readBy: [senderId],
    timestamp: serverTimestamp(),
  };

  await runTransaction(db, async (transaction) => {
    const chatRoomSnap = await transaction.get(chatRoomRef);
    if (!chatRoomSnap.exists()) {
        throw new Error("Chat room does not exist!");
    }
    const chatRoomData = chatRoomSnap.data();

    // 1. Add the new message
    transaction.set(doc(messagesRef), newMessage);

    const updateData: {[key: string]: any} = {
      lastMessage: text,
      lastMessageSenderId: senderId,
      updatedAt: serverTimestamp(),
      readBy: [senderId],
    };

    // "Undelete" the chat for both participants if they had previously deleted it
    // so they can see the new message.
    chatRoomData.participantIds.forEach((pid: string) => {
        if (chatRoomData.deletedBy?.[pid]) {
            updateData[`deletedBy.${pid}`] = deleteField();
        }
    });

    // 2. Update the parent chatRoom document
    transaction.update(chatRoomRef, updateData);
  });
};

export const markChatRoomAsRead = async (chatRoomId: string, userId: string): Promise<void> => {
  const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
  try {
    const chatRoomSnap = await getDoc(chatRoomRef);
    if (chatRoomSnap.exists()) {
      const roomData = chatRoomSnap.data();
      const readBy: string[] = roomData.readBy || [];
      if (!readBy.includes(userId)) {
        await updateDoc(chatRoomRef, {
          readBy: [...readBy, userId]
        });
      }
    }
  } catch (error) {
    console.error(`Error marking chat room ${chatRoomId} as read for user ${userId}:`, error);
    // Don't throw, as this is not a critical failure for the user experience
  }
};

export const markMessagesAsRead = async (chatRoomId: string, userId: string): Promise<void> => {
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const queryToUpdate = query(messagesRef, where('senderId', '!=', userId));
    
    try {
      const messagesToUpdateSnap = await getDocs(queryToUpdate);
      const batch = writeBatch(db);
      messagesToUpdateSnap.docs.forEach(docSnap => {
          const message = docSnap.data() as ChatMessage;
          // Ensure readBy is an array before checking
          if (Array.isArray(message.readBy) && !message.readBy.includes(userId)) {
              batch.update(docSnap.ref, { readBy: arrayUnion(userId) });
          } else if (!Array.isArray(message.readBy)) {
              // Handle case where readBy might be missing or not an array
              batch.update(docSnap.ref, { readBy: [userId] });
          }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
};

export const deleteMessage = async (chatRoomId: string, messageId: string, userId: string): Promise<void> => {
    const messageRef = doc(db, 'chatRooms', chatRoomId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
  
    if (!messageSnap.exists() || messageSnap.data().senderId !== userId) {
      throw new Error("Message not found or you don't have permission to delete it.");
    }
  
    const deletedMessageText = "This message was deleted";
    await updateDoc(messageRef, {
      text: deletedMessageText,
      isDeleted: true,
    });
  
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    const q = query(collection(chatRoomRef, 'messages'), orderBy('timestamp', 'desc'), firestoreLimit(1));
    const latestMessageSnap = await getDocs(q);
    
    // If the message being deleted is the most recent one, update the chatroom's last message preview.
    if (!latestMessageSnap.empty && latestMessageSnap.docs[0].id === messageId) {
        await updateDoc(chatRoomRef, {
            lastMessage: deletedMessageText,
        });
    }
};

export const deleteChatForUser = async (chatRoomId: string, userId: string): Promise<void> => {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    // Use dot notation to update a field in a map
    await updateDoc(chatRoomRef, {
        [`deletedBy.${userId}`]: serverTimestamp()
    });
};

// PAYMENT / PURCHASE FUNCTIONS

export const hasUserPurchasedPlan = async (userId: string, planId: string): Promise<boolean> => {
  if (!userId || !planId) return false;
  const purchaseDocRef = doc(db, 'users', userId, 'purchasedPlans', planId);
  try {
    const docSnap = await getDoc(purchaseDocRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`Error checking purchase status for user ${userId} on plan ${planId}:`, error);
    return false; // Fail safe
  }
};

export const grantPlanAccess = async (userId: string, plan: Plan, razorpayPaymentId: string): Promise<void> => {
  if (!userId || !plan || !plan.id) throw new Error("User ID and Plan are required to grant access.");
  
  const batch = writeBatch(db);

  // 1. Grant user access by creating a doc in their `purchasedPlans` subcollection
  const purchaseDocRef = doc(db, 'users', userId, 'purchasedPlans', plan.id);
  const purchaseData: Omit<PurchasedPlan, 'id' | 'purchasedAt'> & { purchasedAt: any } = {
    userId,
    planId: plan.id,
    purchasedAt: serverTimestamp(),
    razorpayPaymentId: razorpayPaymentId,
  };
  batch.set(purchaseDocRef, purchaseData);

  // 2. Record the sale in a top-level `sales` collection for easy earnings tracking
  const saleDocRef = doc(collection(db, 'sales'));
  const saleData = {
    planId: plan.id,
    planName: plan.name,
    price: plan.price,
    trainerId: plan.trainerId,
    purchaserId: userId,
    purchasedAt: serverTimestamp(),
    razorpayPaymentId,
  };
  batch.set(saleDocRef, saleData);

  await batch.commit();
};

export const getSalesByTrainer = async (trainerId: string): Promise<Sale[]> => {
  if (!trainerId) return [];
  const salesCollectionRef = collection(db, 'sales');
  // Removed orderBy to sort on client and avoid needing a composite index
  const q = query(salesCollectionRef, where('trainerId', '==', trainerId));

  try {
    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        purchasedAt: (data.purchasedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      } as Sale;
    });

    // Sort client-side to avoid needing an index
    sales.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    return sales;

  } catch (error: any) {
    if (error.code === 'failed-precondition' && error.message.toLowerCase().includes("query requires an index")) {
        console.error(
          `\n\n[CRITICAL FIX REQUIRED IN FIREBASE CONSOLE]\n` +
          `[data.ts] Firestore query in getSalesByTrainer failed because a composite index is missing for the 'sales' collection.\n` +
          `Please create an index on the 'sales' collection with fields: 'trainerId' (Ascending) and 'purchasedAt' (Descending).\n` +
          `The error message is: ${error.message}\n` +
          `Returning empty array. The earnings page will show no data.\n\n`
        );
        return [];
    }
    console.error(`Error fetching sales for trainer ${trainerId}:`, error);
    throw error;
  }
};
