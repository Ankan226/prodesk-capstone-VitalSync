'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import FormField from '@/components/FormField';
import { api, ApiError } from '@/lib/api';
import { useAuthStore, type Session } from '@/lib/auth-store';
import { homePathFor } from '@/lib/routes';

import { SPECIALTIES } from '@/lib/specialties';

export default function RegisterPage() {
  const router = useRouter();
  const { token, user, doctorProfile, hydrated, hydrate, setAuth } = useAuthStore();
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [years, setYears] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && token) router.replace(homePathFor(user, doctorProfile));
  }, [hydrated, token, user, doctorProfile, router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

  
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    if (role === 'doctor' && !specialty) return setError('Choose your specialty');
    if (role === 'doctor' && licenseNo.trim().length < 4) return setError('Enter your medical license number');
    if (!termsAccepted) return setError('You must accept the terms');

    const body: Record<string, unknown> = { name, email, password, role, termsAccepted };
    if (role === 'doctor') {
      body.specialty = specialty;
      body.licenseNo = licenseNo;
      if (years) body.yearsOfExperience = Number(years);
      if (fee) body.consultationFee = Number(fee);
      if (bio.trim()) body.bio = bio.trim();
    }

    setLoading(true);
    try {
      const data = await api<Session>('/api/auth/register', { method: 'POST', body, auth: false });
      setAuth(data.token, data.user, data.doctorProfile);
      router.push(homePathFor(data.user, data.doctorProfile)); 
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';

  return (
    <main className="mx-auto my-10 max-w-sm rounded border border-gray-300 p-6">
      <h1 className="mb-1 text-center text-2xl font-bold">VitalSync</h1>
      <p className="mb-4 text-center text-sm text-gray-500">Create your account</p>

      <form onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="role" className="mb-1 block text-sm font-medium">I am a</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as 'patient' | 'doctor')} className={inputClass}>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>

        {role === 'doctor' && (
          <p className="mb-3 rounded bg-blue-50 p-2 text-xs text-blue-800">
            Doctor accounts are reviewed by an admin before activation.
          </p>
        )}

        <FormField label="Full name" name="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        <FormField label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <FormField label="Password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        <FormField label="Confirm password" name="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />

        {role === 'doctor' && (
          <>
            <div className="mb-3">
              <label htmlFor="specialty" className="mb-1 block text-sm font-medium">Specialty</label>
              <select id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inputClass} required>
                <option value="">Select a specialty</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <FormField label="Medical license number" name="licenseNo" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} required />
            <FormField label="Years of experience" name="years" type="number" min={0} max={70} value={years} onChange={(e) => setYears(e.target.value)} />
            <FormField label="Consultation fee" name="fee" type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} />
            <div className="mb-3">
              <label htmlFor="bio" className="mb-1 block text-sm font-medium">Short bio</label>
              <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} rows={3} className={inputClass} />
            </div>
          </>
        )}

        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
          I agree to the Terms and Privacy Policy
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? 'Submitting...' : role === 'doctor' ? 'Submit for approval' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}