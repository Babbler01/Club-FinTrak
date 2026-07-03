import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  bypassAuthForDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // 1. Check if we have a simulated demo session in localStorage
    const savedDemoUser = localStorage.getItem('fintrak_demo_user');
    if (savedDemoUser) {
      setUser(JSON.parse(savedDemoUser));
      setIsDemoUser(true);
      setLoading(false);
      return;
    }

    // 2. If Supabase is available, subscribe to auth state changes
    if (supabase) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsDemoUser(false);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsDemoUser(false);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error };
        setSession(data.session);
        setUser(data.user);
        setIsDemoUser(false);
        return { error: null };
      } finally {
        setLoading(false);
      }
    } else {
      // Demo Mode login - accept any password
      const demoUser = {
        id: 'demo-treasurer-id',
        email: email,
        user_metadata: { full_name: 'Demo Treasurer' }
      };
      localStorage.setItem('fintrak_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsDemoUser(true);
      setLoading(false);
      return { error: null };
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    if (supabase) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: 'Club Treasurer'
            }
          }
        });
        if (error) return { error };
        return { error: null };
      } finally {
        setLoading(false);
      }
    } else {
      // Demo Mode signup - log in immediately
      return signIn(email, password);
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (isDemoUser) {
      localStorage.removeItem('fintrak_demo_user');
      setUser(null);
      setSession(null);
      setIsDemoUser(false);
      setLoading(false);
      return { error: null };
    }

    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) return { error };
        setUser(null);
        setSession(null);
        return { error: null };
      } finally {
        setLoading(false);
      }
    }

    setLoading(false);
    return { error: null };
  };

  const bypassAuthForDemo = () => {
    const demoUser = {
      id: 'demo-treasurer-id',
      email: 'treasurer@demo-club.org',
      user_metadata: { full_name: 'Demo Treasurer' }
    };
    localStorage.setItem('fintrak_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoUser(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isDemoUser,
      signIn,
      signUp,
      signOut,
      bypassAuthForDemo
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
