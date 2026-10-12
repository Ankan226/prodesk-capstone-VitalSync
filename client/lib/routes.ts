import type { DoctorProfile, User } from './auth-store';

export function homePathFor(user: User | null, doctorProfile: DoctorProfile | null): string {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'doctor') {
    return doctorProfile?.approvalStatus === 'approved' ? '/doctor/dashboard' : '/doctor/pending';
  }
  return '/dashboard';
}