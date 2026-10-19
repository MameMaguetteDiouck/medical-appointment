import { Component, inject, OnInit, signal } from '@angular/core';
import { FooterDoctorComponent } from '../../layouts/footer-doctor/footer-doctor.component';
import { NavbarDoctorComponent } from '../../layouts/navbar-doctor/navbar-doctor.component';
import { CommonModule } from '@angular/common';
import { materialImports } from '../../../../material.imports';
import { Patient } from '../../../../shared/interfaces/patient';
import { PatientService } from '../../../../shared/services/patient.service';
import { Appointment, AppointmentStatus } from '../../../../shared/interfaces/appointment';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { Doctor } from '../../../../shared/interfaces/doctor';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-home-doctor',
  imports: [FooterDoctorComponent, NavbarDoctorComponent, CommonModule, materialImports, ReactiveFormsModule],
  templateUrl: './home-doctor.component.html',
  styleUrl: './home-doctor.component.css'
})
export class HomeDoctorComponent {
  appointmentService = inject(AppointmentService);
  authService = inject(AuthService);
  patientService = inject(PatientService)
  doctorService = inject(DoctorService);
  allAppointmentForToday: Appointment[] = [];
  allAppointmentConfirmed: Appointment[] = [];
  patientMap: Record<string, Promise<Patient | null>> = {};
  panelOpenState = signal(false);
  confirmedStatus: string = 'Confirmé';

  errorMessage: string = '';
  em?: string | null;
  currentUser: any;
  appointmentForm!: FormGroup;
  isConfirmed: boolean = true;

  async ngOnInit() {
    this.appointmentForm = new FormGroup({
      doctorObservation: new FormControl('', Validators.required),
      ordonnance: new FormArray([this.createMedocControl()])
    })

    this.em = this.authService.currentUser?.email;
    if (this.em) {
      this.currentUser = await this.doctorService.getDoctorByEmail(this.em);
      console.log('User:', this.currentUser);
    }
    await this.startLoad();
    console.log('rv today', this.allAppointmentForToday);
  }

  createMedocControl(): FormControl {
    return new FormControl('', Validators.required);
  }
  get ordonnance(): FormArray {
    return this.appointmentForm.get('ordonnance') as FormArray;
  }

  addMedoc() {
    this.ordonnance.push(this.createMedocControl());
  }
  removeMedoc(index: number) {
    this.ordonnance.removeAt(index);
  }

  async startLoad() {
    this.allAppointmentForToday = await this.appointmentService.getAppointmentsForToday(this.currentUser.id);
    this.allAppointmentForToday.forEach(app => {
      if (!this.patientMap[app.patientId]) {
        this.patientMap[app.patientId] = this.getPatient(app.patientId);
      }
    });
    this.getSatusConfirmedForToday();
  }

  async getPatient(id: string): Promise<Patient | null> {
    return await this.patientService.getPatientById(id);
  }

  async enrichAppointmentsWithDoctorNames() {
    for (const appointment of this.allAppointmentConfirmed) {
      const doctor = await this.doctorService.getDoctorById(appointment.doctorId);
      appointment.doctorName = doctor?.fullName ?? 'Docteur inconnu';
    }
  }

  async getSatusConfirmedForToday() {
    this.allAppointmentConfirmed = this.allAppointmentForToday.filter(
      (appointment: any) => appointment.status === this.confirmedStatus
    );

    await this.enrichAppointmentsWithDoctorNames()
  }

  updateAppointment(id: string): void {
    console.log("je suis dedans...")
    if (this.appointmentForm.invalid) {
      this.errorMessage = 'Veuillez saisir votre Observation...'
      return;
    }
    const data = this.appointmentForm.value;

    this.appointmentService.updateAppointment(id, {
      doctorObservation: data.doctorObservation,
      orrdonnance: data.ordonnance,
      status: AppointmentStatus.COMPLETED
    }).then(() => {
      console.log('Rendez-vous mis à jour...');
    });
    this.startLoad();
  }

  handleConfirmClick(appointmentId: string) {
  this.updateAppointment(appointmentId);

  // Évite les erreurs d'accessibilité en retirant le focus
  setTimeout(() => {
    (document.activeElement as HTMLElement)?.blur();
  }, 0);
}
}
