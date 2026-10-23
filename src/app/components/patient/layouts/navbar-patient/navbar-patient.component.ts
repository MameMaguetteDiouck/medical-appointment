import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../shared/services/auth.service';
import { PatientService } from '../../../../shared/services/patient.service';

import { ChangePasswordModalComponent } from '../../../../shared/components/change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-navbar-patient',
  imports: [RouterLink, RouterLinkActive, materialImports, CommonModule, ChangePasswordModalComponent],
  templateUrl: './navbar-patient.component.html',
  styleUrl: './navbar-patient.component.css'
})
export class NavbarPatientComponent {

  authService = inject(AuthService);
  patientData = inject(PatientService);
  em?: string | null;
  currentUser: any = null;
  showProfileModal = signal<boolean>(false);
  showChangePasswordModal = signal<boolean>(false);

  ngOnInit() {
    this.em = this.authService.currentUser?.email;
    if (this.em) {
      this.patientData.getPatientByEmail(this.em).then(patient => {
        this.currentUser = patient;
        console.log('User:', this.currentUser);
      });
    } else {
      console.warn('Utilisateur non connecté ou email introuvable');
    }
  }
  // curentUser = this.patientData.g

  getUserInitials(): string {
    if (!this.currentUser) return 'P';
    const first = this.currentUser.firstName?.charAt(0) || '';
    const last = this.currentUser.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'P';
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
