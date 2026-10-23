import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarDoctorComponent } from '../../layouts/navbar-doctor/navbar-doctor.component';
import { FooterDoctorComponent } from '../../layouts/footer-doctor/footer-doctor.component';
import { materialImports } from '../../../../material.imports';
import { Appointment } from '../../../../shared/interfaces/appointment';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { PatientService } from '../../../../shared/services/patient.service';
import { AuthService } from '../../../../shared/services/auth.service';
import { Doctor } from '../../../../shared/interfaces/doctor';
import { Patient } from '../../../../shared/interfaces/patient';

export interface PrescriptionItem {
  appointment: Appointment;
  patient?: Patient;
  medications: string[];
}

@Component({
  selector: 'app-prescription',
  standalone: true,
  imports: [
    CommonModule,
    NavbarDoctorComponent,
    FooterDoctorComponent,
    materialImports
  ],
  templateUrl: './prescription.component.html',
  styleUrl: './prescription.component.css'
})
export class PrescriptionComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private doctorService = inject(DoctorService);
  private patientService = inject(PatientService);

  currentUser = signal<Doctor | null>(null);
  prescriptionsList = signal<PrescriptionItem[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');

  selectedPrescription = signal<PrescriptionItem | null>(null);
  showPrintModal = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    await this.initCurrentUser();
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
        await this.loadPrescriptions(doctor);
      }
    } catch (err) {
      console.error('Erreur chargement ordonnances:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPrescriptions(doctor: Doctor) {
    try {
      const docId = doctor.id || '';
      const authUid = doctor.authUid;

      const allAppointments = await this.appointmentService.allAppointmentForOneDoctor(docId, authUid);

      const items: PrescriptionItem[] = [];

      for (const appt of allAppointments) {
        const meds = appt.ordonnance || appt.orrdonnance || [];
        if (meds.length > 0) {
          let patient: Patient | undefined;
          if (appt.patientId) {
            try {
              const p = await this.patientService.getPatientById(appt.patientId);
              if (p) patient = p;
            } catch (e) {
              // Ignore patient error
            }
          }

          items.push({
            appointment: appt,
            patient,
            medications: meds
          });
        }
      }

      this.prescriptionsList.set(items);
    } catch (err) {
      console.error('Erreur chargement liste ordonnances:', err);
    }
  }

  get filteredPrescriptions(): PrescriptionItem[] {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.prescriptionsList();

    if (!q) return list;

    return list.filter(item => {
      const p = item.patient;
      const patientName = p ? `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase() : '';
      const phone = p?.phone ? String(p.phone) : '';
      const medsStr = item.medications.join(' ').toLowerCase();
      const date = String(item.appointment.day || '').toLowerCase();
      const obs = (item.appointment.doctorObservation || '').toLowerCase();

      return patientName.includes(q) ||
        phone.includes(q) ||
        medsStr.includes(q) ||
        date.includes(q) ||
        obs.includes(q);
    });
  }

  getPatientInitials(patient?: Patient): string {
    if (!patient) return 'PT';
    const f = (patient.firstName || '').charAt(0);
    const l = (patient.lastName || '').charAt(0);
    return (f + l).toUpperCase() || 'PT';
  }

  openPrintModal(item: PrescriptionItem) {
    this.selectedPrescription.set(item);
    this.showPrintModal.set(true);
  }

  closePrintModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) return;
    this.showPrintModal.set(false);
    this.selectedPrescription.set(null);
  }

  printCurrent() {
    const sheetEl = document.getElementById('official-prescription-sheet');
    if (!sheetEl) {
      window.print();
      return;
    }

    const oldFrame = document.getElementById('medico-print-frame');
    if (oldFrame) {
      oldFrame.remove();
    }

    const printFrame = document.createElement('iframe');
    printFrame.id = 'medico-print-frame';
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
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 250);
  }
}
