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
  appointService = inject(AppointmentService);
  patientService = inject(PatientService);
  doctorService = inject(DoctorService);
  private fb = inject(FormBuilder);

  activeTab = signal<'standby' | 'confirmed' | 'completed' | 'cancelled'>('standby');
  showConfirmModal = signal<boolean>(false);
  showCancelModal = signal<boolean>(false);
  selectedAppointment = signal<any | null>(null);
  selectedPatient = signal<Patient | null>(null);
  isSearchingDoctors = signal<boolean>(false);

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
  currentUser: any = null;

  async ngOnInit() {
    await this.startLoad();
  }

  setActiveTab(tab: 'standby' | 'confirmed' | 'completed' | 'cancelled') {
    this.activeTab.set(tab);
  }

  async openConfirmModal(appointment: any) {
    this.selectedAppointment.set(appointment);
    const patient = await this.getPatient(appointment.patientId);
    this.selectedPatient.set(patient);
    this.initConfirmForm(appointment);
    this.showConfirmModal.set(true);
  }

  closeConfirmModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showConfirmModal.set(false);
    this.selectedAppointment.set(null);
    this.selectedPatient.set(null);
    this.errorMessage = '';
    this.availableDoctors = [];
  }

  async openCancelModal(appointment: any) {
    this.selectedAppointment.set(appointment);
    const patient = await this.getPatient(appointment.patientId);
    this.selectedPatient.set(patient);
    this.showCancelModal.set(true);
  }

  closeCancelModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) {
      return;
    }
    this.showCancelModal.set(false);
    this.selectedAppointment.set(null);
    this.selectedPatient.set(null);
  }

  confirmCancelAppointment() {
    const app = this.selectedAppointment();
    if (!app) return;
    this.updateAppointmentStatus(app.id, this.cancelledStatus);
    this.closeCancelModal();
  }

  initConfirmForm(appointment: any) {
    let formattedDate = '';
    if (appointment.day) {
      const d = appointment.day instanceof Date ? appointment.day : new Date(appointment.day);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().substring(0, 10);
      }
    }

    this.appointmentForm = this.fb.group({
      day: [formattedDate, Validators.required],
      hourStart: [appointment.hourStart || '', Validators.required],
      doctorId: [appointment.doctorId || '', Validators.required],
      status: ['Confirmé', Validators.required],
      service: [appointment.service || '', Validators.required]
    });

    this.availableDoctors = [];
    this.errorMessage = '';
  }

  async startLoad() {
    this.doctorService.getAllDoctors().then(doctors => {
      this.allDoctors = doctors;
    });

    this.allAppointments = await this.appointService.getAllAppointments();
    this.getSatusStandBy();
    await this.getSatusConfirmed();
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
      if (appointment.doctorId) {
        const doctor = await this.doctorService.getDoctorById(appointment.doctorId);
        appointment.doctorName = doctor?.fullName ?? 'Dr. Médecin référent';
      }
    }
  }

  async getSatusConfirmed() {
    this.allAppointmentConfirmed = this.allAppointments.filter(
      (appointment: any) => appointment.status === this.confirmedStatus
    );
    await this.enrichAppointmentsWithDoctorNames();
  }

  updateAppointmentStatus(id: string, status: string) {
    this.appointService.updateStatus(id, status)
      .then(() => {
        this.startLoad();
      })
      .catch(error => {
        console.error('Erreur lors de la mise à jour du statut', error);
      });
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

  updateAppointment(id: string) {
    if (this.appointmentForm.invalid) {
      this.errorMessage = 'Veuillez renseigner la date, l\'heure et sélectionner un praticien disponible.';
      return;
    }

    const data = this.appointmentForm.value;

    this.appointService.updateAppointment(id, {
      day: data.day,
      hourStart: data.hourStart,
      doctorId: data.doctorId,
      status: data.status
    }).then(() => {
      this.closeConfirmModal();
      this.startLoad();
    }).catch(err => {
      console.error('Erreur maj rdv:', err);
      this.errorMessage = 'Erreur lors de la mise à jour du rendez-vous.';
    });
  }

  async searchAvailableDoctors() {
    const date = this.appointmentForm.get('day')?.value;
    const hourStart = this.appointmentForm.get('hourStart')?.value;

    if (!date || !hourStart) {
      this.errorMessage = "Veuillez saisir la date et l'heure de consultation.";
      return;
    }
    const formDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (formDate < today) {
      this.errorMessage = "La date sélectionnée ne peut pas être passée.";
      return;
    }
    this.errorMessage = '';
    this.isSearchingDoctors.set(true);

    try {
      const dayOfWeek = this.capitalizeFirstLetter(this.getDayOfWeek(date));
      const doctorsOfDay = await this.doctorService.getDoctorsAvailableOn(dayOfWeek, hourStart);
      const rvSameSlot = await this.appointService.getAppointmentsByDateAndHour(date, hourStart);
      const occupiedDoctorIds = rvSameSlot.map(rv => rv.doctorId);

      const targetService = this.appointmentForm.get('service')?.value;
      this.availableDoctors = doctorsOfDay.filter(
        d => !occupiedDoctorIds.includes(d.id) && (!targetService || d.service === targetService)
      );

      if (this.availableDoctors.length === 0) {
        this.errorMessage = `Aucun praticien disponible pour ${targetService || 'cette spécialité'} le ${dayOfWeek} à ${hourStart}.`;
      }
    } catch (e) {
      console.error('Erreur recherche docteurs:', e);
      this.errorMessage = 'Erreur lors de la recherche des praticiens.';
    } finally {
      this.isSearchingDoctors.set(false);
    }
  }

  capitalizeFirstLetter(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  getDayOfWeek(dateStr: string): string {
    const d = new Date(dateStr);
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[d.getDay()];
  }

  getPatientInitials(patient: Patient | null): string {
    if (!patient) return 'PT';
    const first = patient.firstName?.trim().charAt(0) || '';
    const last = patient.lastName?.trim().charAt(0) || '';
    return (first + last).toUpperCase() || 'PT';
  }
}
