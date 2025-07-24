import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  CollectionReference,
  Firestore,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from '@angular/fire/firestore';
import { Appointment, AppointmentStatus } from '../interfaces/appointment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private firestore: Firestore = inject(Firestore);
  private appointmentRef: CollectionReference;

  constructor() {
    this.appointmentRef = collection(this.firestore, 'appointments');
  }

  addAppointment(data: any) {
    return addDoc(this.appointmentRef, data);
  }

  async allAppointmentForOnePatient(id: string): Promise<Appointment[]> {
    const q = query(this.appointmentRef, where('patientId', '==', id));
    const snapshot = await getDocs(q);

    const appointments = snapshot.docs.map(docSnap => {
      const appointment = docSnap.data() as Appointment;
      appointment.id = docSnap.id;
      return appointment;
    });
    const data = this.sortAppointmentsByDateDesc(appointments);
    return data;
  }

  sortAppointmentsByDateDesc(appointments: Appointment[]): Appointment[] {
    return appointments.sort((a, b) => {
      const timeA = a.day instanceof Date ? a.day.getTime() : new Date(a.day).getTime();
      const timeB = b.day instanceof Date ? b.day.getTime() : new Date(b.day).getTime();
      return timeB - timeA; // Plus récent au plus ancien
    });
  }


  async getAllAppointments(): Promise<Appointment[]> {
    const snapshot = await getDocs(this.appointmentRef);

    const appointments = snapshot.docs.map(docSnap => {
      const appointment = docSnap.data() as Appointment;
      appointment.id = docSnap.id;
      return appointment;
    });
    const data = this.sortAppointmentsByDateDesc(appointments);
    return data;
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    const docRef = doc(this.appointmentRef, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const appointment = docSnap.data() as Appointment;
      appointment.id = docSnap.id;
      return appointment;
    } else {
      return null;
    }
  }

  deleteAppointment(id: string) {
    const docRef = doc(this.appointmentRef, id);
    return deleteDoc(docRef);
  }

  updateAppointment(id: string, data: Partial<Appointment>) {
    const docRef = doc(this.appointmentRef, id);
    return updateDoc(docRef, data);
  }

  updateStatus(appointmentId: string, newStatus: string) {
    const appointmentDocRef = doc(this.appointmentRef, appointmentId);
    return updateDoc(appointmentDocRef, { status: newStatus });
  }

  observeAppointments(callback: (appointments: Appointment[]) => void) {
    return onSnapshot(this.appointmentRef, snapshot => {
      const appointments = snapshot.docs.map(docSnap => {
        const appointment = docSnap.data() as Appointment;
        appointment.id = docSnap.id;
        return appointment;
      });
      callback(appointments);
    });
  }

  async getAppointmentsByDateAndHour(date: string, heure: string): Promise<Appointment[]> {
    const q = query(
      this.appointmentRef,
      where('day', '==', date),
      where('hourStart', '==', heure)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const appt = docSnap.data() as Appointment;
      appt.id = docSnap.id;
      return appt;
    });
  }

  async getAppointmentsForToday(id: string | null): Promise<Appointment[]> {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    const q = query(
      this.appointmentRef,
      where('day', '==', formattedDate),
      where('doctorId', '==', id),
      where('status', '==', AppointmentStatus.CONFIRMED)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const appt = docSnap.data() as Appointment;
      appt.id = docSnap.id;
      return appt;
    });
  }


}
