'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { errorMessage, formatTime12, localToday } from '@/lib/helpers';

interface Slot {
  start: string;
  end: string;
  available: boolean;
}

interface Props {
  doctorId: string;
  date: string;
  value: string;
  onChange: (slotStart: string, slotEnd?: string) => void;
  excludeAppointmentId?: string; 
  version?: number; 
  live?: boolean; 
}

const minutesOf = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export default function SlotPicker({ doctorId, date, value, onChange, excludeAppointmentId, version = 0, live = false }: Props) {
  const key = `${doctorId}|${date}|${excludeAppointmentId ?? ''}|${version}`;
  const [result, setResult] = useState<{ key: string; slots?: Slot[]; error?: string } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!live || !doctorId || !date) return;
    const timer = setInterval(() => setTick((n) => n + 1), 15000);
    return () => clearInterval(timer);
  }, [live, doctorId, date]);

  useEffect(() => {
    if (!doctorId || !date) return;
    let cancelled = false;
    const extra = excludeAppointmentId ? `&exclude=${excludeAppointmentId}` : '';
    api<{ slots: Slot[] }>(`/api/doctors/${doctorId}/slots?date=${date}${extra}`)
      .then((d) => !cancelled && setResult({ key, slots: d.slots }))
      .catch((e) => !cancelled && setResult({ key, error: errorMessage(e) }));
    return () => {
      cancelled = true;
    };
  }, [key, doctorId, date, excludeAppointmentId, tick]);

  if (!doctorId) return <p className="text-sm text-gray-500">Choose a doctor first.</p>;
  if (!date) return <p className="text-sm text-gray-500">Pick a date to see available times.</p>;

  const current = result && result.key === key ? result : null;
  if (!current) return <p className="text-sm text-gray-500">Loading times...</p>;
  if (current.error) return <p className="text-sm text-red-600">{current.error}</p>;
  if (!current.slots || current.slots.length === 0) {
    return <p className="text-sm text-gray-500">No times on this day. Try another date.</p>;
  }

  
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isPast = (start: string) => date === localToday() && minutesOf(start) <= nowMinutes;

  return (
    <div className="grid grid-cols-3 gap-2">
      {current.slots.map((s) => {
        const available = s.available && !isPast(s.start);
        return (
          <button
            key={s.start}
            type="button"
            disabled={!available}
            onClick={() => onChange(s.start, s.end)}
            className={`rounded border px-2 py-2 text-sm ${
              value === s.start
                ? 'border-blue-600 bg-blue-600 text-white'
                : available
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-gray-200 bg-gray-100 text-gray-400'
            }`}
          >
            {formatTime12(s.start)}
          </button>
        );
      })}
    </div>
  );
}