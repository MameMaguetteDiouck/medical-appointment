import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  CollectionReference
} from '@angular/fire/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { environment } from '../../../environments/environment';
import { Doctor } from '../interfaces/doctor';

export function generateSecureTemporaryPassword(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  const randomValues = new Uint8Array(8);
  crypto.getRandomValues(randomValues);
  const randomStr = Array.from(randomValues).map(byte => charset[byte % charset.length]).join('');
  return `Med-${randomStr}9!`;
}

export const DEFAULT_DOCTOR_PASSWORD = 'Medico2026!';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private firestore = inject(Firestore);
  private doctorRef: CollectionReference;

  constructor() {
    this.doctorRef = collection(this.firestore, 'doctors')
  }


  /**
   * Adds a new doctor, automatically provisioning their Firebase Auth credentials
   * with a cryptographically secure temporary password and forcing a password update on first login.
   */
  async addDoctor(doctor: Doctor, initialPassword?: string): Promise<{ uid: string; defaultPassword: string }> {
    const passwordToUse = initialPassword || generateSecureTemporaryPassword();
    const appName = `doctor-provisioning-${Date.now()}`;
    const secondaryApp = initializeApp(environment.firebaseConfig, appName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, doctor.email, passwordToUse);
      const uid = userCredential.user.uid;

      // Clean up secondary auth session immediately
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      const doctorData: Doctor = {
        ...doctor,
        id: uid,
        mustChangePassword: true,
        status: doctor.status || 'active'
      };

      const docRef = doc(this.doctorRef, uid);
      await setDoc(docRef, doctorData);

      return { uid, defaultPassword: passwordToUse };
    } catch (error: any) {
      try {
        await deleteApp(secondaryApp);
      } catch (cleanupErr) {
        // App cleanup
      }

      if (error?.code === 'auth/email-already-in-use') {
        throw new Error(`L'adresse email ${doctor.email} possède déjà un compte de connexion.`);
      }
      throw error;
    }
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
      const q = query(this.doctorRef, where('service', '==', specialite));
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
        // Exclude doctors who are on leave or inactive
        if (doctor.status && doctor.status !== 'active') {
          return false;
        }

        // Check day-specific schedule if available, otherwise fallback to global times
        const daySchedule = doctor.weeklySchedule?.[day];
        const start = daySchedule?.startTime || doctor.startTime;
        const end = daySchedule?.endTime || doctor.endTime;

        const match = this.isTimeInRange(time, start, end);
        console.log(
          `→ Docteur ${doctor.fullName} (${day}) : ${start} - ${end}, Heure demandée : ${time}, Correspond : ${match}`
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