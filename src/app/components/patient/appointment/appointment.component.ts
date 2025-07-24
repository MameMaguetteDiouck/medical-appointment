import { Component, inject } from '@angular/core';
import { FooterPatientComponent } from '../layouts/footer-patient/footer-patient.component';
import { NavbarPatientComponent } from '../layouts/navbar-patient/navbar-patient.component';
import { materialImports } from '../../../material.imports';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { PatientService } from '../../../shared/services/patient.service';
import { Patient } from '../../../shared/interfaces/patient';
import { from, Subscription } from 'rxjs';
import { getAuth, User } from 'firebase/auth';
import { AuthService } from '../../../shared/services/auth.service';
import { Appointment, AppointmentStatus } from '../../../shared/interfaces/appointment';

@Component({
  selector: 'app-appointment',
  imports: [FooterPatientComponent, NavbarPatientComponent, materialImports, ReactiveFormsModule, CommonModule],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.css'
})
export class AppointmentComponent {
  router = inject(Router);
  data = inject(AppointmentService);
  patientService = inject(PatientService);
  authService = inject(AuthService);
  appointService = inject(AppointmentService)


  appointmentData!: Appointment;
  appointmentForm!: FormGroup;
  appointmentObj!: Appointment;
  isSubmissionInProgress: boolean = false;
  falg: boolean = false;
  errorMessage: string = '';
  em?: string | null;
  currentUser: any = null;

  ngOnInit() {
    this.em = this.authService.currentUser?.email; // méthode de ton service
    if (this.em) {
      this.patientService.getPatientByEmail(this.em).then(patient => {
        this.currentUser = patient;
        console.log('User:', this.currentUser);
      });
    } else {
      console.warn('Utilisateur non connecté ou email introuvable');
    }
  }

  constructor() {
    this.intitForm();
  }
  intitForm() {
    this.appointmentForm = new FormGroup({
      service: new FormControl('', [Validators.required, Validators.minLength(2)]),
      descriptionSick: new FormControl('', [Validators.required, Validators.minLength(2)]),
    })
  }


  onSubmit() {
    if (this.appointmentForm.invalid) {
      return;
    }

    this.appointmentData = {
      ...this.appointmentData,
      ...this.appointmentForm.value,
      status: AppointmentStatus.PENDING,
      patientId: this.currentUser.id
    };

    this.data.addAppointment(this.appointmentData)
      .then(() => {
        this.redirectToDashboardPage();
      })
      .catch(() => {
        this.isSubmissionInProgress = false;
        this.errorMessage = 'Une erreur est survenue...'
      })
  }
  redirectToDashboardPage() {
    this.router.navigate(['/patients/']);
  }


  private loadUserData(uid: string) {
    // Charger les données spécifiques à l'utilisateur
    console.log('Chargement des données pour:', uid);
  }

  private clearUserData() {
    // Nettoyer les données locales
    console.log('Nettoyage des données utilisateur');
  }
}


