import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeDoctorComponent } from './component/home-doctor/home-doctor.component';
import { PrescriptionComponent } from './component/prescription/prescription.component';
import { PatientComponent } from './component/patient/patient.component';

const routes: Routes = [
  {
    path: '',
    component: HomeDoctorComponent,
  },
  {
    path: 'prescriptions',
    component: PrescriptionComponent,
  },
  {
    path: 'patients',
    component: PatientComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorRoutingModule {

}
