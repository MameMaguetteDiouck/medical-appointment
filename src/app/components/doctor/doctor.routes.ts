import { Routes } from '@angular/router';
import { HomeDoctorComponent } from './component/home-doctor/home-doctor.component';
import { PrescriptionComponent } from './component/prescription/prescription.component';
import { PatientComponent } from './component/patient/patient.component';

export const DOCTOR_ROUTES: Routes = [
  {
    path: '',
    component: HomeDoctorComponent
  },
  {
    path: 'prescriptions',
    component: PrescriptionComponent
  },
  {
    path: 'patients',
    component: PatientComponent
  }
];
