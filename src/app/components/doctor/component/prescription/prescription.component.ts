import { Component } from '@angular/core';
import { NavbarDoctorComponent } from '../../layouts/navbar-doctor/navbar-doctor.component';
import { FooterDoctorComponent } from '../../layouts/footer-doctor/footer-doctor.component';

@Component({
  selector: 'app-prescription',
  imports: [NavbarDoctorComponent, FooterDoctorComponent],
  templateUrl: './prescription.component.html',
  styleUrl: './prescription.component.css'
})
export class PrescriptionComponent {

}
