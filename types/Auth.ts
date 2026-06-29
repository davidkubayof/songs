export type UserRole = 'Guest' | 'FreeUser' | 'PremiumUser' | 'Admin';

export interface Profile {
  id: string;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
}
