
"use client";

import type { User, Trainer } from '@/types';
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { mockUsers, mockTrainers } from '@/lib/data'; // Assuming mock users are defined here

interface AuthContextType {
  user: User | Trainer | null;
  login: (email: string, roleSwitch?: 'member' | 'trainer') => Promise<void>;
  logout: () => void;
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
    const storedUser = localStorage.getItem('fitjourney-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user:", e);
        localStorage.removeItem('fitjourney-user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, roleSwitch?: 'member' | 'trainer') => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    let finalUserToSet: User | Trainer | null = null;

    const potentialTrainer = mockTrainers.find(u => u.email === email);
    const potentialMember = mockUsers.find(u => u.email === email);

    if (roleSwitch === 'trainer') {
      if (potentialTrainer) {
        // Logging in as an existing trainer
        finalUserToSet = { ...potentialTrainer, role: 'trainer' };
      } else if (potentialMember) {
        // User exists as a member, "upgrade" to trainer for this session
        const trainerData = mockTrainers.find(t => t.id === potentialMember.id) || { bio: 'Default Trainer Bio', specializations: ['Fitness'] };
        finalUserToSet = { ...potentialMember, ...trainerData, role: 'trainer' };
      } else {
        // No existing user with this email, and attempting to log in as trainer
        setLoading(false);
        throw new Error(`Trainer account with email ${email} not found.`);
      }
    } else if (roleSwitch === 'member') {
      if (potentialMember) {
        // Logging in as an existing member
        finalUserToSet = { ...potentialMember, role: 'member' };
      } else if (potentialTrainer) {
        // User exists as a trainer, but logging in as member (strip trainer fields for session)
        const { bio, specializations, ...memberVersion } = potentialTrainer;
        finalUserToSet = { ...memberVersion, role: 'member' };
      } else {
        // No existing user, create new member
        finalUserToSet = { id: Date.now().toString(), name: email.split('@')[0], email, role: 'member' };
      }
    } else { 
      // Fallback if roleSwitch is not provided (should not happen with current LoginPage)
      // Prioritize trainer role if email matches, then member, then new member.
      if (potentialTrainer) {
        finalUserToSet = potentialTrainer;
      } else if (potentialMember) {
        finalUserToSet = potentialMember;
      } else {
        finalUserToSet = { id: Date.now().toString(), name: email.split('@')[0], email, role: 'member' };
      }
    }

    if (finalUserToSet) {
      setUser(finalUserToSet);
      localStorage.setItem('fitjourney-user', JSON.stringify(finalUserToSet));
    } else {
      // This case should ideally be covered by the "Trainer not found" error.
      // If it still reaches here, it's an unexpected login failure.
      setLoading(false);
      throw new Error("Login failed. Please check your credentials or role selection.");
    }

    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fitjourney-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
