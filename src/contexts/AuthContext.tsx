
"use client";

import type { User, Trainer } from '@/types';
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail, // Import sendPasswordResetEmail
  signOut as firebaseSignOut, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getUserById, getTrainerById } from '@/lib/data';

interface AuthContextType {
  user: User | Trainer | null;
  login: (email: string, password: string, roleAttempt: 'member' | 'trainer') => Promise<void>;
  register: (name: string, email: string, password: string, role: 'member' | 'trainer') => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>; // Add sendPasswordReset
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | Trainer | null>(null);
  const [loading, setLoading] = useState(true);

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
        
        if (!appUser) {
            let fetchedProfile = await getTrainerById(firebaseUser.uid);
            if (fetchedProfile && fetchedProfile.role === 'trainer') {
                appUser = {
                    ...fetchedProfile,
                    id: firebaseUser.uid,
                    email: firebaseUser.email || fetchedProfile.email,
                    role: 'trainer',
                };
            } else {
                const memberProfile = await getUserById(firebaseUser.uid);
                if (memberProfile) {
                    appUser = {
                        ...memberProfile,
                        id: firebaseUser.uid,
                        email: firebaseUser.email || memberProfile.email,
                        role: 'member',
                    };
                }
            }
        }

        if (appUser) {
          setUser(appUser);
          localStorage.setItem('fitjourney-user', JSON.stringify(appUser));
        } else {
          console.warn(`User ${firebaseUser.uid} authenticated with Firebase, but no matching profile found in Firestore.`);
           setUser({ id: firebaseUser.uid, email: firebaseUser.email || "", name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User", role: 'member' }); 
        }

      } else {
        setUser(null);
        localStorage.removeItem('fitjourney-user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
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

      const userProfileData = {
        name,
        email: firebaseUser.email,
        role,
      };

      if (role === 'trainer') {
        const trainerDocRef = doc(db, 'trainers', firebaseUser.uid);
        await setDoc(trainerDocRef, {
          ...userProfileData,
          bio: "",
          specializations: [],
          avatarUrl: "",
        });
      } else {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, userProfileData);
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
        // Don't reveal if user exists, for security. Firebase handles this, but good to be aware.
        // The toast message in the component is generic for this reason.
         throw new Error("If your email is registered, you will receive a reset link.");
      }
      throw new Error(error.message || "Could not send password reset email.");
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
    <AuthContext.Provider value={{ user, login, register, logout, sendPasswordReset, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
