export enum AppointmentStatus {
  PENDING = 'Attente de confirmation',
  CONFIRMED = 'Confirmé',
  CANCELLED = 'Annulé',
  COMPLETED = 'Passé'
}
export interface Appointment {
  id: string,
  service: string,
  descriptionSick: string,
  day: Date,
  hourStart: string | null,
  patientId: string,
  doctorId: string,
  doctorName: string,
  status: AppointmentStatus,
  doctorObservation: string;
  orrdonnance: string[];
}
