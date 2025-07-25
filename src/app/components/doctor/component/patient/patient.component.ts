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
  selector: 'app-patient',
  imports: [FooterDoctorComponent, NavbarDoctorComponent, CommonModule, materialImports, ReactiveFormsModule],
  templateUrl: './patient.component.html',
  styleUrl: './patient.component.css'
})
export class PatientComponent {
  appointmentService = inject(AppointmentService);
  authService = inject(AuthService);
  patientService = inject(PatientService)
  doctorService = inject(DoctorService);
  availableDoctors: Doctor[] = [];
  allAppointmentForDoctor: Appointment[] = [];
  allAppointmentCompleted: Appointment[] = [];
  allAppointmentConfirmed: Appointment[] = [];
  patientMap: Record<string, Promise<Patient | null>> = {};
  panelOpenState = signal(false);
  confirmedStatus: string = 'Confirmé';
  completedStatus: string = 'Passé';

  errorMessage: string = '';
  em?: string | null;
  currentUser: any;
  appointmentForm!: FormGroup;
  isConfirmed: boolean = true;
  private fb = inject(FormBuilder);
  appointmentData!: Appointment;
  isSubmissionInProgress: boolean = false;
  message: string = '';

  async ngOnInit() {
    this.em = this.authService.currentUser?.email;
    if (this.em) {
      this.currentUser = await this.doctorService.getDoctorByEmail(this.em);
      console.log('User:', this.currentUser);
    }
    this.startLoad()
  }

  initConfirmForm(appointment: any) {
    this.appointmentForm = this.fb.group({
      day: [appointment.date, Validators.required],
      hourStart: [appointment.hourStart, Validators.required],
      patientId: [appointment.patientId, Validators.required],
    });

    this.availableDoctors = [];
  }

  getStatusCompleted() {
    this.allAppointmentCompleted = this.allAppointmentForDoctor.filter(
      (appointment: any) => appointment.status === this.completedStatus
    );
  }
  
  async startLoad() {
    this.allAppointmentForDoctor = await this.appointmentService.allAppointmentForOneDoctor(this.currentUser.id);
    this.allAppointmentForDoctor.forEach(app => {
      if (!this.patientMap[app.patientId]) {
        this.patientMap[app.patientId] = this.getPatient(app.patientId);
      }
    });
    this.getSatusConfirmedForToday();
    this.getStatusCompleted();
  }

  createMedocControl(): FormControl {
    return new FormControl('', Validators.required);
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
    this.allAppointmentConfirmed = this.allAppointmentForDoctor.filter(
      (appointment: any) => appointment.status === this.confirmedStatus
    );

    await this.enrichAppointmentsWithDoctorNames()
  }

  onSubmit() {
    if (this.appointmentForm.invalid) {
      return;
    }

    this.appointmentData = {
      ...this.appointmentData,
      ...this.appointmentForm.value,
      doctorId: this.currentUser.id,
      service: this.currentUser.service,
      status: AppointmentStatus.CONFIRMED,
    };

    this.appointmentService.addAppointment(this.appointmentData)
      .then(() => {
        this.message = "Insertion réussie";
      })
      .catch(() => {
        this.errorMessage = 'Une erreur est survenue...'
      })
  }
}
