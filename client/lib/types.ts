export type AppointmentStatus = 'booked' | 'completed' | 'cancelled' | 'no_show';

export interface DoctorSummary {
  id: string;
  name: string;
  specialty: string;
  consultationFee?: number;
  yearsOfExperience?: number;
  bio?: string;
  workingDays?: number[]; 
  nextAvailable?: string | null; 
}

export interface Appointment {
  id: string;
  date: string; 
  slotStart: string;
  slotEnd: string;
  status: AppointmentStatus;
  reason?: string;
  paymentStatus: 'unpaid' | 'paid';
  doctor: { id: string; name: string; specialty: string; consultationFee?: number };
  patient: { id: string; name: string; email: string };
}