
"use client";

import type { User, Trainer } from '@/types';
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { auth, db } from '@/lib/firebase'; // Import auth and db
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  type User as FirebaseUser // Alias Firebase's User type
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getUserById, getTrainerById } from '@/lib/data'; // For fetching profiles

interface AuthContextType {
  user: User | Trainer | null;
  login: (email: string, password: string, roleAttempt: 'member' | 'trainer') => Promise<void>;
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
        // User is signed in, try to load profile from localStorage first for quicker UI update
        const storedUserString = localStorage.getItem('fitjourney-user');
        let appUser: User | Trainer | null = null;

        if (storedUserString) {
          try {
            const storedUser = JSON.parse(storedUserString);
            // Basic check to see if stored user matches firebaseUser UID
            if (storedUser && storedUser.id === firebaseUser.uid) {
              appUser = storedUser;
            }
          } catch (e) {
            console.error("Failed to parse stored user:", e);
            localStorage.removeItem('fitjourney-user'); // Clear invalid stored user
          }
        }
        
        // If not in localStorage or doesn't match, fetch from Firestore
        // This also helps refresh data if it changed in Firestore since last login
        if (!appUser) {
            // We need to know the role to fetch.
            // This is tricky without knowing what role they last logged in as.
            // For simplicity, we'll try to infer or prioritize trainer role if a trainer doc exists.
            // A more robust solution might involve storing the last attempted role or having a unified user profile.
            let fetchedProfile = await getTrainerById(firebaseUser.uid);
            if (fetchedProfile) {
                appUser = {
                    ...fetchedProfile, // Trainer specific fields
                    id: firebaseUser.uid, // Ensure Firebase UID is the ID
                    email: firebaseUser.email || fetchedProfile.email, // Prefer Firebase email
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
          // Firebase user exists but no Firestore profile found for common roles
          // This could mean the profile needs to be created or is under a different structure
          console.warn(`User ${firebaseUser.uid} authenticated with Firebase, but no matching profile found in Firestore (users or trainers).`);
          // Fallback to basic Firebase user info, may lack app-specific roles/data
          setUser({ id: firebaseUser.uid, email: firebaseUser.email || "", name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User", role: 'member' }); 
        }

      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('fitjourney-user');
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const login = async (email: string, password: string, roleAttempt: 'member' | 'trainer') => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      let appUser: User | Trainer | null = null;

      if (roleAttempt === 'trainer') {
        const trainerProfile = await getTrainerById(firebaseUser.uid);
        if (trainerProfile) {
          appUser = { 
            ...trainerProfile, 
            id: firebaseUser.uid, 
            email: firebaseUser.email || trainerProfile.email, // Prefer Firebase email
            role: 'trainer'
          };
        } else {
          throw new Error(`Trainer profile not found for ${email}. Ensure a trainer document exists in Firestore.`);
        }
      } else { // roleAttempt === 'member'
        const memberProfile = await getUserById(firebaseUser.uid);
        if (memberProfile) {
          appUser = { 
            ...memberProfile, 
            id: firebaseUser.uid, 
            email: firebaseUser.email || memberProfile.email, // Prefer Firebase email
            role: 'member' 
          };
        } else {
          // Option: Create a member profile here if it doesn't exist, or throw error.
          // For now, we'll throw error if profile is expected but not found.
          // A more complete app might auto-create a basic member profile.
          console.warn(`Member profile not found for ${email}. A basic profile will be used.`);
           appUser = { id: firebaseUser.uid, email: firebaseUser.email || "", name: firebaseUser.displayName || email.split('@')[0], role: 'member' };
          // throw new Error(`Member profile not found for ${email}. Ensure a user document exists in Firestore.`);
        }
      }
      
      setUser(appUser); // This will be set by onAuthStateChanged as well, but good for immediate UI
      localStorage.setItem('fitjourney-user', JSON.stringify(appUser));
      setLoading(false);

    } catch (error: any) {
      setLoading(false);
      console.error("Firebase Login Error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("Invalid email or password.");
      } else if (error.message.includes("profile not found")) {
          throw error; // re-throw custom profile errors
      }
      throw new Error(error.message || "An unknown login error occurred.");
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
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
