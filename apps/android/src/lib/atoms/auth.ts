// Auth types - kept for reference in other files
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string;
  fullname: string;
  avatar?: string;
  bio?: string;
  role: string;
};

// Note: Token storage is now handled directly in mutations via SecureStore
// Auth state is derived from React Query's /me query
// This file only exports types for reference

