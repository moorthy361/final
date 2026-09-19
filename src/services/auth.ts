import { requestApi, setAccessToken } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: AuthUser;
}

let authenticated = false;

/** Authentication calls are centralized here so the development adapter can be
 * swapped for the database/session implementation without touching UI pages. */
export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await requestApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(response.access_token);
  authenticated = true;
  return response.user;
}

export async function logout(): Promise<void> {
  try {
    await requestApi<void>('/auth/logout', { method: 'POST' });
  } finally {
    setAccessToken(null);
    authenticated = false;
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  return requestApi<AuthUser>('/auth/me');
}

export function isAuthenticated(): boolean {
  return authenticated;
}
