'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardShell from '@/components/DashboardShell';
import TimeSelect from '@/components/TimeSelect';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/helpers';

interface Day {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
}

const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function AvailabilityContent() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ days: Day[] }>('/api/availability/me')
      .then((d) => setDays(d.days))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  function patch(dayOfWeek: number, changes: Partial<Day>) {
    setSaved(false);
    setDays((cur) => (cur ? cur.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...changes } : d)) : cur));
  }

  async function onSave() {
    setError('');
    setSaving(true);
    try {
      const data = await api<{ days: Day[] }>('/api/availability/me', { method: 'PUT', body: { days } });
      setDays(data.days);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell title="Weekly availability" subtitle="Set your working hours. Patients can book the open slots generated from these rules.">
      {days === null && !error && <p className="text-sm text-gray-500">Loading...</p>}
      <div className="grid max-w-3xl gap-2">
        {days &&
          ORDER.map((dow) => {
            const d = days.find((x) => x.dayOfWeek === dow);
            if (!d) return null;
            return (
              <div key={dow} className={`flex flex-wrap items-center gap-3 rounded border p-3 text-sm ${d.isActive ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                <label className="flex w-36 items-center gap-2">
                  <input type="checkbox" checked={d.isActive} onChange={(e) => patch(dow, { isActive: e.target.checked })} />
                  {NAMES[dow]}
                </label>
                <TimeSelect label={`${NAMES[dow]} start`} value={d.startTime} disabled={!d.isActive} onChange={(v) => patch(dow, { startTime: v })} />
                <span>to</span>
                <TimeSelect label={`${NAMES[dow]} end`} value={d.endTime} disabled={!d.isActive} onChange={(v) => patch(dow, { endTime: v })} />
                <select
                  value={d.slotMinutes}
                  disabled={!d.isActive}
                  onChange={(e) => patch(dow, { slotMinutes: Number(e.target.value) })}
                  aria-label={`${NAMES[dow]} slot length`}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                </select>
              </div>
            );
          })}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {saved && <p className="mt-3 text-sm text-green-700">Availability saved.</p>}
      {days && (
        <button onClick={onSave} disabled={saving} className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {saving ? 'Saving...' : 'Save availability'}
        </button>
      )}
    </DashboardShell>
  );
}

export default function AvailabilityPage() {
  return (
    <ProtectedRoute roles={['doctor']}>
      <AvailabilityContent />
    </ProtectedRoute>
  );
}