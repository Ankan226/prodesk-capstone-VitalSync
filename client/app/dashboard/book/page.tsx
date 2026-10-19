'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShell from '@/components/DashboardShell';
import MonthCalendar from '@/components/MonthCalendar';
import SlotPicker from '@/components/SlotPicker';
import { api } from '@/lib/api';
import {
  errorMessage,
  formatDate,
  formatDateLong,
  formatRupees,
  formatTime12,
  initials,
  localToday,
  payableAmount,
} from '@/lib/helpers';
import type { DoctorSummary } from '@/lib/types';

const fieldClass = 'rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';

function BookContent() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorSummary[] | null>(null);
  const [query, setQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [applied, setApplied] = useState({ query: '', specialty: '' });
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    api<{ doctors: DoctorSummary[] }>('/api/doctors')
      .then((d) => setDoctors(d.doctors))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const specialties = useMemo(
    () => Array.from(new Set((doctors ?? []).map((d) => d.specialty))).sort(),
    [doctors]
  );

  const filtered = useMemo(() => {
    const q = applied.query.trim().toLowerCase();
    return (doctors ?? []).filter(
      (d) =>
        (!q || d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)) &&
        (!applied.specialty || d.specialty === applied.specialty)
    );
  }, [doctors, applied]);

  const selected = (doctors ?? []).find((d) => d.id === doctorId) ?? null;

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApplied({ query, specialty: specialtyFilter });
  }

  function selectDoctor(d: DoctorSummary) {
    setDoctorId(d.id);
    setDate(d.nextAvailable ?? ''); 
    setSlot('');
    setSlotEnd('');
    setError('');
  }

  // CREATE
  async function onBook(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!selected) return setError('Choose a doctor');
    if (!date || !slot) return setError('Choose the date and time of the appointment');
    if (reason.trim().length < 3) return setError('Please enter the reason for your visit');

    setSaving(true);
    try {
      await api('/api/appointments', {
        method: 'POST',
        body: { doctorId: selected.id, date, slotStart: slot, reason: reason.trim() },
      });
      router.push('/dashboard/appointments');
    } catch (err) {
      setError(errorMessage(err));
      setSlot('');
      setSlotEnd('');
      setVersion((v) => v + 1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell title="Find Doctor and Book Slot" subtitle="Choose a doctor, then select a date and an available time.">
      <form onSubmit={onSearch} className="mb-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by doctor name or specialty"
          aria-label="Search doctors"
          className={`${fieldClass} min-w-[220px] flex-1`}
        />
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          aria-label="Filter by specialty"
          className={`${fieldClass} w-48`}
        >
          <option value="">All specialties</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white">Search</button>
      </form>

      <p className="mb-3 text-sm text-gray-500">
        {doctors ? `${filtered.length} doctor${filtered.length === 1 ? '' : 's'} available` : 'Loading doctors...'}
      </p>
      {error && !selected && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-3">
          {doctors && filtered.length === 0 && (
            <p className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              No doctors match your search. Try a different name or specialty.
            </p>
          )}
          {filtered.map((d) => {
            const isSelected = doctorId === d.id;
            return (
              <div key={d.id} className={`rounded border bg-white p-4 ${isSelected ? 'border-blue-600' : 'border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-gray-100 text-sm font-semibold text-gray-600">
                    {initials(d.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.specialty}</p>
                    <p className="text-xs text-gray-500">
                      {d.nextAvailable ? `Next available: ${formatDate(d.nextAvailable)}` : 'No availability set yet'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{d.consultationFee ? formatRupees(d.consultationFee) : '-'}</p>
                    <p className="text-xs text-gray-500">per visit</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">In-person consultation</span>
                  <button
                    type="button"
                    onClick={() => selectDoctor(d)}
                    className={
                      isSelected
                        ? 'rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white'
                        : 'rounded border border-gray-300 px-4 py-1.5 text-sm font-medium'
                    }
                  >
                    {isSelected ? 'Selected' : 'Select doctor'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={onBook} className="rounded border border-gray-200 bg-white p-4 lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold">Book a slot</h2>
          <p className="mb-3 border-b border-gray-200 pb-3 text-sm text-gray-500">
            {selected ? `${selected.name} · ${selected.specialty}` : 'Select a doctor to see available dates'}
          </p>

          {selected && (
            <>
              {(selected.workingDays ?? []).length === 0 && (
                <p className="mb-3 rounded bg-amber-50 p-2 text-sm text-amber-800">
                  This doctor has not set working hours yet, so there is nothing to book.
                </p>
              )}

              <MonthCalendar
                key={selected.id}
                value={date}
                min={localToday()}
                enabledWeekdays={selected.workingDays}
                onChange={(d) => {
                  setDate(d);
                  setSlot('');
                  setSlotEnd('');
                }}
              />

              <div className="my-3 flex flex-wrap items-center justify-between gap-1 border-t border-gray-200 pt-3 text-sm">
                <span className="font-medium">{date ? formatDateLong(date) : 'Pick a date'}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
                  Live availability · Grey = booked
                </span>
              </div>

              <SlotPicker
                doctorId={selected.id}
                date={date}
                value={slot}
                onChange={(start, end) => {
                  setSlot(start);
                  setSlotEnd(end ?? '');
                }}
                version={version}
                live
              />

              {date && slot && (
                <div className="mt-4 flex items-end justify-between border-t border-gray-200 pt-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(date)} · {formatTime12(slot)}</p>
                    <p className="text-xs text-gray-500">In-person{slotEnd ? ` · until ${formatTime12(slotEnd)}` : ''}</p>
                  </div>
                  <p className="text-2xl font-bold">{formatRupees(payableAmount(selected.consultationFee))}</p>
                </div>
              )}

              <label htmlFor="reason" className="mb-1 mt-4 block text-sm font-medium">Reason for visit</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                rows={3}
                required
                placeholder="For example: chest pain, follow-up, skin rash"
                className={`${fieldClass} mb-3 w-full`}
              />

              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? 'Booking...' : 'Book Appointment'}
              </button>
            </>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}

export default function BookPage() {
  return (
    <ProtectedRoute roles={['patient']}>
      <BookContent />
    </ProtectedRoute>
  );
}