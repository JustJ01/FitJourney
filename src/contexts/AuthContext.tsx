
"use client";

import type { User, Trainer, UserProfileUpdateData, TrainerProfileUpdateData } from '@/types';
import React, { createContext, useState, useEffect, type ReactNode, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getUserById, getTrainerById, updateUserInFirestore, updateTrainerInFirestore } from '@/lib/data';

interface AuthContextType {
  user: User | Trainer | null;
  login: (email: string, password: string, roleAttempt: 'member' | 'trainer') => Promise<void>;
  register: (name: string, email: string, password: string, role: 'member' | 'trainer') => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (data: UserProfileUpdateData | TrainerProfileUpdateData) => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const canUpdatePresence = useRef(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true);
      if (firebaseUser) {
        const storedUserString = localStorage.getItem('fitjourney-user');
        let appUser: User | Trainer | null = null;

        if (storedUserString) {
          try {
            const storedUser = JSON.parse(storedUserString);
            if (storedUser && storedUser.id === firebaseUser.uid) {
              appUser = storedUser; 
            }
          } catch (e) {
            console.error("Failed to parse stored user:", e);
            localStorage.removeItem('fitjourney-user');
          }
        }
        
        let roleToFetch: 'member' | 'trainer' = 'member'; 
        if (appUser) {
            roleToFetch = appUser.role;
        } else {
            const trainerProfileCheck = await getTrainerById(firebaseUser.uid);
            if (trainerProfileCheck) {
                roleToFetch = 'trainer';
            } else {
                const memberProfileCheck = await getUserById(firebaseUser.uid);
                if (memberProfileCheck) {
                    roleToFetch = 'member';
                } else {
                    console.warn(`No user profile found for UID ${firebaseUser.uid} in either trainers or users collection during initial auth check.`);
                }
            }
        }

        if (roleToFetch === 'trainer') {
            const trainerProfile = await getTrainerById(firebaseUser.uid);
            if (trainerProfile) {
                 appUser = {
                    ...trainerProfile, 
                    id: firebaseUser.uid,
                    email: firebaseUser.email || trainerProfile.email, 
                };
            }
        } else { 
            const memberProfile = await getUserById(firebaseUser.uid);
             if (memberProfile) {
                appUser = {
                    ...memberProfile, 
                    id: firebaseUser.uid,
                    email: firebaseUser.email || memberProfile.email,
                };
            }
        }

        if (appUser) {
          setUser(appUser);
          localStorage.setItem('fitjourney-user', JSON.stringify(appUser));
        } else {
          console.warn(`User ${firebaseUser.uid} authenticated with Firebase, but no matching profile found in Firestore for determined role ${roleToFetch}. Logging out.`);
          await firebaseSignOut(auth); 
          setUser(null);
          localStorage.removeItem('fitjourney-user');
        }

      } else {
        setUser(null);
        localStorage.removeItem('fitjourney-user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!user) return;
  
    const updateUserPresence = async () => {
      if (!canUpdatePresence.current) return;
      canUpdatePresence.current = false;
      setTimeout(() => { canUpdatePresence.current = true; }, 60000); 
  
      const collectionName = user.role === 'trainer' ? 'trainers' : 'users';
      const userRef = doc(db, collectionName, user.id);
      try {
        await updateDoc(userRef, { lastSeen: serverTimestamp() });
      } catch (e) {
        console.error("Could not update user presence", e);
      }
    };
  
    const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'scroll', 'click'];
    
    activityEvents.forEach(event => {
        window.addEventListener(event, updateUserPresence);
    });
    

    updateUserPresence();
  
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserPresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateUserPresence);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const login = async (email: string, password: string, roleAttempt: 'member' | 'trainer') => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      let appUser: User | Trainer | null = null;

      if (roleAttempt === 'trainer') {
        const trainerProfile = await getTrainerById(firebaseUser.uid);
        if (trainerProfile && trainerProfile.role === 'trainer') {
          appUser = { 
            ...trainerProfile, 
            id: firebaseUser.uid, 
            email: firebaseUser.email || trainerProfile.email,
            role: 'trainer'
          };
        } else {
          await firebaseSignOut(auth);
          throw new Error(`Trainer profile not found for ${email} or role mismatch.`);
        }
      } else { 
        const memberProfile = await getUserById(firebaseUser.uid);
        if (memberProfile && memberProfile.role === 'member') {
          appUser = { 
            ...memberProfile, 
            id: firebaseUser.uid, 
            email: firebaseUser.email || memberProfile.email,
            role: 'member' 
          };
        } else {
           await firebaseSignOut(auth);
          throw new Error(`Member profile not found for ${email} or role mismatch.`);
        }
      }
      
      setUser(appUser); 
      localStorage.setItem('fitjourney-user', JSON.stringify(appUser));
      setLoading(false);

    } catch (error: any) {
      setLoading(false);
      console.error("Firebase Login Error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email' || error.code === 'auth/popup-closed-by-user') {
        throw new Error("Invalid email or password.");
      } else if (error.message.includes("profile not found") || error.message.includes("role mismatch")) {
          throw error; 
      }
      throw new Error(error.message || "An unknown login error occurred.");
    }
  };

  const register = async (name: string, email: string, password: string, role: 'member' | 'trainer') => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userProfileData: Partial<User | Trainer> & { lastSeen: any } = {
        name,
        email: firebaseUser.email, 
        role,
        avatarUrl: "",
        lastSeen: serverTimestamp(),
      };

      if (role === 'trainer') {
        const trainerDocRef = doc(db, 'trainers', firebaseUser.uid);
        await setDoc(trainerDocRef, {
          ...userProfileData,
          bio: "",
          specializations: [],
        } as Omit<Trainer, 'id'>);
      } else { 
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, userProfileData as Omit<User, 'id'>);
      }
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error("Firebase Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email address is already in use.");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("Password should be at least 6 characters.");
      } else if (error.code === 'auth/invalid-email') {
        throw new Error("The email address is not valid.");
      }
      throw new Error(error.message || "An unknown registration error occurred.");
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error("Password Reset Error:", error);
      if (error.code === 'auth/invalid-email') {
        throw new Error("The email address is not valid.");
      } else if (error.code === 'auth/user-not-found') {
         throw new Error("If your email is registered, you will receive a reset link.");
      }
      throw new Error(error.message || "Could not send password reset email.");
    }
  };

  const updateUserProfile = async (data: UserProfileUpdateData | TrainerProfileUpdateData) => {
    if (!user) throw new Error("User not logged in.");
    setLoading(true);
    try {
      // Create a clean object to send to Firestore, filtering out undefined values.
      const firestoreUpdateData: Partial<User | Trainer> = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      if (user.role === 'trainer') {
        await updateTrainerInFirestore(user.id, firestoreUpdateData as TrainerProfileUpdateData);
      } else { 
        await updateUserInFirestore(user.id, firestoreUpdateData as UserProfileUpdateData);
      }
      
      const updatedUser = { ...user, ...firestoreUpdateData };
      setUser(updatedUser);
      localStorage.setItem('fitjourney-user', JSON.stringify(updatedUser));

    } catch (error) {
      console.error("Error updating profile:", error);
      throw error; 
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Firebase Logout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, sendPasswordReset, updateUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
