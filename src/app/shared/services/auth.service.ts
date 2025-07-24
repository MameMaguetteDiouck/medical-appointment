import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
  getAuth
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  doctorRole: string = 'doctors';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // écoute les changements d’état Firebase Auth
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
    });
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get userEmail(): string | null {
    return this.currentUserSubject.value?.email ?? null;
  }

  /**
   * Enregistrement :
   * - Ajoute l’utilisateur dans Firestore (collection patients, doctors, etc.)
   * - Puis crée le compte Auth Firebase
   */
  async signUp(email: string, password: string, collectionName: string, data?: any ): Promise<User | null> {
    try {
      if (collectionName != this.doctorRole) {
        const userDoc = doc(collection(this.firestore, collectionName));
        await setDoc(userDoc, {
          ...data,
          email,
          createdAt: new Date()
        });
      }

      // Puis crée le compte Firebase Auth
      const credential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      return credential.user;
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      throw error;
    }
  }

  /**
   * Connexion Firebase Auth
   */
  async signIn(email: string, password: string): Promise<User | null> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return credential.user;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    }
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth/sign-in']);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      throw error;
    }
  }

  /**
   * Récupère le rôle en fonction de l'email
   */
  async getUserRole(email: string): Promise<string | null> {
    const collections = ['patients', 'doctors', 'secretaries'];
    for (let collectionName of collections) {
      const ref = collection(this.firestore, collectionName);
      const q = query(ref, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        console.log('collections', collectionName);
        return collectionName;
      }
    }
    return null;
  }

  async userExists(email: string): Promise<boolean> {
    const gAuth = getAuth()
    return fetchSignInMethodsForEmail(gAuth, email)
      .then(methods => {
        return methods.length > 0;
      })
      .catch(error => {
        console.error('Erreur lors de la vérification de l\'utilisateur :', error);
        return false;
      });
  }
}
