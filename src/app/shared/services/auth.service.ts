import { Injectable, inject } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  fetchSignInMethodsForEmail,
  getAuth,
  IdTokenResult,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
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

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
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
   * Public sign-up is strictly reserved for patients.
   * Creates Auth credentials first, then links the Firestore patient document directly to the Auth UID.
   */
  async signUpPatient(email: string, password: string, patientData: Record<string, any>): Promise<User> {
    try {
      // 1. Create Firebase Auth account first
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      const uid = credential.user.uid;

      // 2. Persist patient profile in Firestore keyed by Auth UID
      const patientDoc = doc(this.firestore, 'patients', uid);
      await setDoc(patientDoc, {
        ...patientData,
        id: uid,
        email,
        status: 'patients',
        createdAt: new Date()
      });

      return credential.user;
    } catch (error) {
      console.error("Erreur lors de l'inscription patient :", error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<User | null> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      return credential.user;
    } catch (error) {
      console.error("Erreur de connexion :", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth/sign-in']);
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe :', error);
      throw error;
    }
  }

  /**
   * Securely changes the currently logged-in user's password.
   * Re-authenticates with current password before updating to satisfy Firebase security requirements.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || !user.email) {
      throw new Error('Aucun utilisateur connecté avec une adresse email valide.');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Le mot de passe actuel saisi est incorrect.');
      } else if (code === 'auth/weak-password') {
        throw new Error('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      } else if (code === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives infructueuses. Veuillez patienter quelques minutes.');
      } else if (code === 'auth/requires-recent-login') {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter avant de modifier votre mot de passe.');
      } else {
        throw new Error(error?.message || 'Erreur lors de la modification du mot de passe.');
      }
    }
  }

  /**
   * Detects the role:
   * 1. Check custom claims in JWT (fastest, O(1), secure)
   * 2. Direct document lookup by UID (O(1))
   * 3. Fallback to email query for legacy records
   */
  async getUserRole(userOrEmail: User | string): Promise<string | null> {
    const collections = ['patients', 'doctors', 'secretaries'];

    if (typeof userOrEmail !== 'string') {
      const user = userOrEmail;

      // 1. Check JWT custom claims if configured
      try {
        const tokenResult: IdTokenResult = await user.getIdTokenResult();
        if (tokenResult.claims['role']) {
          return tokenResult.claims['role'] as string;
        }
      } catch (e) {
        // Continue to document checks if claims reading fails
      }

      // 2. Direct UID check (O(1))
      for (const col of collections) {
        const docRef = doc(this.firestore, col, user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return col;
        }
      }

      // 3. Fallback by email
      if (user.email) {
        return this.getUserRoleByEmail(user.email);
      }

      return null;
    }

    return this.getUserRoleByEmail(userOrEmail);
  }

  private async getUserRoleByEmail(email: string): Promise<string | null> {
    const collections = ['patients', 'doctors', 'secretaries'];
    for (const collectionName of collections) {
      const ref = collection(this.firestore, collectionName);
      const q = query(ref, where('email', '==', email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        return collectionName;
      }
    }
    return null;
  }

  async userExists(email: string): Promise<boolean> {
    const gAuth = getAuth();
    return fetchSignInMethodsForEmail(gAuth, email)
      .then(methods => methods.length > 0)
      .catch(error => {
        console.error('Erreur lors de la vérification de l\'utilisateur :', error);
        return false;
      });
  }
}
