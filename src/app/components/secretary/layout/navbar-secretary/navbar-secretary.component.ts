import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth.service';
import { SecretaryService } from '../../../../shared/services/secretary.service';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { Unsubscribe } from '@angular/fire/firestore';

import { ChangePasswordModalComponent } from '../../../../shared/components/change-password-modal/change-password-modal.component';

@Component({
  selector: 'app-navbar-secretary',
  imports: [materialImports, CommonModule, RouterLink, RouterLinkActive, ChangePasswordModalComponent],
  templateUrl: './navbar-secretary.component.html',
  styleUrl: './navbar-secretary.component.css'
})
export class NavbarSecretaryComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private secretaryService = inject(SecretaryService);
  private appointmentService = inject(AppointmentService);

  currentUser = signal<any>(null);
  pendingAppointmentsCount = signal<number>(0);
  showProfileModal = signal<boolean>(false);
  showChangePasswordModal = signal<boolean>(false);
  private unsubscribeAppointments?: Unsubscribe;

  ngOnInit() {
    const user = this.authService.currentUser;
    const email = user?.email;
    if (email) {
      this.secretaryService.getSecretaryByEmail(email).then(sec => {
        if (sec) {
          this.currentUser.set(sec);
        } else {
          this.currentUser.set({
            name: user.displayName || email.split('@')[0],
            email: email
          });
        }
      });
    }

    this.unsubscribeAppointments = this.appointmentService.observeAppointments(appointments => {
      const pending = appointments.filter(a => a.status === 'Attente de confirmation');
      this.pendingAppointmentsCount.set(pending.length);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribeAppointments) {
      this.unsubscribeAppointments();
    }
  }

  getSecretaryName(): string {
    const user = this.currentUser();
    if (!user) return 'Secrétariat';
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'Secrétariat';
  }

  getSecretaryInitials(): string {
    const name = this.getSecretaryName();
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'SC';
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
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
}
