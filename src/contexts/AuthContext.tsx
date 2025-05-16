
"use client";

import type { User, Trainer } from '@/types';
import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { mockUsers, mockTrainers } from '@/lib/data'; // Assuming mock users are defined here

interface AuthContextType {
  user: User | Trainer | null;
  login: (email: string, roleSwitch?: 'member' | 'trainer') => Promise<void>; // Added roleSwitch for testing
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
    // Check for stored user session (e.g., in localStorage)
    const storedUser = localStorage.getItem('fitjourney-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, roleSwitch?: 'member' | 'trainer') => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let foundUser: User | Trainer | undefined = mockTrainers.find(u => u.email === email);
    if (!foundUser) {
      foundUser = mockUsers.find(u => u.email === email);
    }

    if (foundUser) {
      // For testing, allow switching role if roleSwitch is provided
      if (roleSwitch) {
        const baseUser = { ...foundUser, role: roleSwitch };
        if (roleSwitch === 'trainer' && !('bio' in baseUser)) {
          // If switching to trainer and it was a base member, add trainer fields
          const trainerVersion = mockTrainers.find(t => t.id === baseUser.id) || { bio: 'Default Trainer Bio', specializations: ['Fitness']};
          setUser({...baseUser, ...trainerVersion, role: 'trainer'});
        } else {
          setUser(baseUser);
        }
      } else {
         setUser(foundUser);
      }
      localStorage.setItem('fitjourney-user', JSON.stringify(foundUser)); // Persist user
    } else {
      // For demo purposes, create a new member user if not found
      const newUser: User = { id: Date.now().toString(), name: email.split('@')[0], email, role: 'member' };
      setUser(newUser);
      localStorage.setItem('fitjourney-user', JSON.stringify(newUser));
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fitjourney-user'); // Clear persisted user
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
