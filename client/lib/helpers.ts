import { ApiError } from './api';

export const MIN_PAYMENT = 50; 

export const payableAmount = (fee?: number) => Math.max(Number(fee) || 0, MIN_PAYMENT);

export const formatRupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;


export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}


export function formatTime12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}


export function formatDateTime(date: string, start: string, end?: string): string {
  return `${formatDate(date)}, ${formatTime12(start)}${end ? ` to ${formatTime12(end)}` : ''}`;
}


export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : 'Something went wrong');