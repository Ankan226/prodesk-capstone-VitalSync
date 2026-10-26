'use client';

import { useEffect, useState } from 'react';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;


  input?: { label: string; minLength: number };
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, danger, busy, input, onConfirm, onClose }: Props) {
  const [value, setValue] = useState('');
  const tooShort = input ? value.trim().length < input.minLength : false;


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded bg-white p-5 text-gray-900 shadow-lg"
      >
        <h2 id="confirm-title" className="mb-1 text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-500">{message}</p>

        {input && (
          <>
            <label htmlFor="confirm-input" className="mb-1 mt-4 block text-sm font-medium">{input.label}</label>
            <textarea
              id="confirm-input"
              autoFocus
              rows={3}
              maxLength={500}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            {value && tooShort && <p className="mt-1 text-xs text-red-600">At least {input.minLength} characters</p>}
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || tooShort}
            onClick={() => onConfirm(value.trim())}
            className={`rounded px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}