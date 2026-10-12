'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function LogoutButton() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <button
      onClick={() => {
        logout();
        router.replace('/login');
      }}
      className="rounded border border-gray-400 px-4 py-2 text-sm"
    >
      Log out
    </button>
  );
}