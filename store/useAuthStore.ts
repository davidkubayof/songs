import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';

import { createClient } from '@/lib/supabase';
import { restoreDeletedUser } from '@/lib/restoreDeletedUser';
import {
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from '@/services/authService';
import { fetchProfile } from '@/services/ProfileService';
import { usePlaylistStore } from '@/store/usePlaylistStore';
import type { Profile, UserRole } from '@/types/Auth';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

async function loadAuth(): Promise<Pick<AuthState, 'user' | 'profile' | 'role'>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, role: 'Guest' };
  const profile = await fetchProfile(supabase, user.id);
  if (!profile) {
    await signOutUser();
    return { user: null, profile: null, role: 'Guest' };
  }
  return { user, profile, role: profile.role };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: 'Guest',
  isLoading: true,
  initialize: async () => {
    set({ isLoading: true });
    const auth = await loadAuth();
    set({ ...auth, isLoading: false });
  },
  signInEmail: async (email, password) => {
    await signInWithEmail(email, password);
    const supabase = createClient();
    await restoreDeletedUser(supabase);
    set(await loadAuth());
    usePlaylistStore.setState({ isHydrated: false });
    await usePlaylistStore.getState().hydrate();
  },
  signUpEmail: async (email, password) => {
    await signUpWithEmail(email, password);
    set(await loadAuth());
    usePlaylistStore.setState({ isHydrated: false });
    await usePlaylistStore.getState().hydrate();
  },
  signInGoogle: async () => {
    await signInWithGoogle();
  },
  signOut: async () => {
    await signOutUser();
    set({ user: null, profile: null, role: 'Guest' });
    usePlaylistStore.setState({ tracks: [], isHydrated: false });
    await usePlaylistStore.getState().hydrate();
  },
  requestPasswordReset: async (email) => {
    await resetPassword(email);
  },
}));
