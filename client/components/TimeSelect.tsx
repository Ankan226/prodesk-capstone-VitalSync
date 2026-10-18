'use client';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

const selectClass =
  'rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400';



export default function TimeSelect({ value, onChange, label, disabled }: Props) {
  const [h24, minute] = value.split(':').map(Number);
  const period = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const minutes = [0, 15, 30, 45].includes(minute) ? [0, 15, 30, 45] : [0, 15, 30, 45, minute].sort((a, b) => a - b);

  function emit(h: number, m: number, p: string) {
    const hh = (h % 12) + (p === 'PM' ? 12 : 0);
    onChange(`${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  return (
    <span className="inline-flex items-center gap-1">
      <select aria-label={`${label} hour`} disabled={disabled} value={hour12} onChange={(e) => emit(Number(e.target.value), minute, period)} className={selectClass}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span aria-hidden="true">:</span>
      <select aria-label={`${label} minute`} disabled={disabled} value={minute} onChange={(e) => emit(hour12, Number(e.target.value), period)} className={selectClass}>
        {minutes.map((m) => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
      <select aria-label={`${label} AM or PM`} disabled={disabled} value={period} onChange={(e) => emit(hour12, minute, e.target.value)} className={selectClass}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </span>
  );
}