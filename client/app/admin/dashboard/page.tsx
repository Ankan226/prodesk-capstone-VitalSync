'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShell from '@/components/DashboardShell';
import StatCard from '@/components/StatCard';
import ConfirmDialog from '@/components/ConfirmDialog';
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
  const [rejecting, setRejecting] = useState<PendingDoctor | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function act(d: PendingDoctor, action: 'approve' | 'reject', reason?: string) {
    setBusy(true);
    try {
      await api(`/api/admin/doctors/${d.id}/${action}`, { method: 'PATCH', body: reason ? { reason } : undefined });
      toast.success(action === 'approve' ? `${d.name} approved` : `${d.name} rejected`);
      setRejecting(null);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="Doctor Approvals" subtitle="Verify each doctor's license before they appear to patients.">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending approvals" value={loaded ? doctors.length : '-'} />
      </div>

      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
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
                    <button onClick={() => act(d, 'approve')} disabled={busy} className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60">Approve</button>
                    <button onClick={() => setRejecting(d)} disabled={busy} className="rounded border border-gray-400 px-3 py-1 disabled:opacity-60">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejecting && (
        <ConfirmDialog
          title={`Reject ${rejecting.name}?`}
          message="The doctor will see this reason and can update their details and reapply."
          confirmLabel="Reject"
          danger
          busy={busy}
          input={{ label: 'Reason for rejection', minLength: 5 }}
          onConfirm={(reason) => act(rejecting, 'reject', reason)}
          onClose={() => setRejecting(null)}
        />
      )}
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