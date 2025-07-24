import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeSecretaryComponent } from './component/home-secretary/home-secretary.component';
import { ManagementDoctorComponent } from './component/management-doctor/management-doctor.component';
import { ValidateAppointementComponent } from './component/validate-appointement/validate-appointement.component';

const routes: Routes = [
  {
    path: '',
    component: HomeSecretaryComponent,
  },
  {
    path: 'management-doctors',
    component: ManagementDoctorComponent,
  },
  {
    path: 'validate-appointment',
    component: ValidateAppointementComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SecretaryRoutingModule { }
