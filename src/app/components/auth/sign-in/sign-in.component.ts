import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { materialImports } from '../../../material.imports';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [materialImports, RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  authForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  isSubmissionInProgress = signal<boolean>(false);
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);

  async ngOnInit() {
    // Redirect if already authenticated
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const role = await this.authService.getUserRole(currentUser);
      if (role) {
        this.router.navigate([`/${role}`]);
      }
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(visible => !visible);
  }

  async onSubmit() {
    if (this.authForm.invalid) {
      this.errorMessage.set('Veuillez renseigner un email valide et votre mot de passe.');
      return;
    }

    this.isSubmissionInProgress.set(true);
    this.errorMessage.set('');
    const rawEmail = this.authForm.value.email || '';
    const email = rawEmail.trim().toLowerCase();
    const password = this.authForm.value.password || '';

    try {
      const user = await this.authService.signIn(email, password);

      if (!user) {
        this.errorMessage.set('Identifiants invalides.');
        this.isSubmissionInProgress.set(false);
        return;
      }

      const userRole = await this.authService.getUserRole(user);

      if (userRole) {
        this.router.navigate([`/${userRole}`]);
      } else {
        this.errorMessage.set('Aucun profil associé à ce compte.');
      }
    } catch (error: any) {
      this.handleAuthError(error);
    } finally {
      this.isSubmissionInProgress.set(false);
    }
  }

  private handleAuthError(error: any) {
    const code = error?.code || '';
    if (code === 'auth/invalid-email') {
      this.errorMessage.set("L'adresse email saisie n'est pas valide.");
    } else if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      this.errorMessage.set('Email ou mot de passe incorrect.');
    } else if (code === 'auth/too-many-requests') {
      this.errorMessage.set('Trop de tentatives infructueuses. Veuillez patienter quelques instants.');
    } else if (code === 'auth/user-disabled') {
      this.errorMessage.set('Ce compte utilisateur a été désactivé par l\'administration.');
    } else {
      this.errorMessage.set('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
    }
  }
}