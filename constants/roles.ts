import type { UserRole } from '@/types/Auth';

export const USER_ROLES: UserRole[] = [
  'Guest',
  'FreeUser',
  'PremiumUser',
  'Admin',
];

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  Guest: 0,
  FreeUser: 1,
  PremiumUser: 2,
  Admin: 3,
};
