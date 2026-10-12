'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

function DoctorContent() {
  const router = useRouter();
  const { user, doctorProfile } = useAuthStore();
  const [message, setMessage] = useState('Loading protected data...');

  useEffect(() => {
    api<{ message: string }>('/api/doctor/dashboard')
      .then((data) => setMessage(data.message))
      .catch(() => router.replace('/doctor/pending'));
  }, [router]);

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-1 text-2xl font-bold">Doctor Dashboard</h1>
      <p className="mb-4 text-sm text-gray-500">Walking skeleton: your account is approved.</p>

      <div className="mb-4 rounded border border-gray-300 p-4 text-sm">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Specialty:</strong> {doctorProfile?.specialty}</p>
        <p><strong>License number:</strong> {doctorProfile?.licenseNo}</p>
        <p><strong>Status:</strong> {doctorProfile?.approvalStatus}</p>
      </div>

      <div className="mb-4 rounded border border-gray-300 p-4 text-sm">
        <strong>From the protected API:</strong> {message}
      </div>

      <LogoutButton />
    </main>
  );
}

export default function DoctorDashboardPage() {
  return (
    <ProtectedRoute roles={['doctor']}>
      <DoctorContent />
    </ProtectedRoute>
  );
}