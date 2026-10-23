import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarPatientComponent } from '../layouts/navbar-patient/navbar-patient.component';
import { FooterPatientComponent } from '../layouts/footer-patient/footer-patient.component';
import { materialImports } from '../../../material.imports';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { PatientService } from '../../../shared/services/patient.service';
import { DoctorService } from '../../../shared/services/doctor.service';
import { AuthService } from '../../../shared/services/auth.service';
import { AppointmentStatus } from '../../../shared/interfaces/appointment';
import { Doctor } from '../../../shared/interfaces/doctor';
import { Patient } from '../../../shared/interfaces/patient';

interface SpecialtyOption {
  value: string;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarPatientComponent,
    FooterPatientComponent,
    materialImports
  ],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.css'
})
export class AppointmentComponent implements OnInit {
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);

  currentUser = signal<Patient | null>(null);
  allDoctors = signal<Doctor[]>([]);
  isSubmissionInProgress = signal<boolean>(false);
  errorMessage = signal<string>('');
  minDate: string = '';

  readonly specialties: SpecialtyOption[] = [
    { value: 'Médecine Générale', label: 'Médecine Générale', icon: 'bi-hospital', description: 'Consultation courante et suivi de santé' },
    { value: 'Cardiologie', label: 'Cardiologie', icon: 'bi-heart-pulse', description: 'Cœur, tension et système cardio-vasculaire' },
    { value: 'Pédiatrie', label: 'Pédiatrie', icon: 'bi-person-hearts', description: 'Soins et consultations pour enfants et nourrissons' },
    { value: 'Dentiste', label: 'Chirurgie Dentaire', icon: 'bi-emoji-smile', description: 'Soins dentaires, détartrage et urgences buccales' },
    { value: 'Gynécologie', label: 'Gynécologie & Obstétrique', icon: 'bi-gender-female', description: 'Suivi féminin, maternité et dépistage' },
    { value: 'Dermatologie', label: 'Dermatologie', icon: 'bi-shield-check', description: 'Affections de la peau, des ongles et des cheveux' },
    { value: 'Ophtalmologie', label: 'Ophtalmologie', icon: 'bi-eye', description: 'Vision, prescription optique et examens oculaires' },
    { value: 'Orthopédie', label: 'Orthopédie', icon: 'bi-activity', description: 'Os, articulations et traumatologie du sport' },
    { value: 'Neurologie', label: 'Neurologie', icon: 'bi-diagram-3', description: 'Système nerveux, migraines et troubles neurologiques' },
    { value: 'Radiologie', label: 'Imagerie Médicale & Radio', icon: 'bi-camera', description: 'Échographie, radiographie et imagerie clinique' },
    { value: 'Chirurgie', label: 'Chirurgie', icon: 'bi-bandaid', description: 'Consultation pré-opératoire et chirurgicale' },
    { value: 'Urgences', label: 'Soins Immédiats & Urgences', icon: 'bi-lightning-charge', description: 'Prise en charge prioritaire pour soins aigus' },
  ];

  appointmentForm = new FormGroup({
    service: new FormControl<string>('', [Validators.required]),
    doctorId: new FormControl<string>(''),
    day: new FormControl<string>('', [Validators.required]),
    descriptionSick: new FormControl<string>('', [Validators.required, Validators.minLength(5)]),
  });

  async ngOnInit(): Promise<void> {
    this.setupMinDate();
    await this.loadInitialData();
  }

  private setupMinDate(): void {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.minDate = `${yyyy}-${mm}-${dd}`;
    this.appointmentForm.patchValue({ day: this.minDate });
  }

  private async loadInitialData(): Promise<void> {
    try {
      const email = this.authService.currentUser?.email;
      const authUid = this.authService.currentUser?.uid;

      if (email) {
        const patient = await this.patientService.getPatientByEmail(email);
        if (patient) {
          this.currentUser.set(patient);
        }
      }
      if (!this.currentUser() && authUid) {
        const patient = await this.patientService.getPatientById(authUid);
        if (patient) {
          this.currentUser.set(patient);
        }
      }

      // Load doctors for preference selection
      const doctors = await this.doctorService.getAllDoctors();
      const activeDoctors = doctors.filter(d => d.status !== 'inactive');
      this.allDoctors.set(activeDoctors);
    } catch (err) {
      console.error('Error loading appointment booking data:', err);
    }
  }

  get availableDoctorsForService(): Doctor[] {
    const selectedService = this.appointmentForm.get('service')?.value;
    const doctors = this.allDoctors();

    if (!selectedService) return doctors;

    const filtered = doctors.filter(doc => {
      const docService = (doc.service || '').toLowerCase().trim();
      const target = selectedService.toLowerCase().trim();
      return docService === target || docService.includes(target) || target.includes(docService);
    });

    return filtered.length > 0 ? filtered : doctors;
  }

  get selectedDoctorName(): string {
    const docId = this.appointmentForm.get('doctorId')?.value;
    if (!docId) return 'Attribué selon disponibilité';
    const doc = this.allDoctors().find(d => d.id === docId);
    return doc ? (doc.fullName || doc.doctorName || 'Dr. Praticien') : 'Attribué selon disponibilité';
  }

  selectSpecialty(val: string): void {
    this.appointmentForm.patchValue({ service: val });
  }

  async onSubmit(): Promise<void> {
    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.isSubmissionInProgress.set(true);
    this.errorMessage.set('');

    try {
      const formVal = this.appointmentForm.value;
      const patientId = this.currentUser()?.id || this.authService.currentUser?.uid || '';

      if (!patientId) {
        throw new Error('Identifiant patient introuvable. Veuillez vous reconnecter.');
      }

      const selectedDoc = formVal.doctorId
        ? this.allDoctors().find(d => d.id === formVal.doctorId)
        : null;

      const appointmentPayload: any = {
        service: formVal.service,
        descriptionSick: formVal.descriptionSick,
        day: formVal.day,
        hourStart: null,
        patientId,
        doctorId: selectedDoc ? selectedDoc.id : '',
        doctorName: selectedDoc ? (selectedDoc.fullName || selectedDoc.doctorName || '') : '',
        status: AppointmentStatus.PENDING,
        doctorObservation: ''
      };

      await this.appointmentService.addAppointment(appointmentPayload);
      this.router.navigate(['/patients']);
    } catch (err: any) {
      console.error('Erreur lors de la réservation de rendez-vous:', err);
      this.errorMessage.set(err?.message || 'Une erreur est survenue lors de la réservation.');
    } finally {
      this.isSubmissionInProgress.set(false);
    }
  }
}
