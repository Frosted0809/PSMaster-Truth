import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  connectionError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const fetchInProgress = React.useRef<string | null>(null);
  const currentUserIdRef = React.useRef<string | null>(null);

  const fetchProfile = async (userId: string, retryCount = 0) => {
    // Prevent redundant parallel fetches for the same user
    if (fetchInProgress.current === userId && retryCount === 0) {
      return;
    }
    
    fetchInProgress.current = userId;
    if (retryCount === 0) {
      setProfileLoading(true);
      setConnectionError(null);
    }

    try {
      // Very generous timeout for profile fetch because of potential cold starts
      const timeoutMs = retryCount === 0 ? 120000 : 60000; 
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
      );

      console.log(`Fetching profile for ${userId} (attempt ${retryCount + 1})...`);
      
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data, error }: any = await Promise.race([query, timeoutPromise]);
      
      if (error) {
        // If profile doesn't exist, try to create it (self-healing)
        if (error.code === 'PGRST116') {
          console.log('Profile missing, attempting to create...');
          const email = user?.email || '';
          const isStudentLocal = email.endsWith('@student.local');
          const username = isStudentLocal ? email.split('@')[0] : null;
          
          // Super admin check
          const isSuperAdmin = email === 'hanselluis0809@gmail.com';
          const role = isSuperAdmin ? 'admin' : (email.endsWith('@admin.com') ? 'admin' : 'student');
          const is_approved = isSuperAdmin || role === 'admin';

          const { data: newData, error: insertError } = await supabase
            .from('profiles')
            .insert([{ 
              id: userId, 
              email, 
              username,
              role, 
              is_approved 
            }])
            .select()
            .single();
            
          if (insertError) throw insertError;
          setProfile(newData as UserProfile);
          fetchInProgress.current = null;
          setProfileLoading(false);
          return;
        }
        throw error;
      }
      setProfile(data as UserProfile);
      fetchInProgress.current = null;
      setProfileLoading(false);
    } catch (err: any) {
      console.error(`Error fetching profile (attempt ${retryCount + 1}):`, err);
      
      if (err.message === 'Failed to fetch') {
        setConnectionError('Could not connect to the database. Please check your Supabase project status or your internet connection.');
      }
      
      if (retryCount < 4 && (err.message === 'Profile fetch timeout' || !err.status || err.message === 'Failed to fetch')) {
        // Incremental delay: 3s, 6s, 9s, 12s...
        const delay = 3000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchProfile(userId, retryCount + 1);
      }
      
      fetchInProgress.current = null;
      setProfile(null);
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Safety timeout to ensure app eventually renders
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 15000); 

    // Check active sessions and sets up listener
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_refresh_token')) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          } else {
            throw error;
          }
        } else if (session?.user) {
          setUser(session.user);
          currentUserIdRef.current = session.user.id;
          // Start fetching profile, but don't block isLoading if it's slow
          fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
        clearTimeout(timer);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === ('SIGNED_OUT' as any) || event === ('USER_DELETED' as any) || !session) {
          setUser(null);
          setProfile(null);
          currentUserIdRef.current = null;
          setIsLoading(false);
          return;
        }

        // Only fetch if it's a new user or explicitly requested (like SIGNED_IN)
        if (currentUserIdRef.current !== session.user.id || event === 'SIGNED_IN') {
          setUser(session.user);
          currentUserIdRef.current = session.user.id;
          fetchProfile(session.user.id);
        }
      } catch (err: any) {
        console.error('Auth change handling error:', err);
        if (err?.message?.includes('Refresh Token Not Found') || err?.message?.includes('invalid_refresh_token')) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          currentUserIdRef.current = null;
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Clear local state immediately for instant UI feedback
    setUser(null);
    setProfile(null);
    
    try {
      // Try to notify the server, but don't hang if it's slow
      // We use a silent timeout transition
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 1000))
      ]);
    } catch (err) {
      // Ignore background signout errors after local state is already cleared
      console.log('Background signout cleanup:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, profileLoading, signOut, connectionError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
