import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  username: string;
  user_metadata?: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Helper function to convert Supabase user to our User type
  const convertUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;

    // Extract username from email (remove @gmail.com)
    const username = supabaseUser.user_metadata?.username || 
                     supabaseUser.email?.split('@')[0] || 
                     'user';

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      username: username,
      user_metadata: supabaseUser.user_metadata
    };
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(convertUser(session?.user ?? null));
      setIsLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUser(convertUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(usernameOrEmail: string, password: string) {
    try {
      let email = usernameOrEmail;
      
      // If input doesn't contain @, assume it's a username and add @gmail.com
      if (!usernameOrEmail.includes('@')) {
        email = `${usernameOrEmail.toLowerCase()}@gmail.com`;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (data.user) {
        setIsAuthenticated(true);
        setUser(convertUser(data.user));
        return { success: true };
      }

      return { 
        success: false, 
        error: 'Login failed' 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'An error occurred during login' 
      };
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
