import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeDoctorComponent } from './component/home-doctor/home-doctor.component';
import { PrescriptionComponent } from './component/prescription/prescription.component';

const routes: Routes = [
  {
    path: '',
    component: HomeDoctorComponent,
  },
  {
    path: 'prescriptions',
    component: PrescriptionComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DoctorRoutingModule {

}
