'use client';

import { useState } from 'react';

interface Props {
  value: string; 
  onChange: (date: string) => void;
  min: string;
  enabledWeekdays?: number[]; 
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const pad = (n: number) => String(n).padStart(2, '0');

export default function MonthCalendar({ value, onChange, min, enabledWeekdays }: Props) {
  const start = value || min;
  const [view, setView] = useState(() => ({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 }));

  const atMinMonth = view.year * 12 + view.month <= Number(min.slice(0, 4)) * 12 + Number(min.slice(5, 7)) - 1;
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const label = new Date(view.year, view.month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  function shift(delta: number) {
    setView((v) => {
      const total = v.year * 12 + v.month + delta;
      return { year: Math.floor(total / 12), month: total % 12 };
    });
  }

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={atMinMonth} aria-label="Previous month" className="rounded px-2 py-1 text-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-300">
          ‹
        </button>
        <span className="text-sm font-medium">{label}</span>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="rounded px-2 py-1 text-lg text-gray-700 hover:bg-gray-100">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">{d}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`blank-${i}`} />;
          const date = `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
          const weekday = (firstWeekday + day - 1) % 7;
          const disabled = date < min || (enabledWeekdays ? !enabledWeekdays.includes(weekday) : false);
          const selected = date === value;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onChange(date)}
              aria-pressed={selected}
              aria-label={date}
              className={`h-9 rounded text-sm ${
                selected ? 'bg-blue-600 font-semibold text-white' : disabled ? 'text-gray-300' : 'text-gray-900 hover:bg-blue-50'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}