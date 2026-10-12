'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

interface PendingDoctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  licenseNo: string;
  yearsOfExperience?: number;
  submittedAt: string;
}

function AdminContent() {
  const user = useAuthStore((s) => s.user);
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      api<{ doctors: PendingDoctor[] }>('/api/admin/doctors?status=pending')
        .then((data) => {
          setDoctors(data.doctors);
          setError('');
        })
        .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load applications'))
        .finally(() => setLoaded(true)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: 'approve' | 'reject') {
    let body: { reason: string } | undefined;
    if (action === 'reject') {
      const reason = window.prompt('Reason for rejection (at least 5 characters)');
      if (!reason) return;
      body = { reason };
    }
    try {
      await api(`/api/admin/doctors/${id}/${action}`, { method: 'PATCH', body });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Action failed');
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Signed in as {user?.name}</p>
        </div>
        <LogoutButton />
      </div>

      <h2 className="mb-2 text-lg font-semibold">Doctor approvals (pending: {doctors.length})</h2>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded border border-gray-300">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Specialty</th>
              <th className="p-2">License</th>
              <th className="p-2">Experience</th>
              <th className="p-2">Applied</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loaded && doctors.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-gray-500">No pending applications.</td></tr>
            )}
            {doctors.map((d) => (
              <tr key={d.id} className="border-t border-gray-200">
                <td className="p-2">{d.name}</td>
                <td className="p-2">{d.email}</td>
                <td className="p-2">{d.specialty}</td>
                <td className="p-2">{d.licenseNo}</td>
                <td className="p-2">{d.yearsOfExperience ?? '-'}</td>
                <td className="p-2">{new Date(d.submittedAt).toLocaleDateString()}</td>
                <td className="flex gap-2 p-2">
                  <button onClick={() => act(d.id, 'approve')} className="rounded bg-blue-600 px-3 py-1 text-white">Approve</button>
                  <button onClick={() => act(d.id, 'reject')} className="rounded border border-gray-400 px-3 py-1">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AdminContent />
    </ProtectedRoute>
  );
}