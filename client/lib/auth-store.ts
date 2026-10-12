import { create } from 'zustand';

export type Role = 'admin' | 'doctor' | 'patient';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface DoctorProfile {
  id: string;
  specialty: string;
  licenseNo: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  bio?: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string;
  reapplyCount?: number;
  reapplyLimit?: number;
}


export interface Session {
  token: string;
  user: User;
  doctorProfile: DoctorProfile | null;
}

const STORAGE_KEY = 'vitalsync_auth';


export function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64));
    return !exp || exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

interface AuthState {
  token: string | null;
  user: User | null;
  doctorProfile: DoctorProfile | null;
  hydrated: boolean;
  hydrate: () => void;
  setAuth: (token: string, user: User, doctorProfile?: DoctorProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  doctorProfile: null,
  hydrated: false,

  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { token, user, doctorProfile } = JSON.parse(raw);
        if (token && !isTokenExpired(token)) {
          set({ token, user, doctorProfile: doctorProfile ?? null, hydrated: true });
          return;
        }
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ hydrated: true });
  },

  setAuth: (token, user, doctorProfile = null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user, doctorProfile }));
    set({ token, user, doctorProfile, hydrated: true });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null, doctorProfile: null });
  },
}));