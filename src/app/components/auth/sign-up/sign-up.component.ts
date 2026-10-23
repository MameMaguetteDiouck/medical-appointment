import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { materialImports } from '../../../material.imports';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [materialImports, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  authForm = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    address: new FormControl('', [Validators.required, Validators.minLength(2)]),
    description: new FormControl('', [Validators.required, Validators.minLength(5)]),
    birthDate: new FormControl('', Validators.required),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^(?:\+221|00221)?7[05678]\d{7}$/)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    passwordConfirmed: new FormControl('', [Validators.required]),
  });

  isSubmissionInProgress = signal<boolean>(false);
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);
  showPasswordConfirmed = signal<boolean>(false);

  async ngOnInit() {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const role = await this.authService.getUserRole(currentUser);
      if (role) {
        this.router.navigate([`/${role}`]);
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  togglePasswordConfirmedVisibility() {
    this.showPasswordConfirmed.update(v => !v);
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      this.errorMessage.set('Veuillez renseigner tous les champs obligatoires avec un format valide.');
      return;
    }

    const { password, passwordConfirmed, email, phone, ...patientData } = this.authForm.value;

    if (password !== passwordConfirmed) {
      this.errorMessage.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.isSubmissionInProgress.set(true);
    this.errorMessage.set('');

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    try {
      await this.authService.signUpPatient(cleanEmail, password!, {
        ...patientData,
        phone: cleanPhone
      });
      this.router.navigate(['/patients']);
    } catch (error: any) {
      this.handleSignUpError(error);
    } finally {
      this.isSubmissionInProgress.set(false);
    }
  }

  private handleSignUpError(error: any) {
    const code = error?.code || '';
    if (code === 'auth/email-already-in-use') {
      this.errorMessage.set('Cette adresse email est déjà associée à un compte patient.');
    } else if (code === 'auth/weak-password') {
      this.errorMessage.set('Le mot de passe doit comporter au moins 6 caractères.');
    } else if (code === 'auth/invalid-email') {
      this.errorMessage.set("Le format de l'adresse email n'est pas valide.");
    } else {
      this.errorMessage.set("Une erreur est survenue lors de l'inscription. Veuillez réessayer.");
    }
  }
}
