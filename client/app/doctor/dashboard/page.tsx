'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShell from '@/components/DashboardShell';
import StatCard from '@/components/StatCard';
import { api, ApiError } from '@/lib/api';
import { errorMessage, formatDateTime, localToday } from '@/lib/helpers';
import { useAuthStore } from '@/lib/auth-store';
import type { Appointment } from '@/lib/types';

function DoctorContent() {
  const router = useRouter();
  const doctorProfile = useAuthStore((s) => s.doctorProfile);
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/doctor/dashboard')
      .then(() => api<{ appointments: Appointment[] }>('/api/appointments'))
      .then((d) => setItems(d.appointments))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) router.replace('/doctor/pending');
        else setError(errorMessage(e));
      });
  }, [router]);

  const today = localToday();
  const all = items ?? [];
  const todays = all.filter((a) => a.date === today && a.status === 'booked').length;
  const upcoming = all.filter((a) => a.date >= today && a.status === 'booked').length;

  return (
    <DashboardShell
      title="Doctor Dashboard"
      subtitle={doctorProfile ? doctorProfile.specialty : undefined}
      actions={
        <Link href="/doctor/availability" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Set availability
        </Link>
      }
    >
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Today's appointments" value={items ? todays : '-'} />
        <StatCard label="Upcoming" value={items ? upcoming : '-'} hint="Booked, from today" />
        <StatCard label="All appointments" value={items ? all.length : '-'} />
      </div>

      <h2 className="mb-2 text-lg font-semibold">Appointments</h2>
      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Date and time</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {items === null && !error && <tr><td colSpan={5} className="p-3 text-gray-500">Loading...</td></tr>}
            {items && items.length === 0 && (
              <tr><td colSpan={5} className="p-3 text-gray-500">No appointments yet. Set your availability so patients can book.</td></tr>
            )}
            {items?.map((a) => (
              <tr key={a.id} className="border-t border-gray-200">
                <td className="p-3">{formatDateTime(a.date, a.slotStart, a.slotEnd)}</td>
                <td className="p-3">{a.patient.name}<span className="block text-xs text-gray-500">{a.patient.email}</span></td>
                <td className="p-3">{a.reason || '-'}</td>
                <td className="p-3">{a.status}</td>
                <td className="p-3">{a.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}

export default function DoctorDashboardPage() {
  return (
    <ProtectedRoute roles={['doctor']}>
      <DoctorContent />
    </ProtectedRoute>
  );
}