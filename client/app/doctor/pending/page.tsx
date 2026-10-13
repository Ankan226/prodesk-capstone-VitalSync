'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogoutButton from '@/components/LogoutButton';
import FormField from '@/components/FormField';
import { api, ApiError } from '@/lib/api';
import { SPECIALTIES } from '@/lib/specialties';
import { useAuthStore, type DoctorProfile, type User } from '@/lib/auth-store';

type StepState = 'done' | 'current' | 'upcoming' | 'rejected';

function Stepper({ rejected }: { rejected: boolean }) {
  const steps: { label: string; state: StepState }[] = [
    { label: 'Submitted', state: 'done' },
    { label: 'Under review', state: rejected ? 'done' : 'current' },
    { label: rejected ? 'Rejected' : 'Approved', state: rejected ? 'rejected' : 'upcoming' },
  ];
  const circle: Record<StepState, string> = {
    done: 'bg-blue-600 text-white',
    current: 'border-2 border-blue-600 bg-white text-blue-600',
    upcoming: 'border-2 border-gray-300 bg-white text-gray-400',
    rejected: 'bg-red-600 text-white',
  };
  const icon = (s: StepState, i: number) => (s === 'done' ? '✓' : s === 'rejected' ? '✕' : i + 1);
  const labelColor = (s: StepState) =>
    s === 'upcoming' ? 'text-gray-400' : s === 'rejected' ? 'font-medium text-red-700' : 'font-medium text-gray-900';

  return (
    <ol className="mb-6 flex">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex-1 text-center" aria-current={s.state === 'current' ? 'step' : undefined}>
          {i < steps.length - 1 && (
            <span className={`absolute left-1/2 top-4 h-0.5 w-full ${s.state === 'done' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          )}
          <span className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${circle[s.state]}`}>
            {icon(s.state, i)}
          </span>
          <span className={`mt-1 block text-xs ${labelColor(s.state)}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

const inputClass = 'w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900';

function ReapplyForm({ profile, onDone }: { profile: DoctorProfile; onDone: () => void }) {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [specialty, setSpecialty] = useState(profile.specialty);
  const [licenseNo, setLicenseNo] = useState(profile.licenseNo);
  const [years, setYears] = useState(profile.yearsOfExperience?.toString() ?? '');
  const [fee, setFee] = useState(profile.consultationFee?.toString() ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (licenseNo.trim().length < 4) return setError('Enter your medical license number');

    const body: Record<string, unknown> = { specialty, licenseNo };
    if (years) body.yearsOfExperience = Number(years);
    if (fee) body.consultationFee = Number(fee);
    if (bio.trim()) body.bio = bio.trim();

    setLoading(true);
    try {
      const data = await api<{ doctorProfile: DoctorProfile }>('/api/doctor/application', { method: 'PUT', body });
      const token = useAuthStore.getState().token;
      if (token && user) setAuth(token, user, data.doctorProfile);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mb-4 rounded border border-gray-300 p-3">
      <h2 className="mb-2 text-sm font-semibold">Update your details</h2>
      <div className="mb-3">
        <label htmlFor="specialty" className="mb-1 block text-sm font-medium">Specialty</label>
        <select id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inputClass} required>
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
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? 'Submitting...' : 'Submit for review'}
        </button>
        <button type="button" onClick={onDone} className="rounded border border-gray-400 px-4 py-2 text-sm">Cancel</button>
      </div>
    </form>
  );
}

function PendingContent() {
  const router = useRouter();
  const { user, doctorProfile, setAuth } = useAuthStore();
  const [checking, setChecking] = useState(false);
  const [showForm, setShowForm] = useState(false);


  async function sync() {
    const data = await api<{ user: User; doctorProfile: DoctorProfile | null }>('/api/auth/me');
    const token = useAuthStore.getState().token;
    if (token) setAuth(token, data.user, data.doctorProfile);
    if (data.doctorProfile?.approvalStatus === 'approved') router.replace('/doctor/dashboard');
  }

  useEffect(() => {
    sync().catch(() => {});
    const timer = setInterval(() => sync().catch(() => {}), 60000);
    return () => clearInterval(timer);
  }, []);

  function onCheck() {
    setChecking(true);
    sync()
      .catch(() => {})
      .finally(() => setChecking(false));
  }

  const status = doctorProfile?.approvalStatus;
  const rejected = status === 'rejected';
  const used = doctorProfile?.reapplyCount ?? 0;
  const limit = doctorProfile?.reapplyLimit ?? 3;
  const canReapply = rejected && used < limit;

  return (
    <main className="mx-auto mt-12 max-w-md rounded border border-gray-300 p-6">
      <h1 className="mb-2 text-xl font-bold">
        {rejected ? "Your application wasn't approved" : 'Your application is under review'}
      </h1>
      <span className={`mb-4 inline-block rounded px-2 py-1 text-xs font-medium ${rejected ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
        {rejected ? 'Rejected' : 'Pending'}
      </span>

      <Stepper rejected={rejected} />

      {!doctorProfile && (
        <p className="mb-3 text-sm">No application details were found for this account. Please register again with your license details.</p>
      )}
      {status === 'pending' && (
        <p className="mb-3 text-sm">
          An admin is verifying your license. This page checks again every minute, or press Check status.
          {used > 0 && <span className="block text-gray-500">Reapplication {used} of {limit}</span>}
        </p>
      )}
      {rejected && (
        <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-800"><strong>Reason:</strong> {doctorProfile?.rejectionReason}</p>
      )}
      {rejected && canReapply && (
        <p className="mb-3 text-sm text-gray-600">Reapplications used: {used} of {limit}. Fix the issue and submit again.</p>
      )}
      {rejected && !canReapply && (
        <p className="mb-3 text-sm text-gray-600">You have used all {limit} reapplications. Please contact support.</p>
      )}

      {doctorProfile && !showForm && (
        <div className="mb-4 rounded bg-gray-50 p-3 text-sm">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Specialty:</strong> {doctorProfile.specialty}</p>
          <p><strong>License number:</strong> {doctorProfile.licenseNo}</p>
        </div>
      )}

      {showForm && doctorProfile && <ReapplyForm profile={doctorProfile} onDone={() => setShowForm(false)} />}

      <div className="flex flex-wrap gap-2">
        {canReapply && !showForm && (
          <button onClick={() => setShowForm(true)} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Update details and reapply
          </button>
        )}
        <button onClick={onCheck} disabled={checking} className="rounded border border-gray-400 px-4 py-2 text-sm disabled:opacity-60">
          {checking ? 'Checking...' : 'Check status'}
        </button>
        <LogoutButton />
      </div>
    </main>
  );
}

export default function DoctorPendingPage() {
  return (
    <ProtectedRoute roles={['doctor']}>
      <PendingContent />
    </ProtectedRoute>
  );
}