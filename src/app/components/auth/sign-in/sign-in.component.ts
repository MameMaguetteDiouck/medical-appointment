import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { materialImports } from '../../../material.imports';
import { AuthService } from '../../../shared/services/auth.service';
import { PatientService } from '../../../shared/services/patient.service';
import { DoctorService } from '../../../shared/services/doctor.service';
import { user } from '@angular/fire/auth';
import { SecretaryService } from '../../../shared/services/secretary.service';

@Component({
  selector: 'app-sign-in',
  imports: [materialImports, RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent {
  authForm!: FormGroup;

  authService = inject(AuthService);
  patientService = inject(PatientService);
  doctorService = inject(DoctorService);
  secretaryService = inject(SecretaryService);
  router = inject(Router);
  patientRole: string = 'patients';
  doctorRole: string = 'doctors';
  secretaryRole: string = 'secretaries';
  patternPass: string = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};:\'",.<>/?]).{8,}$';

  isSubmissionInProgress: boolean = false;
  isPatient: boolean = false;
  isDoctor: boolean = false;
  welcome: boolean = true;
  errorMessage: string = '';

  constructor() {
    this.initForm();
  }
  initForm() {
    this.authForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required,]),
      passwordConfirmed: new FormControl(''),
    });
  }

  async onSubmitEmail() {
    this.isSubmissionInProgress = true;
    const email = this.authForm.value.email;
    if (!email) {
      this.errorMessage = 'Vérifez votre saisie...';
      this.isSubmissionInProgress = false;
      return;
    }

    try {
      const userRole = await this.authService.getUserRole(email);

      if (!userRole) {
        this.errorMessage = "Vérifiez votre saisie...";
        this.isSubmissionInProgress = false;
        return;
      }

      if (userRole == this.secretaryRole || userRole == this.patientRole) {
        this.welcome = false;
        this.isPatient = true;
        this.isSubmissionInProgress = false;
        return;
      }
      if (userRole == this.doctorRole) {
        const doctorAuth = await this.authService.userExists(email);
        if (!doctorAuth) {
          this.isDoctor = true;
          this.welcome = false;
          this.isSubmissionInProgress = false;
        }
        return;
      }
    } catch (error) {
      this.handleAuthError(error);
    }
  }
  async onSubmit() {
    if (this.authForm.invalid) return;

    this.isSubmissionInProgress = true;
    const { email, password } = this.authForm.value;

    try {
      const user = await this.authService.signIn(email, password);

      if (!user) {
        this.errorMessage = "Erreur de connexion.";
        this.isSubmissionInProgress = false;
        return;
      }

      // Récupérer le rôle de l'utilisateur depuis AuthService
      const userRole = await this.authService.getUserRole(email);

      if (userRole) {
        console.log(`Utilisateur connecté avec le rôle: ${userRole}`);
        // Rediriger vers la route correspondant au rôle
        this.router.navigate([`/${userRole}`]);
      } else {
        this.errorMessage = "Aucun rôle trouvé pour cet utilisateur.";
      }

    } catch (error) {
      this.handleAuthError(error);
    } finally {
      this.isSubmissionInProgress = false;
    }
  }
  async onSubmitDoctor() {
    if (this.authForm.get('email')?.invalid || this.authForm.get('password')?.errors?.['required']) {
      console.log('erreur saisie requis');
      this.errorMessage = 'Le password est requis...';
      return;
    }

    this.isSubmissionInProgress = true;

    const { email, password, passwordConfirmed } = this.authForm.value;
    const passwordControl = this.authForm.get('password');

    if (passwordControl?.errors?.['pattern']) {
      console.log('error pattern', password);
      this.errorMessage = 'Le mot de passe doit contenir : au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.';
      this.isSubmissionInProgress = false;
      return;
    }

    if (password !== passwordConfirmed) {
      this.errorMessage = 'Veuillez verifier les mots de pass...'
      this.isSubmissionInProgress = false;
      return;
    }
    try{
      const user = await this.authService.signUp(email, password, this.doctorRole);

      if (!user) {
        this.errorMessage = "Erreur de connexion.";
        this.isSubmissionInProgress = false;
        return;
      }

      const userRole = await this.authService.getUserRole(email);

      if (userRole) {
        this.router.navigate([`/${userRole}`]);
      } else {
        this.errorMessage = "Aucun rôle trouvé pour cet utilisateur.";
      }

    } catch (error) {
      this.handleAuthError(error);
    } finally {
      this.isSubmissionInProgress = false;
    }
  }

  handleAuthError(error: any) {
    console.error('Erreur:', error);

    const code = error.code;

    if (code === 'auth/invalid-email') {
      this.errorMessage = 'L\'email n\'est pas valide.';
    } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      this.errorMessage = 'Email ou mot de passe invalide.';
    } else if (code === 'auth/weak-password') {
      this.errorMessage = 'Mot de passe trop faible.';
    } else if (code === 'auth/email-already-in-use') {
      this.errorMessage = 'Cet email est déjà utilisé.';
    } else {
      this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
    }
  }
}