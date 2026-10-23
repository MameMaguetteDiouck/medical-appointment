import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { Doctor } from '../../../../shared/interfaces/doctor';
import { NavbarSecretaryComponent } from "../../layout/navbar-secretary/navbar-secretary.component";
import { FooterSecretaryComponent } from "../../layout/footer-secretary/footer-secretary.component";
import { materialImports } from '../../../../material.imports';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-doctor',
  templateUrl: './management-doctor.component.html',
  styleUrls: ['./management-doctor.component.css'],
  imports: [NavbarSecretaryComponent, FooterSecretaryComponent, materialImports, CommonModule, ReactiveFormsModule]
})
export class ManagementDoctorComponent implements OnInit {
  doctorForm: FormGroup;
  updateForm: FormGroup;

  services: string[] = [
    'Médecine Générale',
    'Pédiatrie',
    'Cardiologie',
    'Gynécologie',
    'Dermatologie',
    'Ophtalmologie',
    'Dentiste',
    'Maladies Chroniques',
    'Neurologie',
    'Orthopédie',
    'Urgences',
    'Radiologie',
    'Chirurgie',
    'Oncologie'
  ];
  days: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  activeTab = signal<'list' | 'add'>('list');
  displayMode = signal<'grid' | 'table'>('grid');
  searchTerm = signal<string>('');
  selectedSpecialty = signal<string>('all');
  selectedStatus = signal<string>('all');
  showEditModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);
  selectedDoctor = signal<Doctor | null>(null);

  // Day-specific schedule state
  addWeeklySchedule: Record<string, { startTime: string; endTime: string }> = {};
  editWeeklySchedule: Record<string, { startTime: string; endTime: string }> = {};

  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  allDoctors: Doctor[] = [];
  countDoctors: number = 0;

  private fb = inject(FormBuilder);
  private doctorService = inject(DoctorService);

  constructor() {
    this.doctorForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      service: ['', Validators.required],
      status: ['active', Validators.required],
      freeDays: [[]],
      startTime: ['08:30', Validators.required],
      endTime: ['16:30', Validators.required],
      description: ['', [Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s]{8,20}$/)]]
    });

    this.updateForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      service: ['', Validators.required],
      status: ['active', Validators.required],
      freeDays: [[]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      description: ['', [Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s]{8,20}$/)]]
    });
  }

  async ngOnInit() {
    await this.loadDoctors();
  }

  get todayDayName(): string {
    const dayIndex = new Date().getDay();
    const dayMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return dayMap[dayIndex];
  }

  setActiveTab(tab: 'list' | 'add') {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  setDisplayMode(mode: 'grid' | 'table') {
    this.displayMode.set(mode);
  }

  onSearchChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchTerm.set(val);
  }

  onSpecialtyChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedSpecialty.set(val);
  }

  onStatusFilterChange(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(val);
  }

  get activeDoctorsCount(): number {
    return this.allDoctors.filter(d => (d.status || 'active') === 'active').length;
  }

  get onLeaveDoctorsCount(): number {
    return this.allDoctors.filter(d => d.status === 'on_leave').length;
  }

  get workingTodayCount(): number {
    return this.allDoctors.filter(d => this.isWorkingToday(d)).length;
  }

  get filteredDoctors(): Doctor[] {
    const term = this.searchTerm().trim().toLowerCase();
    const spec = this.selectedSpecialty();
    const status = this.selectedStatus();

    return this.allDoctors.filter(d => {
      const docStatus = d.status || 'active';
      const matchStatus = status === 'all' || docStatus === status;
      const matchSpecialty = spec === 'all' || d.service === spec;
      const matchSearch = !term ||
        (d.fullName && d.fullName.toLowerCase().includes(term)) ||
        (d.service && d.service.toLowerCase().includes(term)) ||
        (d.email && d.email.toLowerCase().includes(term)) ||
        (d.address && d.address.toLowerCase().includes(term));
      return matchStatus && matchSpecialty && matchSearch;
    });
  }

  async loadDoctors() {
    try {
      this.allDoctors = await this.doctorService.getAllDoctors();
      this.countDoctors = this.allDoctors.length;
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement des praticiens.';
      console.error('Erreur:', error);
    }
  }

  isWorkingToday(doctor: Doctor): boolean {
    const docStatus = doctor.status || 'active';
    if (docStatus !== 'active') return false;
    return !!doctor.freeDays && doctor.freeDays.includes(this.todayDayName);
  }

  getTodayHours(doctor: Doctor): string | null {
    if (!this.isWorkingToday(doctor)) return null;
    const schedule = doctor.weeklySchedule?.[this.todayDayName];
    if (schedule && schedule.startTime && schedule.endTime) {
      return `${schedule.startTime} - ${schedule.endTime}`;
    }
    return `${doctor.startTime} - ${doctor.endTime}`;
  }

  formatDayHours(doctor: Doctor, day: string): string {
    const schedule = doctor.weeklySchedule?.[day];
    if (schedule && schedule.startTime && schedule.endTime) {
      return `${schedule.startTime} - ${schedule.endTime}`;
    }
    return `${doctor.startTime} - ${doctor.endTime}`;
  }

  async quickToggleStatus(doctor: Doctor, newStatus: 'active' | 'on_leave' | 'inactive') {
    if (!doctor.id) return;
    try {
      await this.doctorService.updateDoctor(doctor.id, { status: newStatus });
      doctor.status = newStatus;
      const label = newStatus === 'active' ? 'en exercice' : newStatus === 'on_leave' ? 'en congé' : 'inactif';
      this.successMessage = `Statut du Dr. ${doctor.fullName} mis à jour : ${label}.`;
    } catch (error) {
      this.errorMessage = 'Impossible de mettre à jour le statut du médecin.';
    }
  }

  // Day & Schedule selection methods
  isDaySelected(day: string, formType: 'add' | 'update'): boolean {
    const form = formType === 'add' ? this.doctorForm : this.updateForm;
    const currentDays = form.get('freeDays')?.value || [];
    return currentDays.includes(day);
  }

  onDayChange(event: any, formType: 'add' | 'update') {
    const day = event.target.value;
    const isChecked = event.target.checked;
    const form = formType === 'add' ? this.doctorForm : this.updateForm;
    const schedule = formType === 'add' ? this.addWeeklySchedule : this.editWeeklySchedule;
    const currentDays = [...(form.get('freeDays')?.value || [])];

    if (isChecked) {
      if (!currentDays.includes(day)) {
        currentDays.push(day);
      }
      // Initialize day schedule with current form defaults if not set
      if (!schedule[day]) {
        schedule[day] = {
          startTime: form.get('startTime')?.value || '08:30',
          endTime: form.get('endTime')?.value || '16:30'
        };
      }
    } else {
      const index = currentDays.indexOf(day);
      if (index > -1) {
        currentDays.splice(index, 1);
      }
      delete schedule[day];
    }

    form.patchValue({ freeDays: currentDays });
  }

  applyHoursToAllDays(formType: 'add' | 'update') {
    const form = formType === 'add' ? this.doctorForm : this.updateForm;
    const schedule = formType === 'add' ? this.addWeeklySchedule : this.editWeeklySchedule;
    const currentDays: string[] = form.get('freeDays')?.value || [];
    const start = form.get('startTime')?.value || '08:30';
    const end = form.get('endTime')?.value || '16:30';

    currentDays.forEach(day => {
      schedule[day] = { startTime: start, endTime: end };
    });
  }

  updateDayScheduleTime(day: string, field: 'startTime' | 'endTime', value: string, formType: 'add' | 'update') {
    const schedule = formType === 'add' ? this.addWeeklySchedule : this.editWeeklySchedule;
    if (!schedule[day]) {
      const form = formType === 'add' ? this.doctorForm : this.updateForm;
      schedule[day] = {
        startTime: form.get('startTime')?.value || '08:30',
        endTime: form.get('endTime')?.value || '16:30'
      };
    }
    schedule[day][field] = value;
  }

  getDayTime(day: string, field: 'startTime' | 'endTime', formType: 'add' | 'update'): string {
    const schedule = formType === 'add' ? this.addWeeklySchedule : this.editWeeklySchedule;
    const form = formType === 'add' ? this.doctorForm : this.updateForm;
    if (schedule[day] && schedule[day][field]) {
      return schedule[day][field];
    }
    return form.get(field)?.value || (field === 'startTime' ? '08:30' : '16:30');
  }

  async onSubmit(): Promise<void> {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.clearMessages();

    try {
      const doctorData: Doctor = {
        ...this.doctorForm.value,
        weeklySchedule: { ...this.addWeeklySchedule }
      };

      const res = await this.doctorService.addDoctor(doctorData);
      this.successMessage = `Dr. ${doctorData.fullName} a été enregistré avec succès. Identifiants générés : ${doctorData.email} (Mot de passe temporaire : ${res.defaultPassword}). Le praticien sera invité à le modifier à sa première connexion.`;
      this.doctorForm.reset({
        status: 'active',
        freeDays: [],
        startTime: '08:30',
        endTime: '16:30'
      });
      this.addWeeklySchedule = {};
      await this.loadDoctors();
      this.activeTab.set('list');
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'enregistrement : ' + (error as Error).message;
    } finally {
      this.isSubmitting = false;
    }
  }

  openEditModal(doctor: Doctor) {
    this.selectedDoctor.set(doctor);
    this.clearMessages();

    // Prepare weekly schedule
    this.editWeeklySchedule = {};
    const days = doctor.freeDays || [];
    days.forEach(day => {
      if (doctor.weeklySchedule?.[day]) {
        this.editWeeklySchedule[day] = { ...doctor.weeklySchedule[day] };
      } else {
        this.editWeeklySchedule[day] = {
          startTime: doctor.startTime || '08:30',
          endTime: doctor.endTime || '16:30'
        };
      }
    });

    this.updateForm.patchValue({
      fullName: doctor.fullName,
      address: doctor.address,
      service: doctor.service,
      status: doctor.status || 'active',
      freeDays: doctor.freeDays || [],
      startTime: doctor.startTime,
      endTime: doctor.endTime,
      description: doctor.description || '',
      email: doctor.email,
      phone: doctor.phone
    });
    this.showEditModal.set(true);
  }

  closeEditModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) return;
    this.showEditModal.set(false);
    this.selectedDoctor.set(null);
  }

  openDeleteModal(doctor: Doctor) {
    this.selectedDoctor.set(doctor);
    this.clearMessages();
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(event?: MouseEvent) {
    if (event && event.target !== event.currentTarget) return;
    this.showDeleteModal.set(false);
    this.selectedDoctor.set(null);
  }

  async updateDoctor() {
    const doc = this.selectedDoctor();
    if (!doc?.id || this.updateForm.invalid) {
      this.errorMessage = 'Veuillez vérifier les champs du formulaire.';
      return;
    }

    try {
      const updatedData: Partial<Doctor> = {
        ...this.updateForm.value,
        weeklySchedule: { ...this.editWeeklySchedule }
      };

      await this.doctorService.updateDoctor(doc.id, updatedData);
      this.successMessage = `Dr. ${updatedData.fullName} mis à jour avec succès.`;
      this.showEditModal.set(false);
      this.selectedDoctor.set(null);
      await this.loadDoctors();
    } catch (error) {
      this.errorMessage = 'Erreur lors de la mise à jour du praticien.';
      console.error('Erreur:', error);
    }
  }

  async deactivateDoctor() {
    const doc = this.selectedDoctor();
    if (!doc?.id) return;

    try {
      await this.doctorService.updateDoctor(doc.id, { status: 'inactive' });
      this.successMessage = `Dr. ${doc.fullName} a été désactivé (fiche archivée).`;
      this.showDeleteModal.set(false);
      this.selectedDoctor.set(null);
      await this.loadDoctors();
    } catch (error) {
      this.errorMessage = 'Erreur lors de la désactivation du praticien.';
      console.error('Erreur:', error);
    }
  }

  // Alias for backward compatibility
  async deleteDoctor() {
    return this.deactivateDoctor();
  }

  getDoctorInitials(fullName: string): string {
    if (!fullName) return 'DR';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase() || 'DR';
  }

  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }

  get fullName() { return this.doctorForm.get('fullName'); }
  get address() { return this.doctorForm.get('address'); }
  get service() { return this.doctorForm.get('service'); }
  get status() { return this.doctorForm.get('status'); }
  get freeDays() { return this.doctorForm.get('freeDays'); }
  get startTime() { return this.doctorForm.get('startTime'); }
  get endTime() { return this.doctorForm.get('endTime'); }
  get description() { return this.doctorForm.get('description'); }
  get email() { return this.doctorForm.get('email'); }
  get phone() { return this.doctorForm.get('phone'); }

  get updateFullName() { return this.updateForm.get('fullName'); }
  get updateAddress() { return this.updateForm.get('address'); }
  get updateService() { return this.updateForm.get('service'); }
  get updateStatus() { return this.updateForm.get('status'); }
  get updateFreeDays() { return this.updateForm.get('freeDays'); }
  get updateStartTime() { return this.updateForm.get('startTime'); }
  get updateEndTime() { return this.updateForm.get('endTime'); }
  get updateDescription() { return this.updateForm.get('description'); }
  get updateEmail() { return this.updateForm.get('email'); }
  get updatePhone() { return this.updateForm.get('phone'); }
}