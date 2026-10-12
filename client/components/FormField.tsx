'use client';

import { useState, type InputHTMLAttributes } from 'react';

type Props = { label: string } & InputHTMLAttributes<HTMLInputElement>;

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export default function FormField({ label, id, type, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? rest.name;
  const isPassword = type === 'password';

  return (
    <div className="mb-3">
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          className={`w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ${isPassword ? 'pr-10' : ''}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
}