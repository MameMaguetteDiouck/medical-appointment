export interface Doctor {
  id: string; // ID généré par Firestore (optionnel)
  fullName: string;
  address: string;
  service: string;
  freeDays: string[];
  startTime: string;
  doctorName?: string;
  endTime: string;
  description: string;
  email: string;
  phone: string;
  status?: 'active' | 'on_leave' | 'inactive';
  weeklySchedule?: { [day: string]: { startTime: string; endTime: string } };
  mustChangePassword?: boolean;
  authUid?: string;
}