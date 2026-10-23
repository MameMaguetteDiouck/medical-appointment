import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { materialImports } from '../../../material.imports';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, materialImports],
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.css']
})
export class ChangePasswordModalComponent {
  @Input() isOpen = false;
  @Input() forceChange = false;
  @Output() closed = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<void>();

  passwordForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  constructor() {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  get currentPassword() {
    return this.passwordForm.get('currentPassword');
  }

  get newPassword() {
    return this.passwordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.passwordForm.get('confirmPassword');
  }

  get hasPasswordMismatch(): boolean {
    return (
      !!this.passwordForm.errors?.['passwordMismatch'] &&
      !!this.confirmPassword?.touched &&
      !!this.confirmPassword?.value
    );
  }

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  closeModal(event?: MouseEvent, bypassForce = false) {
    if (this.isSubmitting) return; // Prevent closing while in progress
    if (!bypassForce && this.forceChange && !this.successMessage) return; // Prevent dismissal if change is mandatory
    if (event && event.target !== event.currentTarget) return;

    this.resetState();
    this.closed.emit();
  }

  resetState() {
    this.passwordForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
    this.isSubmitting = false;
    this.showCurrentPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  async onSubmit(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { currentPassword, newPassword } = this.passwordForm.value;

    try {
      await this.authService.changePassword(currentPassword, newPassword);
      this.successMessage = 'Votre mot de passe a été modifié avec succès.';
      this.passwordForm.reset();
      this.passwordChanged.emit();

      // Automatically close after a short delay so user sees confirmation
      setTimeout(() => {
        this.closeModal(undefined, true);
      }, 1800);
    } catch (error: any) {
      this.errorMessage = error?.message || 'Erreur lors de la modification du mot de passe.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
