'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import FormField from '@/components/FormField';
import { api, ApiError } from '@/lib/api';
import { useAuthStore, type Session } from '@/lib/auth-store';
import { homePathFor } from '@/lib/routes';

export default function LoginPage() {
  const router = useRouter();
  const { token, user, doctorProfile, hydrated, hydrate, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // Already logged in? Skip the form.
  useEffect(() => {
    if (hydrated && token) router.replace(homePathFor(user, doctorProfile));
  }, [hydrated, token, user, doctorProfile, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<Session>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      setAuth(data.token, data.user, data.doctorProfile);
      router.push(homePathFor(data.user, data.doctorProfile));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-sm rounded border border-gray-300 p-6">
      <h1 className="mb-1 text-center text-2xl font-bold">VitalSync</h1>
      <p className="mb-4 text-center text-sm text-gray-500">Your care, connected.</p>

      <form onSubmit={onSubmit}>
        <FormField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <FormField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        New here?{' '}
        <Link href="/register" className="text-blue-600 underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}