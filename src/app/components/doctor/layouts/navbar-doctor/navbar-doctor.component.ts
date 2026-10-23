import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../shared/services/auth.service';
import { DoctorService } from '../../../../shared/services/doctor.service';

import { ChangePasswordModalComponent } from '../../../../shared/components/change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-navbar-doctor',
  imports: [RouterLink, RouterLinkActive, materialImports, CommonModule, ChangePasswordModalComponent],
  templateUrl: './navbar-doctor.component.html',
  styleUrl: './navbar-doctor.component.css'
})
export class NavbarDoctorComponent implements OnInit {
  authService = inject(AuthService);
  doctorData = inject(DoctorService);
  em?: string | null;
  currentUser: any = null;
  showProfileModal = signal<boolean>(false);
  showChangePasswordModal = signal<boolean>(false);
  forcePasswordChange = signal<boolean>(false);

  ngOnInit() {
    this.em = this.authService.currentUser?.email;
    if (this.em) {
      this.doctorData.getDoctorByEmail(this.em).then(doctor => {
        this.currentUser = doctor;
        console.log('User:', this.currentUser);
        if (this.currentUser?.mustChangePassword) {
          this.forcePasswordChange.set(true);
          this.showChangePasswordModal.set(true);
        }
      });
    } else {
      console.warn('Utilisateur non connecté ou email introuvable');
    }
  }

  async onPasswordChanged() {
    if (this.currentUser) {
      try {
        if (this.currentUser.id) {
          await this.doctorData.updateDoctor(this.currentUser.id, { mustChangePassword: false });
        }
        if (this.currentUser.authUid && this.currentUser.authUid !== this.currentUser.id) {
          await this.doctorData.updateDoctor(this.currentUser.authUid, { mustChangePassword: false });
        }
        this.currentUser.mustChangePassword = false;
        this.forcePasswordChange.set(false);
      } catch (err) {
        console.error('Erreur lors de la mise à jour de mustChangePassword:', err);
      }
    }
  }
  // curentUser = this.doctorData.g

  getDoctorInitials(): string {
    if (!this.currentUser) return 'Dr';
    const first = this.currentUser.firstName?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    if (first || last) {
      return (first + last).toUpperCase();
    }
    return this.currentUser.fullName ? this.currentUser.fullName.charAt(0).toUpperCase() : 'Dr';
  }

  openProfileModal() {
    this.showProfileModal.set(true);
  }

  closeProfileModal() {
    this.showProfileModal.set(false);
  }

  openChangePasswordModal() {
    this.showProfileModal.set(false);
    this.showChangePasswordModal.set(true);
  }

  closeChangePasswordModal() {
    this.showChangePasswordModal.set(false);
  }

  async logout() {
    try {
      await this.authService.logout();
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Optionnel : afficher un message d'erreur à l'utilisateur
    }
  }
}
