import { Injectable } from '@angular/core';
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
  onSnapshot
} from '@angular/fire/firestore';
import { Secretary } from '../interfaces/secretary';

@Injectable({
  providedIn: 'root'
})
export class SecretaryService {
  private secretaryRef: CollectionReference;

  constructor(private firestore: Firestore) {
    this.secretaryRef = collection(this.firestore, 'secretaries');
  }

  addSecretary(secretaryData: Secretary) {
    return addDoc(this.secretaryRef, secretaryData);
  }

  async getSecretaryByEmail(email: string | null | undefined): Promise<Secretary | null> {
    if (!email) return null;
    const q = query(this.secretaryRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const secretary = docSnap.data() as Secretary;
      (secretary as any).id = docSnap.id;
      return secretary;
    } else {
      return null;
    }
  }

  async getAllSecretaries(): Promise<Secretary[]> {
    const snapshot = await getDocs(this.secretaryRef);
    return snapshot.docs.map(docSnap => {
      const secretary = docSnap.data() as Secretary;
      (secretary as any).id = docSnap.id;
      return secretary;
    });
  }

  async getSecretaryById(id: string): Promise<Secretary | null> {
    const docRef = doc(this.secretaryRef, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const secretary = docSnap.data() as Secretary;
      (secretary as any).id = docSnap.id;
      return secretary;
    } else {
      return null;
    }
  }

  deleteSecretary(id: string) {
    const docRef = doc(this.secretaryRef, id);
    return deleteDoc(docRef);
  }

  updateSecretary(id: string, data: Partial<Secretary>) {
    const docRef = doc(this.secretaryRef, id);
    return updateDoc(docRef, data);
  }

  observeAllSecretaries(callback: (secretaries: Secretary[]) => void) {
    return onSnapshot(this.secretaryRef, snapshot => {
      const secretaries = snapshot.docs.map(docSnap => {
        const secretary = docSnap.data() as Secretary;
        (secretary as any).id = docSnap.id;
        return secretary;
      });
      callback(secretaries);
    });
  }
}
