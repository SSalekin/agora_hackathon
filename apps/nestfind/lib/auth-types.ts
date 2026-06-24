export type Role = 'tenant' | 'landlord' | 'moderator';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

export type AuthResponse = {
  success: boolean;
  user?: AuthUser;
  error?: string;
};

export const ROLE_REDIRECTS: Record<Role, string> = {
  tenant: '/tenant/dashboard',
  landlord: '/landlord/dashboard',
  moderator: '/moderator/dashboard',
};

export const ROLE_LABELS: Record<Role, string> = {
  tenant: 'Tenant',
  landlord: 'Landlord',
  moderator: 'Moderator',
};
