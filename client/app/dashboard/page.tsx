'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShell from '@/components/DashboardShell';
import StatCard from '@/components/StatCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { api } from '@/lib/api';
import { errorMessage, formatDate, formatDateTime, formatRupees, initials, localToday, payableAmount } from '@/lib/helpers';
import { useAuthStore } from '@/lib/auth-store';
import type { Appointment } from '@/lib/types';

function OverviewContent() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  useEffect(() => {
    api<{ appointments: Appointment[] }>('/api/appointments')
      .then((d) => setItems(d.appointments))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  async function onCancel(a: Appointment) {
    setCancelling(null);
    const previous = items;
    setItems((cur) => (cur ? cur.filter((x) => x.id !== a.id) : cur));
    try {
      await api(`/api/appointments/${a.id}`, { method: 'DELETE' });
      toast.success('Appointment cancelled');
    } catch (err) {
      setItems(previous);
      toast.error(errorMessage(err));
    }
  }

  const today = localToday();
  const all = items ?? [];
  const upcoming = all.filter((a) => a.status === 'booked' && a.date >= today);
  const completed = all.filter((a) => a.status === 'completed').length;

  const notifications = [
    ...upcoming.slice(0, 3).map((a) => ({
      id: `r-${a.id}`,
      title: 'Appointment reminder',
      text: `${a.doctor.name} · ${formatDateTime(a.date, a.slotStart)}`,
    })),
    ...all
      .filter((a) => a.paymentStatus === 'paid')
      .slice(-2)
      .map((a) => ({
        id: `p-${a.id}`,
        title: 'Payment received',
        text: `${a.doctor.name} · ${formatRupees(payableAmount(a.doctor.consultationFee))}`,
      })),
  ];

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <DashboardShell title="Patient Dashboard" subtitle={`Welcome back, ${firstName}. Here's your care at a glance.`}>
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Upcoming"
          value={items ? upcoming.length : '-'}
          hint={upcoming[0] ? `Next visit: ${formatDate(upcoming[0].date)}` : 'Nothing booked'}
        />
        <StatCard label="Completed" value={items ? completed : '-'} hint="Appointments to date" />
        <StatCard label="Active Prescriptions" value="-" hint="Available once prescriptions launch" />
      </div>

      <div className="mb-4 grid items-start gap-4 lg:grid-cols-3">
        <section className="rounded border border-gray-200 bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming Appointments</h2>
            <span className="text-xs text-gray-500">{items ? `${upcoming.length} scheduled` : ''}</span>
          </div>

          {items === null && !error && <p className="text-sm text-gray-500">Loading...</p>}
          {items && upcoming.length === 0 && (
            <p className="text-sm text-gray-500">
              No upcoming appointments. <Link href="/dashboard/book" className="text-blue-600 underline">Find a doctor</Link> to book one.
            </p>
          )}

          <ul className="grid gap-3">
            {upcoming.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded border border-gray-200 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-gray-100 text-sm font-semibold text-gray-600">
                  {initials(a.doctor.name)}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{a.doctor.name}</p>
                  <p className="text-gray-500">{a.doctor.specialty}</p>
                  <p>{formatDateTime(a.date, a.slotStart)}</p>
                </div>
                {a.paymentStatus === 'paid' ? (
                  <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">Paid</span>
                ) : (
                  <button onClick={() => setCancelling(a)} className="rounded border border-gray-400 px-3 py-1 text-sm font-medium">
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>All appointment times are shown in your local time.</span>
            <Link href="/dashboard/appointments" className="rounded border border-gray-400 px-3 py-1 text-sm font-medium text-gray-900">
              Manage all
            </Link>
          </div>
        </section>

        <section className="rounded border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <span className="text-xs text-blue-600">
              {notifications.length > 0 ? `${notifications.length} ${notifications.length === 1 ? 'item' : 'items'}` : ''}
            </span>
          </div>
          {notifications.length === 0 && <p className="text-sm text-gray-500">You are all caught up.</p>}
          <ul className="grid gap-3">
            {notifications.map((n) => (
              <li key={n.id} className="border-b border-gray-100 pb-2 text-sm last:border-b-0">
                <p className="font-medium">{n.title}</p>
                <p className="text-gray-500">{n.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-lg font-semibold">Active Prescriptions</h2>
        <p className="text-sm text-gray-500">No active prescriptions yet. Prescriptions from your doctors will appear here once that feature is added.</p>
      </section>

      {cancelling && (
        <ConfirmDialog
          title="Cancel appointment?"
          message={`Your appointment with ${cancelling.doctor.name} on ${formatDateTime(cancelling.date, cancelling.slotStart)} will be cancelled.`}
          confirmLabel="Cancel appointment"
          danger
          onConfirm={() => onCancel(cancelling)}
          onClose={() => setCancelling(null)}
        />
      )}
    </DashboardShell>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={['patient']}>
      <OverviewContent />
    </ProtectedRoute>
  );
}