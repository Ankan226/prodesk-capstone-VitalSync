'use client';

import { useCallback, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShell from '@/components/DashboardShell';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';
import { errorMessage, formatDate } from '@/lib/helpers';

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
        .catch((e) => setError(errorMessage(e)))
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
      setError(errorMessage(e));
    }
  }

  return (
    <DashboardShell title="Doctor Approvals" subtitle="Verify each doctor's license before they appear to patients.">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending approvals" value={loaded ? doctors.length : '-'} />
      </div>

      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Specialty</th>
              <th className="p-3">License</th>
              <th className="p-3">Experience</th>
              <th className="p-3">Applied</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loaded && doctors.length === 0 && (
              <tr><td colSpan={7} className="p-3 text-gray-500">No pending applications.</td></tr>
            )}
            {doctors.map((d) => (
              <tr key={d.id} className="border-t border-gray-200">
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.email}</td>
                <td className="p-3">{d.specialty}</td>
                <td className="p-3">{d.licenseNo}</td>
                <td className="p-3">{d.yearsOfExperience ?? '-'}</td>
                <td className="p-3">{formatDate(d.submittedAt.slice(0, 10))}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => act(d.id, 'approve')} className="rounded bg-blue-600 px-3 py-1 text-white">Approve</button>
                    <button onClick={() => act(d.id, 'reject')} className="rounded border border-gray-400 px-3 py-1">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AdminContent />
    </ProtectedRoute>
  );
}