import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  CollectionReference
} from '@angular/fire/firestore';
import { Doctor } from '../interfaces/doctor';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private firestore = inject(Firestore);
  private doctorRef: CollectionReference;

  constructor() {
    this.doctorRef = collection(this.firestore, 'doctors')
  }


  async addDoctor(doctor: Doctor) {
    return addDoc(this.doctorRef, doctor);
  }


  async getAllDoctors(): Promise<Doctor[]> {
    const snapshot = await getDocs(this.doctorRef);
    return snapshot.docs.map(docSnap => {
      const doctor = docSnap.data() as Doctor;
      doctor.id = docSnap.id;
      return doctor;
    });
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    const docRef = doc(this.doctorRef, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const doctor = docSnap.data() as Doctor;
      doctor.id = docSnap.id;
      return doctor;
    } else {
      return null;
    }
  }

  async getDoctorByEmail(email: string): Promise<Doctor | null> {
    if (!email) return null;

    const q = query(this.doctorRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const doctor = docSnap.data() as Doctor;
      doctor.id = docSnap.id;
      return doctor;
    } else {
      return null;
    }
  }


  async getDoctorsBySpecialty(specialite: string): Promise<Doctor[]> {
    try {
      const q = query(this.doctorRef, where('specialite', '==', specialite));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Doctor));
    } catch (error) {
      throw new Error('Erreur lors de la récupération des docteurs par spécialité : ' + (error as Error).message);
    }
  }

  async updateDoctor(id: string, doctorData: Partial<Doctor>): Promise<void> {
    const docRef = doc(this.doctorRef, id);
    return updateDoc(docRef, doctorData);
  }


  async deleteDoctor(id: string): Promise<void> {
    const docRef = doc(this.doctorRef, id);
    return deleteDoc(docRef);
  }


  async doctorExists(email: string): Promise<boolean> {
    try {
      const doctor = await this.getDoctorByEmail(email);
      return doctor !== null;
    } catch (error) {
      throw new Error('Erreur lors de la vérification de l\'existence du docteur : ' + (error as Error).message);
    }
  }

  async countDoctors(): Promise<number> {
    try {
      const snapshot = await getDocs(this.doctorRef);
      return snapshot.size;
    } catch (error) {
      throw new Error('Erreur lors du comptage des docteurs : ' + (error as Error).message);
    }
  }

  async getDoctorsAvailable(day: string): Promise<Doctor[]> {
    const doctorsQuery = query(
      this.doctorRef,
      where('freeDays', 'array-contains', day)
    );

    const querySnapshot = await getDocs(doctorsQuery);

    return querySnapshot.docs.map(doc => {
      const doctor = doc.data() as Doctor;
      doctor.id = doc.id;
      return doctor;
    });
  }

  async getDoctorsAvailableOn(day: string, time: string): Promise<Doctor[]> {
    console.log('→ Recherche des docteurs disponibles pour le jour :', day);
    const doctorsQuery = query(
      this.doctorRef,
      where('freeDays', 'array-contains', day)
    );

    const querySnapshot = await getDocs(doctorsQuery);
    console.log('→ Nombre de docteurs trouvés dans Firestore :', querySnapshot.docs.length);

    return querySnapshot.docs
      .map(doc => {
        const doctor = doc.data() as Doctor;
        doctor.id = doc.id;
        console.log('Docteur trouvé :', doctor);
        return doctor;
      })
      .filter(doctor => {
        const match = this.isTimeInRange(time, doctor.startTime, doctor.endTime);
        console.log(
          `→ Docteur ${doctor.fullName} : ${doctor.startTime} - ${doctor.endTime}, Heure demandée : ${time}, Correspond : ${match}`
        );
        return match;
      });
  }
  isTimeInRange(target: string, start: string, end: string): boolean {
    if (!target || !start || !end) return false;

    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const targetMinutes = toMinutes(target);
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);

    console.log(`Heures en minutes — cible: ${targetMinutes}, début: ${startMinutes}, fin: ${endMinutes}`);

    return targetMinutes >= startMinutes && targetMinutes <= endMinutes;
  }

}