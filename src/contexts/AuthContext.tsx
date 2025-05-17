
"use client";

import type { User, Trainer } from '@/types';
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, // Import createUserWithEmailAndPassword
  signOut as firebaseSignOut, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import setDoc
import { getUserById, getTrainerById } from '@/lib/data';

interface AuthContextType {
  user: User | Trainer | null;
  login: (email: string, password: string, roleAttempt: 'member' | 'trainer') => Promise<void>;
  register: (name: string, email: string, password: string, role: 'member' | 'trainer') => Promise<void>; // Add register
  logout: () => Promise<void>;
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
            // Try to determine role. If just registered, localStorage won't have the role hint.
            // Attempt to fetch trainer first, then member.
            // This logic might need refinement if the user's role changes or is not set during registration.
            let fetchedProfile = await getTrainerById(firebaseUser.uid);
            if (fetchedProfile && fetchedProfile.role === 'trainer') { // Double check role from Firestore
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
          console.warn(`User ${firebaseUser.uid} authenticated with Firebase, but no matching profile found in Firestore. This can happen if registration didn't complete Firestore profile creation.`);
          // Fallback to basic Firebase user info, but this user won't have app-specific role functionality.
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

      // Fetch profile based on roleAttempt from Firestore
      if (roleAttempt === 'trainer') {
        const trainerProfile = await getTrainerById(firebaseUser.uid);
        if (trainerProfile && trainerProfile.role === 'trainer') { // Ensure fetched profile also has trainer role
          appUser = { 
            ...trainerProfile, 
            id: firebaseUser.uid, 
            email: firebaseUser.email || trainerProfile.email,
            role: 'trainer'
          };
        } else {
          await firebaseSignOut(auth); // Sign out if role doesn't match
          throw new Error(`Trainer profile not found for ${email} or role mismatch.`);
        }
      } else { 
        const memberProfile = await getUserById(firebaseUser.uid);
        if (memberProfile && memberProfile.role === 'member') { // Ensure fetched profile also has member role
          appUser = { 
            ...memberProfile, 
            id: firebaseUser.uid, 
            email: firebaseUser.email || memberProfile.email,
            role: 'member' 
          };
        } else {
           await firebaseSignOut(auth); // Sign out if role doesn't match
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

      // Create profile in Firestore
      const userProfileData = {
        id: firebaseUser.uid, // Not strictly needed in document data if ID is the doc ID
        name,
        email: firebaseUser.email, // Use email from Firebase Auth user
        role,
      };

      if (role === 'trainer') {
        const trainerDocRef = doc(db, 'trainers', firebaseUser.uid);
        await setDoc(trainerDocRef, {
          ...userProfileData,
          // Add any default trainer-specific fields if needed, e.g., bio: "", specializations: []
          bio: "",
          specializations: [],
          avatarUrl: "", // Default or placeholder
        });
      } else { // 'member'
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, userProfileData);
      }

      // onAuthStateChanged will handle setting the user state
      // No need to call setUser or localStorage here directly, as onAuthStateChanged will pick up the new user
      // and fetch the profile.

      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error("Firebase Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email address is already in use.");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("Password is too weak. It should be at least 6 characters.");
      } else if (error.code === 'auth/invalid-email') {
        throw new Error("The email address is not valid.");
      }
      throw new Error(error.message || "An unknown registration error occurred.");
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // setUser(null) and localStorage clear is handled by onAuthStateChanged
    } catch (error) {
      console.error("Firebase Logout Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
