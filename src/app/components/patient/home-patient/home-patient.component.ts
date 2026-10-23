import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarPatientComponent } from '../layouts/navbar-patient/navbar-patient.component';
import { FooterPatientComponent } from '../layouts/footer-patient/footer-patient.component';
import { materialImports } from '../../../material.imports';
import { AuthService } from '../../../shared/services/auth.service';
import { PatientService } from '../../../shared/services/patient.service';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../shared/interfaces/appointment';
import { Patient } from '../../../shared/interfaces/patient';

type FilterTab = 'all' | 'upcoming' | 'pending' | 'completed';

@Component({
  selector: 'app-home-patient',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarPatientComponent,
    FooterPatientComponent,
    materialImports
  ],
  templateUrl: './home-patient.component.html',
  styleUrl: './home-patient.component.css'
})
export class HomePatientComponent implements OnInit {
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);

  readonly AppointmentStatus = AppointmentStatus;

  currentUser = signal<Patient | null>(null);
  appointmentsList = signal<Appointment[]>([]);
  isLoading = signal<boolean>(true);
  filterTab = signal<FilterTab>('all');

  // Modal for viewing & printing medical prescription
  selectedPrescriptionAppointment = signal<Appointment | null>(null);
  showPrescriptionModal = signal<boolean>(false);

  // Computed metrics
  pendingAppointments = computed(() =>
    this.appointmentsList().filter(a => a.status === AppointmentStatus.PENDING)
  );

  upcomingAppointments = computed(() =>
    this.appointmentsList().filter(a => a.status === AppointmentStatus.CONFIRMED)
  );

  completedAppointments = computed(() =>
    this.appointmentsList().filter(a => a.status === AppointmentStatus.COMPLETED)
  );

  nextAppointment = computed(() => {
    const upcoming = this.upcomingAppointments();
    return upcoming.length > 0 ? upcoming[0] : null;
  });

  filteredAppointments = computed(() => {
    const tab = this.filterTab();
    const list = this.appointmentsList();

    switch (tab) {
      case 'upcoming':
        return list.filter(a => a.status === AppointmentStatus.CONFIRMED);
      case 'pending':
        return list.filter(a => a.status === AppointmentStatus.PENDING);
      case 'completed':
        return list.filter(a => a.status === AppointmentStatus.COMPLETED);
      case 'all':
      default:
        return list;
    }
  });

  async ngOnInit(): Promise<void> {
    await this.loadPatientDashboard();
  }

  async loadPatientDashboard(): Promise<void> {
    this.isLoading.set(true);
    try {
      const email = this.authService.currentUser?.email;
      const authUid = this.authService.currentUser?.uid;

      if (!email && !authUid) {
        this.isLoading.set(false);
        return;
      }

      let patient: Patient | null = null;
      if (email) {
        patient = await this.patientService.getPatientByEmail(email);
      }
      if (!patient && authUid) {
        patient = await this.patientService.getPatientById(authUid);
      }

      if (patient) {
        this.currentUser.set(patient);
        const appts = await this.appointmentService.allAppointmentForOnePatient(patient.id, authUid);
        this.appointmentsList.set(appts || []);
      } else if (authUid) {
        const appts = await this.appointmentService.allAppointmentForOnePatient(authUid, authUid);
        this.appointmentsList.set(appts || []);
      }
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  setFilterTab(tab: FilterTab): void {
    this.filterTab.set(tab);
  }

  hasPrescription(appt: Appointment): boolean {
    const meds = this.getAppointmentMedications(appt);
    return meds.length > 0;
  }

  getAppointmentMedications(appt: Appointment): string[] {
    const raw = appt.ordonnance || appt.orrdonnance;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(m => !!m && m.trim().length > 0);
    if (typeof raw === 'string') {
      return (raw as string).split('\n').map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
  }

  openPrescriptionModal(appt: Appointment): void {
    this.selectedPrescriptionAppointment.set(appt);
    this.showPrescriptionModal.set(true);
  }

  closePrescriptionModal(event?: MouseEvent): void {
    if (event && event.target !== event.currentTarget) return;
    this.showPrescriptionModal.set(false);
    this.selectedPrescriptionAppointment.set(null);
  }

  printPrescription(): void {
    const sheetEl = document.getElementById('patient-prescription-sheet');
    if (!sheetEl) {
      window.print();
      return;
    }

    const oldFrame = document.getElementById('medico-patient-print-frame');
    if (oldFrame) {
      oldFrame.remove();
    }

    const printFrame = document.createElement('iframe');
    printFrame.id = 'medico-patient-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <title>Ordonnance Médicale - Medico</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 20mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              font-size: 13px;
              line-height: 1.5;
            }
            .print-sheet-wrapper {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
              break-inside: avoid !important;
              break-after: avoid !important;
            }
            .text-teal { color: #0d9488 !important; }
            .bg-light { background-color: #f8fafc !important; }
            .border { border: 1px solid #e2e8f0 !important; }
            .rounded-2 { border-radius: 8px !important; }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              background-color: #f1f5f9;
              color: #334155;
              border: 1px solid #cbd5e1;
            }
          </style>
        </head>
        <body>
          <div class="print-sheet-wrapper">
            ${sheetEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (e) {
        console.error('Print error:', e);
      } finally {
        setTimeout(() => printFrame.remove(), 1000);
      }
    }, 250);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'badge-status-confirmed';
      case AppointmentStatus.PENDING:
        return 'badge-status-pending';
      case AppointmentStatus.COMPLETED:
        return 'badge-status-completed';
      case AppointmentStatus.CANCELLED:
        return 'badge-status-cancelled';
      default:
        return 'badge-status-default';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'bi-check-circle-fill';
      case AppointmentStatus.PENDING:
        return 'bi-clock-history';
      case AppointmentStatus.COMPLETED:
        return 'bi-check2-all';
      case AppointmentStatus.CANCELLED:
        return 'bi-x-circle-fill';
      default:
        return 'bi-info-circle';
    }
  }

  getServiceIcon(service: string): string {
    const s = (service || '').toLowerCase();
    if (s.includes('cardio')) return 'bi-heart-pulse';
    if (s.includes('dent')) return 'bi-emoji-smile';
    if (s.includes('pedia')) return 'bi-person-hearts';
    if (s.includes('neuro')) return 'bi-diagram-3';
    if (s.includes('radio')) return 'bi-camera';
    if (s.includes('gyneco')) return 'bi-gender-female';
    if (s.includes('derma')) return 'bi-shield-check';
    if (s.includes('urgen')) return 'bi-lightning-charge';
    if (s.includes('ortho')) return 'bi-activity';
    if (s.includes('ophta')) return 'bi-eye';
    return 'bi-hospital';
  }
}
