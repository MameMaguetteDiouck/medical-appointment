import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../shared/services/auth.service';
import { DoctorService } from '../../../../shared/services/doctor.service';

@Component({
  selector: 'app-navbar-doctor',
  imports: [RouterLink, materialImports, CommonModule],
  templateUrl: './navbar-doctor.component.html',
  styleUrl: './navbar-doctor.component.css'
})
export class NavbarDoctorComponent {
  authService = inject(AuthService);
  doctorData = inject(DoctorService);
  em?: string | null;
  currentUser: any = null;

  ngOnInit() {
    this.em = this.authService.currentUser?.email;
    if (this.em) {
      this.doctorData.getDoctorByEmail(this.em).then(doctor => {
        this.currentUser = doctor;
        console.log('User:', this.currentUser);
      });
    } else {
      console.warn('Utilisateur non connecté ou email introuvable');
    }
  }
  // curentUser = this.doctorData.g

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
