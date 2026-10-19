import { Component, inject, signal } from '@angular/core';
import { NavbarPatientComponent } from '../layouts/navbar-patient/navbar-patient.component';
import { FooterPatientComponent } from '../layouts/footer-patient/footer-patient.component';
import { materialImports } from '../../../material.imports';
import { AuthService } from '../../../shared/services/auth.service';
import { PatientService } from '../../../shared/services/patient.service';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-patient',
  imports: [NavbarPatientComponent, FooterPatientComponent, materialImports, CommonModule],
  templateUrl: './home-patient.component.html',
  styleUrl: './home-patient.component.css'
})
export class HomePatientComponent {
  authService = inject(AuthService);
  patientService = inject(PatientService);
  appointService = inject(AppointmentService)
  panelOpenState = signal(false);
  allAppointments: any;

  em?: string | null;
  currentUser: any = null; // ou type Patient

  ngOnInit() {
    this.em = this.authService.currentUser?.email; // méthode dans ton AuthService

    if (this.em) {
      this.patientService.getPatientByEmail(this.em).then(async patient => {
        this.currentUser = patient;
        console.log('User:', this.currentUser);

        // Appel déplacé ici, une fois que currentUser est bien défini
        this.allAppointments = await this.appointService.allAppointmentForOnePatient(this.currentUser.id);
        console.log('rv', this.allAppointments);
        this.appointService.allAppointmentForOnePatient(this.currentUser.id).then(list => {
          console.log('Rendez-vous du patient:', list);
        });
      });
    } else {
      console.warn('Utilisateur non connecté ou email introuvable');
    }
  }

}
