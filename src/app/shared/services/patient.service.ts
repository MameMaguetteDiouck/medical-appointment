import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  CollectionReference,
  Firestore,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  onSnapshot
} from '@angular/fire/firestore';
import { Patient } from '../interfaces/patient';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private patientRef: CollectionReference;

  constructor(private firestore: Firestore, ) {
    this.patientRef = collection(this.firestore, 'patients');
  }

  /**
   * Ajoute un patient à Firestore
   */
  addPatient(patientData: Patient) {
    return addDoc(this.patientRef, patientData);
  }

  /**
   * Récupère un patient par email
   */
  async getPatientByEmail(email: string | null | undefined): Promise<Patient | null> {
    if (!email) return null;

    const q = query(this.patientRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const patient = docSnap.data() as Patient;
      patient.id = docSnap.id;
      return patient;
    } else {
      return null;
    }
  }

  async getAllPatients(): Promise<Patient[]> {
    const snapshot = await getDocs(this.patientRef);
    return snapshot.docs.map(docSnap => {
      const patient = docSnap.data() as Patient;
      patient.id = docSnap.id;
      return patient;
    });
  }

  /**
   * Récupère un patient par ID
   */
  async getPatientById(id: string): Promise<Patient | null> {
    const docRef = doc(this.patientRef, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const patient = docSnap.data() as Patient;
      patient.id = docSnap.id;
      return patient;
    } else {
      return null;
    }
  }


  deletePatient(id: string) {
    const docRef = doc(this.patientRef, id);
    return deleteDoc(docRef);
  }

  /**
   * Met à jour un patient par ID
   */
  updatePatient(id: string, data: Partial<Patient>) {
    const docRef = doc(this.patientRef, id);
    return updateDoc(docRef, data);
  }

  /**
   * Écoute en temps réel les patients (Observable)
   */
  observeAllPatients(callback: (patients: Patient[]) => void) {
    return onSnapshot(this.patientRef, snapshot => {
      const patients = snapshot.docs.map(docSnap => {
        const patient = docSnap.data() as Patient;
        patient.id = docSnap.id;
        return patient;
      });
      callback(patients);
    });
  }
}
