import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FooterDoctorComponent } from '../../layouts/footer-doctor/footer-doctor.component';
import { NavbarDoctorComponent } from '../../layouts/navbar-doctor/navbar-doctor.component';
import { materialImports } from '../../../../material.imports';
import { Patient } from '../../../../shared/interfaces/patient';
import { PatientService } from '../../../../shared/services/patient.service';
import { Appointment, AppointmentStatus } from '../../../../shared/interfaces/appointment';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { Doctor } from '../../../../shared/interfaces/doctor';

export interface PatientSummary {
  patient: Patient;
  appointments: Appointment[];
  lastAppointment?: Appointment;
  totalConsultations: number;
}

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarDoctorComponent,
    FooterDoctorComponent,
    materialImports
  ],
  templateUrl: './patient.component.html',
  styleUrl: './patient.component.css'
})
export class PatientComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private fb = inject(FormBuilder);

  currentUser = signal<Doctor | null>(null);
  patientsList = signal<PatientSummary[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');

  // Modals
  selectedPatientSummary = signal<PatientSummary | null>(null);
  showHistoryModal = signal<boolean>(false);
  showScheduleModal = signal<boolean>(false);

  scheduleForm!: FormGroup;
  isSubmittingSchedule = signal<boolean>(false);
  feedbackMessage = signal<{ type: 'success' | 'danger'; text: string } | null>(null);

  constructor() {
    this.initScheduleForm();
  }

  async ngOnInit(): Promise<void> {
    await this.initCurrentUser();
  }

  private initScheduleForm() {
    const today = new Date().toISOString().split('T')[0];
    this.scheduleForm = this.fb.group({
      day: [today, [Validators.required]],
      hourStart: ['09:00', [Validators.required]],
      descriptionSick: ['Consultation de suivi / Contrôle médical', [Validators.required]]
    });
  }

  async initCurrentUser() {
    this.isLoading.set(true);
    try {
      const email = this.authService.currentUser?.email;
      const uid = this.authService.currentUser?.uid;

      let doctor: Doctor | null = null;
      if (email) {
        doctor = await this.doctorService.getDoctorByEmail(email);
      }
      if (!doctor && uid) {
        doctor = await this.doctorService.getDoctorById(uid);
      }

      this.currentUser.set(doctor);
      if (doctor?.id) {
        await this.loadDoctorPatients(doctor);
      }
    } catch (error) {
      console.error('Erreur chargement praticien:', error);
      this.showToast('danger', 'Impossible de charger vos informations praticien.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadDoctorPatients(doctor: Doctor) {
    try {
      const docId = doctor.id || '';
      const authUid = doctor.authUid;

      const appointments = await this.appointmentService.allAppointmentForOneDoctor(docId, authUid);

      // Group appointments by patientId
      const grouped = new Map<string, Appointment[]>();
      appointments.forEach(app => {
        if (!app.patientId) return;
        if (!grouped.has(app.patientId)) {
          grouped.set(app.patientId, []);
        }
        grouped.get(app.patientId)!.push(app);
      });

      const summaries: PatientSummary[] = [];

      for (const [patientId, appts] of grouped.entries()) {
        try {
          const patient = await this.patientService.getPatientById(patientId);
          if (patient) {
            // Sort appointments descending
            const sorted = appts.sort((a, b) => {
              const da = new Date(a.day).getTime();
              const db = new Date(b.day).getTime();
              return db - da;
            });

            summaries.push({
              patient,
              appointments: sorted,
              lastAppointment: sorted[0],
              totalConsultations: sorted.length
            });
          }
        } catch (e) {
          console.warn('Patient fetch skipped for ID:', patientId, e);
        }
      }

      this.patientsList.set(summaries);
    } catch (err) {
      console.error('Erreur chargement patients du praticien:', err);
      this.showToast('danger', 'Erreur lors du chargement des dossiers patients.');
    }
  }

  get filteredPatients(): PatientSummary[] {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.patientsList();

    if (!q) return list;

    return list.filter(item => {
      const p = item.patient;
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const phone = p.phone ? String(p.phone) : '';
      const email = (p.email || '').toLowerCase();
      const lastMotif = (item.lastAppointment?.descriptionSick || '').toLowerCase();

      return fullName.includes(q) || phone.includes(q) || email.includes(q) || lastMotif.includes(q);
    });
  }

  getPatientInitials(patient: Patient): string {
    const f = (patient.firstName || '').charAt(0);
    const l = (patient.lastName || '').charAt(0);
    return (f + l).toUpperCase() || 'P';
  }

  openHistoryModal(summary: PatientSummary) {
    this.selectedPatientSummary.set(summary);
    this.showHistoryModal.set(true);
  }

  closeHistoryModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) return;
    this.showHistoryModal.set(false);
    this.selectedPatientSummary.set(null);
  }

  openScheduleModal(summary: PatientSummary) {
    this.selectedPatientSummary.set(summary);
    const today = new Date().toISOString().split('T')[0];
    this.scheduleForm.reset({
      day: today,
      hourStart: '10:00',
      descriptionSick: 'Consultation de suivi / Contrôle médical'
    });
    this.showScheduleModal.set(true);
  }

  closeScheduleModal(event?: MouseEvent) {
    if (this.isSubmittingSchedule()) return;
    if (event && event.target !== event.currentTarget) return;
    this.showScheduleModal.set(false);
    this.selectedPatientSummary.set(null);
  }

  async submitSchedule() {
    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    const summary = this.selectedPatientSummary();
    const doc = this.currentUser();
    if (!summary || !doc?.id) return;

    this.isSubmittingSchedule.set(true);

    try {
      const formVal = this.scheduleForm.value;
      const newAppt: any = {
        patientId: summary.patient.id,
        doctorId: doc.id,
        doctorName: doc.fullName || 'Dr. Medico',
        service: doc.service || 'Médecine Générale',
        day: formVal.day,
        hourStart: formVal.hourStart,
        descriptionSick: formVal.descriptionSick,
        status: AppointmentStatus.CONFIRMED,
        doctorObservation: ''
      };

      await this.appointmentService.addAppointment(newAppt);

      this.showToast('success', `Rendez-vous de suivi programmé pour ${summary.patient.firstName} ${summary.patient.lastName} le ${formVal.day} à ${formVal.hourStart}.`);
      this.closeScheduleModal();

      // Reload
      await this.loadDoctorPatients(doc);
    } catch (error) {
      console.error('Erreur programmation RDV:', error);
      this.showToast('danger', 'Une erreur est survenue lors de la programmation du rendez-vous.');
    } finally {
      this.isSubmittingSchedule.set(false);
    }
  }

  showToast(type: 'success' | 'danger', text: string) {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4500);
  }
}
