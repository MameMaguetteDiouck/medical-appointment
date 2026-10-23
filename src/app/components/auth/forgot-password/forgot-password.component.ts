import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { materialImports } from '../../../material.imports';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [materialImports, RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);

  resetForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  isSubmissionInProgress = signal<boolean>(false);
  errorMessage = signal<string>('');
  isSuccess = signal<boolean>(false);
  submittedEmail = signal<string>('');

  async onSubmit() {
    if (this.resetForm.invalid) {
      this.errorMessage.set('Veuillez renseigner une adresse email valide.');
      return;
    }

    this.isSubmissionInProgress.set(true);
    this.errorMessage.set('');
    const rawEmail = this.resetForm.value.email || '';
    const cleanEmail = rawEmail.trim().toLowerCase();

    try {
      await this.authService.resetPassword(cleanEmail);
      this.submittedEmail.set(cleanEmail);
      this.isSuccess.set(true);
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/user-not-found') {
        // For security best practices, we still indicate email instructions sent, or friendly message
        this.errorMessage.set("Aucun compte n'est enregistré avec cette adresse email.");
      } else if (code === 'auth/invalid-email') {
        this.errorMessage.set("Le format de l'adresse email n'est pas valide.");
      } else {
        this.errorMessage.set('Une erreur est survenue lors de la demande. Veuillez réessayer plus tard.');
      }
    } finally {
      this.isSubmissionInProgress.set(false);
    }
  }

  resetState() {
    this.isSuccess.set(false);
    this.errorMessage.set('');
    this.resetForm.reset();
  }
}
