import { cookies } from 'next/headers';

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin' | 'pimpinan' | 'pelaksana';
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  
  if (!authCookie) return null;
  
  try {
    const user = JSON.parse(decodeURIComponent(authCookie));
    if (user && user.role === 'admin') {
      return user as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
