import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-home-doctor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarDoctorComponent,
    FooterDoctorComponent,
    materialImports
  ],
  templateUrl: './home-doctor.component.html',
  styleUrl: './home-doctor.component.css'
})
export class HomeDoctorComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private fb = inject(FormBuilder);

  currentUser = signal<Doctor | null>(null);
  allAppointments = signal<Appointment[]>([]);
  todayAppointments = signal<Appointment[]>([]);
  patientsMap = new Map<string, Patient>();

  isLoading = signal<boolean>(true);
  isRefreshing = signal<boolean>(false);
  activeTab = signal<'today-all' | 'today-pending' | 'today-completed' | 'all'>('today-all');
  searchQuery = signal<string>('');

  // Modals
  activeAppointment = signal<Appointment | null>(null);
  activePatient = signal<Patient | null>(null);
  showConsultationModal = signal<boolean>(false);
  showDetailsModal = signal<boolean>(false);
  isSubmittingConsultation = signal<boolean>(false);

  // Notifications
  feedbackMessage = signal<{ type: 'success' | 'danger'; text: string } | null>(null);

  consultationForm!: FormGroup;

  quickSuggestions: string[] = [
    'Paracétamol 1g (1 cp toutes les 8h si douleur)',
    'Amoxicilline 1g (1 cp matin et soir pendant 6 jours)',
    'Ibuprofène 400mg (1 cp pendant les repas, max 3/jour)',
    'Oméprazole 20mg (1 gélule le matin à jeun)',
    'Sérum physiologique nasal (lavage 3x/jour)',
    'Bilan sanguin complet à jeun (NFS, Glycémie, Créatinine)'
  ];

  todayFormatted: string = '';

  constructor() {
    this.initForm();
    this.computeTodayDate();
  }

  async ngOnInit(): Promise<void> {
    await this.initCurrentUser();
  }

  private computeTodayDate() {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    const now = new Date();
    this.todayFormatted = now.toLocaleDateString('fr-FR', options);
    // Capitalize first letter
    this.todayFormatted = this.todayFormatted.charAt(0).toUpperCase() + this.todayFormatted.slice(1);
  }

  private initForm() {
    this.consultationForm = this.fb.group({
      doctorObservation: ['', [Validators.required, Validators.minLength(5)]],
      ordonnance: this.fb.array([this.createMedocControl()])
    });
  }

  createMedocControl(value = ''): FormControl {
    return new FormControl(value, Validators.required);
  }

  get ordonnance(): FormArray {
    return this.consultationForm.get('ordonnance') as FormArray;
  }

  addMedoc(value = '') {
    this.ordonnance.push(this.createMedocControl(value));
  }

  removeMedoc(index: number) {
    if (this.ordonnance.length > 1) {
      this.ordonnance.removeAt(index);
    } else {
      this.ordonnance.at(0).setValue('');
    }
  }

  addQuickMedoc(suggestion: string) {
    // If first item is empty, replace it
    if (this.ordonnance.length === 1 && !this.ordonnance.at(0).value) {
      this.ordonnance.at(0).setValue(suggestion);
    } else {
      this.ordonnance.push(this.createMedocControl(suggestion));
    }
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
        await this.loadAppointments(doctor);
      }
    } catch (error) {
      console.error('Erreur chargement docteur:', error);
      this.showToast('danger', 'Impossible de charger vos données praticien.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshData() {
    const doc = this.currentUser();
    if (!doc?.id) return;
    this.isRefreshing.set(true);
    await this.loadAppointments(doc);
    this.isRefreshing.set(false);
    this.showToast('success', 'Planning et consultations actualisés.');
  }

  async loadAppointments(doctor: Doctor) {
    try {
      const docId = doctor.id || '';
      const authUid = doctor.authUid;

      // 1. Load today appointments (all statuses)
      const todayList = await this.appointmentService.getAppointmentsForToday(docId, authUid);
      this.todayAppointments.set(todayList);

      // 2. Load all appointments for doctor
      const allList = await this.appointmentService.allAppointmentForOneDoctor(docId, authUid);
      this.allAppointments.set(allList);

      // 3. Cache patient details for fast synchronous rendering
      const patientIds = Array.from(new Set([
        ...todayList.map(a => a.patientId),
        ...allList.map(a => a.patientId)
      ])).filter(Boolean);

      for (const pId of patientIds) {
        if (!this.patientsMap.has(pId)) {
          try {
            const p = await this.patientService.getPatientById(pId);
            if (p) this.patientsMap.set(pId, p);
          } catch (e) {
            console.warn('Patient fetch error:', pId, e);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement rendez-vous:', err);
    }
  }

  getPatient(patientId: string): Patient | undefined {
    return this.patientsMap.get(patientId);
  }

  getPatientFullName(patientId: string): string {
    const p = this.getPatient(patientId);
    if (!p) return 'Patient Medico';
    return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient Medico';
  }

  getPatientInitials(patientId: string): string {
    const p = this.getPatient(patientId);
    if (!p) return 'PT';
    const f = (p.firstName || '').charAt(0);
    const l = (p.lastName || '').charAt(0);
    return (f + l).toUpperCase() || 'PT';
  }

  // KPIs
  get todayCount(): number {
    return this.todayAppointments().length;
  }

  get todayPendingCount(): number {
    return this.todayAppointments().filter(a => a.status === AppointmentStatus.CONFIRMED).length;
  }

  get todayCompletedCount(): number {
    return this.todayAppointments().filter(a => a.status === AppointmentStatus.COMPLETED).length;
  }

  get totalPatientsCount(): number {
    const set = new Set(this.allAppointments().map(a => a.patientId).filter(Boolean));
    return set.size;
  }

  get filteredAppointments(): Appointment[] {
    const tab = this.activeTab();
    const query = this.searchQuery().trim().toLowerCase();

    let list: Appointment[] = [];
    if (tab === 'today-all') {
      list = this.todayAppointments();
    } else if (tab === 'today-pending') {
      list = this.todayAppointments().filter(a => a.status === AppointmentStatus.CONFIRMED);
    } else if (tab === 'today-completed') {
      list = this.todayAppointments().filter(a => a.status === AppointmentStatus.COMPLETED);
    } else {
      list = this.allAppointments();
    }

    if (!query) return list;

    return list.filter(appt => {
      const patient = this.getPatient(appt.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}`.toLowerCase() : '';
      const phone = patient?.phone ? String(patient.phone) : '';
      const service = (appt.service || '').toLowerCase();
      const sick = (appt.descriptionSick || '').toLowerCase();
      const hour = (appt.hourStart || '').toLowerCase();

      return patientName.includes(query) ||
        phone.includes(query) ||
        service.includes(query) ||
        sick.includes(query) ||
        hour.includes(query);
    });
  }

  // Consultation Modal
  openConsultationModal(appointment: Appointment) {
    this.activeAppointment.set(appointment);
    this.activePatient.set(this.getPatient(appointment.patientId) || null);

    // Initialize form with existing values if re-opening
    const existingObs = appointment.doctorObservation || '';
    const existingMeds = appointment.ordonnance || appointment.orrdonnance || [];

    this.consultationForm.reset({
      doctorObservation: existingObs
    });

    const arr = this.fb.array(
      existingMeds.length > 0
        ? existingMeds.map(m => this.createMedocControl(m))
        : [this.createMedocControl()]
    );
    this.consultationForm.setControl('ordonnance', arr);

    this.showConsultationModal.set(true);
  }

  closeConsultationModal(event?: MouseEvent) {
    if (this.isSubmittingConsultation()) return;
    if (event && event.target !== event.currentTarget) return;
    this.showConsultationModal.set(false);
    this.activeAppointment.set(null);
    this.activePatient.set(null);
  }

  // Details Modal
  openDetailsModal(appointment: Appointment) {
    this.activeAppointment.set(appointment);
    this.activePatient.set(this.getPatient(appointment.patientId) || null);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) return;
    this.showDetailsModal.set(false);
    this.activeAppointment.set(null);
    this.activePatient.set(null);
  }

  async submitConsultation() {
    if (this.consultationForm.invalid) {
      this.consultationForm.markAllAsTouched();
      return;
    }

    const appt = this.activeAppointment();
    if (!appt?.id) return;

    this.isSubmittingConsultation.set(true);

    try {
      const { doctorObservation, ordonnance } = this.consultationForm.value;
      const cleanOrdonnance: string[] = (ordonnance || [])
        .map((m: string) => (m || '').trim())
        .filter((m: string) => m.length > 0);

      const updates: Partial<Appointment> = {
        doctorObservation,
        ordonnance: cleanOrdonnance,
        orrdonnance: cleanOrdonnance, // Backward compatibility
        status: AppointmentStatus.COMPLETED
      };

      await this.appointmentService.updateAppointment(appt.id, updates);

      this.showToast('success', 'Consultation clôturée avec succès et ordonnance enregistrée.');
      this.closeConsultationModal();

      const doc = this.currentUser();
      if (doc?.id) {
        await this.loadAppointments(doc);
      }
    } catch (error) {
      console.error('Erreur mise à jour consultation:', error);
      this.showToast('danger', 'Une erreur est survenue lors de l\'enregistrement de la consultation.');
    } finally {
      this.isSubmittingConsultation.set(false);
    }
  }

  showToast(type: 'success' | 'danger', text: string) {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4000);
  }

  formatHour(hour?: string | null): string {
    if (!hour) return '--:--';
    return hour.length === 5 ? hour : hour.substring(0, 5);
  }
}
