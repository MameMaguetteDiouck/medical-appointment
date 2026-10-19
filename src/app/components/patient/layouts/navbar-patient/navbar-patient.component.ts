import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../shared/services/auth.service';
import { PatientService } from '../../../../shared/services/patient.service';

@Component({
  selector: 'app-navbar-patient',
  imports: [RouterLink, materialImports, CommonModule],
  templateUrl: './navbar-patient.component.html',
  styleUrl: './navbar-patient.component.css'
})
export class NavbarPatientComponent {

  authService = inject(AuthService);
  patientData = inject(PatientService);
  em?: string | null;
  currentUser: any = null;

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
