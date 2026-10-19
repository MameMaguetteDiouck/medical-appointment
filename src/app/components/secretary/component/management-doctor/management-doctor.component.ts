import { Component, inject, OnInit } from '@angular/core';
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
  
  services: string[] = ['Dentiste', 'Pédiatrie', 'Cardiologie', 'Gynécologie', 'Neurologie', 'Orthopédie', 'Urgences', 'Radiologie', 'Chirurgie', 'Oncologie', 'Dermatologie'];
  days: string[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  allDoctors: Doctor[] = [];
  countDoctors: number = 0;
  selectedDoctor: Doctor | null = null;
  
  private fb = inject(FormBuilder);
  private doctorService = inject(DoctorService);

  constructor() {
    this.doctorForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      service: ['', Validators.required],
      freeDays: [[]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      description: ['', [Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]]
    });

    this.updateForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      service: ['', Validators.required],
      freeDays: [[]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      description: ['', [Validators.minLength(10)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]]
    });
  }

  async ngOnInit() { 
    await this.loadDoctors();
  }

  async loadDoctors() {
    try {
      this.countDoctors = await this.doctorService.countDoctors();
      this.allDoctors = await this.doctorService.getAllDoctors();
      console.log('DOCTORS:', this.allDoctors);
      console.log('COUNT:', this.countDoctors);
    } catch (error) {
      this.errorMessage = 'Erreur lors du chargement des docteurs';
      console.error('Erreur:', error);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const doctorData: Doctor = this.doctorForm.value;
      await this.doctorService.addDoctor(doctorData);
      this.successMessage = 'Docteur ajouté avec succès !';
      this.doctorForm.reset();
      await this.loadDoctors(); // Recharger la liste
    } catch (error) {
      this.errorMessage = 'Erreur lors de l\'ajout du docteur : ' + (error as Error).message;
    } finally {
      this.isSubmitting = false;
    }
  }

  // Methodes pour les modals
  setSelectedDoctor(doctor: Doctor) {
    this.selectedDoctor = doctor;
    
    // Pre-remplir le formulaire de mise à jour
    if (doctor) {
      this.updateForm.patchValue({
        fullName: doctor.fullName,
        address: doctor.address,
        service: doctor.service,
        freeDays: doctor.freeDays || [],
        startTime: doctor.startTime,
        endTime: doctor.endTime,
        description: doctor.description || '',
        email: doctor.email,
        phone: doctor.phone
      });
    }
  }

  async deleteDoctor() {
    if (!this.selectedDoctor?.id) {
      console.error('Aucun docteur sélectionné');
      return;
    }

    try {
      await this.doctorService.deleteDoctor(this.selectedDoctor.id);
      this.successMessage = 'Docteur supprimé avec succès';
      this.selectedDoctor = null;
      await this.loadDoctors();
    } catch (error) {
      this.errorMessage = 'Erreur lors de la suppression du docteur';
      console.error('Erreur:', error);
    }
  }

  async updateDoctor() {
    if (!this.selectedDoctor?.id || this.updateForm.invalid) {
      console.error('Formulaire invalide ou aucun docteur sélectionné');
      return;
    }

    try {
      const updatedData = this.updateForm.value;
      await this.doctorService.updateDoctor(this.selectedDoctor.id, updatedData);
      this.successMessage = 'Docteur mis à jour avec succès';
      this.selectedDoctor = null;
      
      this.closeModal('updateModal');
      await this.loadDoctors(); // Recharger la liste
    } catch (error) {
      this.errorMessage = 'Erreur lors de la mise à jour du docteur';
      console.error('Erreur:', error);
    }
  }

  private closeModal(modalId: string) {
    const modal = document.getElementById(modalId);
    if (modal) {
      const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
      bootstrapModal?.hide();
    }
  }

  clearMessages() {
    this.errorMessage = null;
    this.successMessage = null;
  }

  get fullName() { return this.doctorForm.get('fullName'); }
  get address() { return this.doctorForm.get('address'); }
  get service() { return this.doctorForm.get('service'); }
  get freeDays() { return this.doctorForm.get('freeDays'); }
  get startTime() { return this.doctorForm.get('startTime'); }
  get endTime() { return this.doctorForm.get('endTime'); }
  get description() { return this.doctorForm.get('description'); }
  get email() { return this.doctorForm.get('email'); }
  get phone() { return this.doctorForm.get('phone'); }

  get updateFullName() { return this.updateForm.get('fullName'); }
  get updateAddress() { return this.updateForm.get('address'); }
  get updateService() { return this.updateForm.get('service'); }
  get updateFreeDays() { return this.updateForm.get('freeDays'); }
  get updateStartTime() { return this.updateForm.get('startTime'); }
  get updateEndTime() { return this.updateForm.get('endTime'); }
  get updateDescription() { return this.updateForm.get('description'); }
  get updateEmail() { return this.updateForm.get('email'); }
  get updatePhone() { return this.updateForm.get('phone'); }


  onDayChange(event: any, formType: 'add' | 'update') {
  const day = event.target.value;
  const isChecked = event.target.checked;
  
  const form = formType === 'add' ? this.doctorForm : this.updateForm;
  const currentDays = form.get('freeDays')?.value || [];
  
  if (isChecked) {
    if (!currentDays.includes(day)) {
      currentDays.push(day);
    }
  } else {
    const index = currentDays.indexOf(day);
    if (index > -1) {
      currentDays.splice(index, 1);
    }
  }
  
  form.patchValue({ freeDays: currentDays });
}
}