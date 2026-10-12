'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type Role } from '@/lib/auth-store';
import { homePathFor } from '@/lib/routes';


export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const router = useRouter();
  const { token, user, doctorProfile, hydrated, hydrate } = useAuthStore();
  const wrongRole = !!user && !!roles && !roles.includes(user.role);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login');
    else if (wrongRole) router.replace(homePathFor(user, doctorProfile));
  }, [hydrated, token, wrongRole, user, doctorProfile, router]);

  if (!hydrated || !token || wrongRole) return <p className="p-6 text-sm">Checking your session...</p>;
  return <>{children}</>;
}