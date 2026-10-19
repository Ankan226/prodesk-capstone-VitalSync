'use client';

import { useState, type FormEvent } from 'react';
import SlotPicker from '@/components/SlotPicker';
import { api } from '@/lib/api';
import { errorMessage, localToday } from '@/lib/helpers';
import type { Appointment } from '@/lib/types';

interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSaved: (updated: Appointment) => void;
}


export default function EditAppointmentModal({ appointment, onClose, onSaved }: Props) {
  const [date, setDate] = useState(appointment.date);
  const [slot, setSlot] = useState(appointment.slotStart);
  const [reason, setReason] = useState(appointment.reason ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!date || !slot) return setError('Choose the date and time of the appointment');
    if (reason.trim().length < 3) return setError('Please enter the reason for your visit');

    setSaving(true);
    try {
      const data = await api<{ appointment: Appointment }>(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        body: { date, slotStart: slot, reason: reason.trim() },
      });
      onSaved(data.appointment);
    } catch (err) {
      setError(errorMessage(err));
      setSlot('');
      setVersion((v) => v + 1); 
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded bg-white p-5 text-gray-900 shadow-lg">
        <h2 className="mb-1 text-lg font-bold">Reschedule appointment</h2>
        <p className="mb-4 text-sm text-gray-500">
          {appointment.doctor.name}, {appointment.doctor.specialty}
        </p>

        <p className="mb-1 text-sm font-medium">Date and time of appointment</p>
        <input
          id="edit-date"
          type="date"
          min={localToday()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSlot('');
          }}
          aria-label="Appointment date"
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="mb-3">
          <SlotPicker
            doctorId={appointment.doctor.id}
            date={date}
            value={slot}
            onChange={setSlot}
            excludeAppointmentId={appointment.id}
            version={version}
          />
        </div>

        <label htmlFor="edit-reason" className="mb-1 block text-sm font-medium">Reason for visit</label>
        <textarea
          id="edit-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          rows={3}
          required
          className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={onClose} className="rounded border border-gray-400 px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}