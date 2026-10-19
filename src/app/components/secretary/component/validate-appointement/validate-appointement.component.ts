import { Component, inject, signal } from '@angular/core';
import { NavbarSecretaryComponent } from "../../layout/navbar-secretary/navbar-secretary.component";
import { FooterSecretaryComponent } from "../../layout/footer-secretary/footer-secretary.component";
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../shared/interfaces/appointment';
import { PatientService } from '../../../../shared/services/patient.service';
import { Patient } from '../../../../shared/interfaces/patient';
import { Doctor } from '../../../../shared/interfaces/doctor';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-validate-appointement',
  imports: [NavbarSecretaryComponent, FooterSecretaryComponent, materialImports, CommonModule, ReactiveFormsModule],
  templateUrl: './validate-appointement.component.html',
  styleUrl: './validate-appointement.component.css'
})
export class ValidateAppointementComponent {
  appointService = inject(AppointmentService)
  patientService = inject(PatientService);
  doctorService = inject(DoctorService);
  panelOpenState = signal(false);
  allDoctors: Doctor[] = [];
  availableDoctors: Doctor[] = [];
  allAppointments: Appointment[] = [];
  allAppointmentStandby: Appointment[] = [];
  allAppointmentConfirmed: Appointment[] = [];
  allAppointmentCompleted: Appointment[] = [];
  allAppointmentCancelled: Appointment[] = [];
  patientMap: Record<string, Promise<Patient | null>> = {};
  standByStatus: string = 'Attente de confirmation';
  confirmedStatus: string = 'Confirmé';
  cancelledStatus: string = 'Annulé';
  completedStatus: string = 'Passé';
  errorMessage: string = '';

  appointmentForm!: FormGroup;
  em?: string | null;
  currentUser: any = null; // ou type Patient

  constructor(
    private fb: FormBuilder,
  ) { }


  async ngOnInit() {
    this.startLoad()
  }
  initConfirmForm(appointment: any) {
    this.appointmentForm = this.fb.group({
      day: [appointment.date, Validators.required],
      hourStart: [appointment.hourStart, Validators.required],
      doctorId: [appointment.doctorId, Validators.required],
      status: ['Confirmé', Validators.required],
      service: [appointment.service, Validators.required]
    });

    this.availableDoctors = [];
  }
  async startLoad() {
    // Charger la liste des doctors
    this.doctorService.getAllDoctors().then(doctors => {
      this.allDoctors = doctors;
    });

    this.allAppointments = await this.appointService.getAllAppointments();
    this.getSatusStandBy();
    this.getSatusConfirmed();
    this.getStatusCancelled();
    this.getStatusCompleted();

    this.allAppointments.forEach(app => {
      if (!this.patientMap[app.patientId]) {
        this.patientMap[app.patientId] = this.getPatient(app.patientId);
      }
    });
  }
  async enrichAppointmentsWithDoctorNames() {
    for (const appointment of this.allAppointmentConfirmed) {
      const doctor = await this.doctorService.getDoctorById(appointment.doctorId);
      appointment.doctorName = doctor?.fullName ?? 'Docteur inconnu';
    }
  }


  async getSatusConfirmed() {
    this.allAppointmentConfirmed = this.allAppointments.filter(
      (appointment: any) => appointment.status === this.confirmedStatus
    );

    await this.enrichAppointmentsWithDoctorNames()
  }
  updateAppointmentStatus(id: string, status: string) {
    this.appointService.updateStatus(id, status)
      .then(() => {
        console.log('Statut mis à jour avec succès');
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour du statut', error);
      });
    this.startLoad();
  }
  getStatusCancelled() {
    this.allAppointmentCancelled = this.allAppointments.filter(
      (appointment: any) => appointment.status === this.cancelledStatus
    );
  }
  getStatusCompleted() {
    this.allAppointmentCompleted = this.allAppointments.filter(
      (appointment: any) => appointment.status === this.completedStatus
    );
  }
  getSatusStandBy() {
    this.allAppointmentStandby = this.allAppointments.filter(
      (appointment: any) => appointment.status === this.standByStatus
    );
  }

  async getPatient(id: string): Promise<Patient | null> {
    return await this.patientService.getPatientById(id);
  }

  async findAvailableDoctors(date: string, hourStart: string) {

    const appointments = await this.appointService.getAppointmentsByDateAndHour(date, hourStart);

    const occupiedDoctorIds = appointments.map(a => a.doctorId);

    // Filtre les doctors dispo
    const availableDoctors = this.allDoctors.filter(d => !occupiedDoctorIds.includes(d.id));

    console.log('Doctors disponibles:', availableDoctors);
    return availableDoctors;
  }

  updateAppointment(id: string) {
    if (this.appointmentForm.invalid) {
      console.log('Form invalide');
      return;
    }

    const data = this.appointmentForm.value;

    this.appointService.updateAppointment(id, {
      day: data.day,
      hourStart: data.hourStart,
      doctorId: data.doctorId,
      status: data.status
    }).then(() => {
      console.log('Rendez-vous mis à jour');
    });
    this.startLoad();
  }

  async searchAvailableDoctors() {
    const date = this.appointmentForm.get('day')?.value;
    const hourStart = this.appointmentForm.get('hourStart')?.value;

    if (!date || !hourStart) {
      alert("Veuillez saisir la date et l'hourStart !");
      return;
    }
    const formDate = new Date(this.appointmentForm.get('day')?.value);
    const today = new Date();
    
    if (formDate <= today) {
      this.errorMessage = `La date saisit doit dépasser celle d'aujourd'hui`;
      return;
    }

    const dayOfWeek = this.capitalizeFirstLetter(this.getDayOfWeek(date));

    const doctorsOfDay = await this.doctorService.getDoctorsAvailableOn(dayOfWeek, hourStart);
    const rvSameSlot = await this.appointService.getAppointmentsByDateAndHour(date, hourStart);

    const occupiedDoctorIds = rvSameSlot.map(rv => rv.doctorId);

    this.availableDoctors = doctorsOfDay.filter(
      d => !occupiedDoctorIds.includes(d.id) && d.service === this.appointmentForm.get('service')?.value,
    );
  }

  capitalizeFirstLetter(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  getDayOfWeek(dateStr: string): string {
    const d = new Date(dateStr);
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[d.getDay()];
  }

}
