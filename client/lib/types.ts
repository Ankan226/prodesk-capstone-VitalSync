export type AppointmentStatus = 'booked' | 'completed' | 'cancelled' | 'no_show';

export interface DoctorSummary {
  id: string;
  name: string;
  specialty: string;
  consultationFee?: number;
  yearsOfExperience?: number;
  bio?: string;
  workingDays?: number[]; // 0 = Sunday ... 6 = Saturday
  nextAvailable?: string | null; // YYYY-MM-DD
}

export interface Appointment {
  id: string;
  date: string; // YYYY-MM-DD
  slotStart: string; // HH:mm
  slotEnd: string;
  status: AppointmentStatus;
  reason?: string;
  paymentStatus: 'unpaid' | 'paid';
  doctor: { id: string; name: string; specialty: string; consultationFee?: number };
  patient: { id: string; name: string; email: string };
}