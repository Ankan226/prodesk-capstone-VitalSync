'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShell from '@/components/DashboardShell';
import EditAppointmentModal from '@/components/EditAppointmentModal';
import { api } from '@/lib/api';
import { errorMessage, formatDateTime, formatRupees, payableAmount } from '@/lib/helpers';
import type { Appointment, AppointmentStatus } from '@/lib/types';

const statusTag: Record<AppointmentStatus, string> = {
  booked: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
  no_show: 'bg-amber-100 text-amber-800',
};

const byTime = (a: Appointment, b: Appointment) => (a.date + a.slotStart).localeCompare(b.date + b.slotStart);

function AppointmentsContent() {
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [payingId, setPayingId] = useState('');

  // READ
  useEffect(() => {
    api<{ appointments: Appointment[] }>('/api/appointments')
      .then((d) => setItems(d.appointments))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  
  async function onDelete(a: Appointment) {
    if (!window.confirm(`Delete your appointment with ${a.doctor.name} on ${formatDateTime(a.date, a.slotStart)}?`)) return;
    setError('');
    setNotice('');
    const previous = items;
    setItems((cur) => (cur ? cur.filter((x) => x.id !== a.id) : cur));
    try {
      await api(`/api/appointments/${a.id}`, { method: 'DELETE' });
      setNotice('Appointment deleted');
    } catch (err) {
      setItems(previous); 
      setError(errorMessage(err));
    }
  }

  
  function onSaved(updated: Appointment) {
    setItems((cur) => (cur ? cur.map((x) => (x.id === updated.id ? updated : x)).sort(byTime) : cur));
    setEditing(null);
    setError('');
    setNotice('Appointment updated');
  }


  async function onPay(a: Appointment) {
    setError('');
    setPayingId(a.id);
    try {
      const data = await api<{ url: string }>('/api/payments/checkout', { method: 'POST', body: { appointmentId: a.id } });
      window.location.href = data.url;
    } catch (err) {
      setError(errorMessage(err));
      setPayingId('');
    }
  }

  return (
    <DashboardShell
      title="My Appointments"
      subtitle="Reschedule, pay or delete your appointments."
      actions={
        <Link href="/dashboard/book" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Book appointment
        </Link>
      }
    >
      {notice && <p className="mb-3 rounded bg-green-50 p-2 text-sm text-green-800">{notice}</p>}
      {error && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Date and time</th>
              <th className="p-3">Doctor</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items === null && !error && <tr><td colSpan={6} className="p-3 text-gray-500">Loading...</td></tr>}
            {items && items.length === 0 && (
              <tr><td colSpan={6} className="p-3 text-gray-500">No appointments yet. Click Book appointment to add one.</td></tr>
            )}
            {items?.map((a) => (
              <tr key={a.id} className="border-t border-gray-200">
                <td className="p-3">{formatDateTime(a.date, a.slotStart, a.slotEnd)}</td>
                <td className="p-3">{a.doctor.name}<span className="block text-xs text-gray-500">{a.doctor.specialty}</span></td>
                <td className="p-3">{a.reason || '-'}</td>
                <td className="p-3"><span className={`rounded px-2 py-1 text-xs ${statusTag[a.status]}`}>{a.status}</span></td>
                <td className="p-3">{a.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {a.status === 'booked' && (
                      <button onClick={() => setEditing(a)} className="rounded border border-gray-400 px-3 py-1">Edit</button>
                    )}
                    {a.status === 'booked' && a.paymentStatus === 'unpaid' && (
                      <button onClick={() => onPay(a)} disabled={payingId === a.id} className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-60">
                        {payingId === a.id ? 'Opening...' : `Pay ${formatRupees(payableAmount(a.doctor.consultationFee))}`}
                      </button>
                    )}
                    {a.status !== 'completed' && a.paymentStatus === 'unpaid' && (
                      <button onClick={() => onDelete(a)} className="rounded border border-red-300 px-3 py-1 text-red-700">Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <EditAppointmentModal appointment={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </DashboardShell>
  );
}

export default function AppointmentsPage() {
  return (
    <ProtectedRoute roles={['patient']}>
      <AppointmentsContent />
    </ProtectedRoute>
  );
}