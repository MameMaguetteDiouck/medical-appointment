export interface Doctor {
  id: string; // ID généré par Firestore (optionnel)
  fullName: string;
  address: string;
  service: string;
  freeDays: string[];
  startTime: string;
  doctorName: string;
  endTime: string;
  description: string;
  email: string;
  phone: string;
}