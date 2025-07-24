import { Component, inject } from '@angular/core';
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../shared/services/auth.service';
import { SecretaryService } from '../../../../shared/services/secretary.service';

@Component({
  selector: 'app-navbar-secretary',
  imports: [materialImports, CommonModule, RouterLink],
  templateUrl: './navbar-secretary.component.html',
  styleUrl: './navbar-secretary.component.css'
})
export class NavbarSecretaryComponent {
  private authService = inject(AuthService);
  secretaryService = inject(SecretaryService);
  em?: string | null;
  currentUser: any = null; // ou type Patient

  ngOnInit() {
    this.em = this.authService.currentUser?.email; // méthode de ton service
    if (this.em) {
      this.secretaryService.getSecretaryByEmail(this.em).then(patient => {
        this.currentUser = patient;
        console.log('User:', this.currentUser);
      });
    } else {
      console.warn('Utilisateur non connecté ou email introuvable');
    }
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
