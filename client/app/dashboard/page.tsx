'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useAuthStore, type User } from '@/lib/auth-store';

function DashboardContent() {
  const router = useRouter();
  const { user, setAuth, logout } = useAuthStore();
  const [serverMessage, setServerMessage] = useState('Loading protected data...');

  useEffect(() => {
    api<{ user: User }>('/api/auth/me')
      .then((data) => {
        const token = useAuthStore.getState().token;
        if (token) setAuth(token, data.user);
      })
      .catch(() => {});


    api<{ message: string }>('/api/dashboard')
      .then((data) => setServerMessage(data.message))
      .catch(() => setServerMessage('Could not load protected data.'));
  }, [setAuth]);

  function onLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Patient Dashboard</h1>
      <p className="mb-4 text-sm text-gray-500">Walking skeleton: you are logged in.</p>

      <div className="mb-4 rounded border border-gray-300 p-4 text-sm">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>User ID:</strong> {user?.id}</p>
      </div>

      <div className="mb-4 rounded border border-gray-300 p-4 text-sm">
        <strong>From the protected API:</strong> {serverMessage}
      </div>

      <button onClick={onLogout} className="rounded border border-gray-400 px-4 py-2 text-sm">
        Log out
      </button>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      roles={['patient']}
      <DashboardContent />
    </ProtectedRoute>
  );
}