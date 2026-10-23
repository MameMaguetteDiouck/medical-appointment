import { Routes } from '@angular/router';
import { HomePatientComponent } from './home-patient/home-patient.component';
import { AppointmentComponent } from './appointment/appointment.component';

export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    component: HomePatientComponent
  },
  {
    path: 'appointment',
    component: AppointmentComponent
  }
];
