import { Component, inject } from '@angular/core';
import { materialImports } from '../../material.imports';
import { RouterLink } from '@angular/router';
import { DoctorService } from '../../shared/services/doctor.service';
import { Doctor } from '../../shared/interfaces/doctor';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-page',
  imports: [materialImports,RouterLink, CommonModule],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.css'
})
export class WelcomePageComponent {
  private doctorService = inject(DoctorService);
  allDoctors: Doctor[] = []
  async ngOnInit() {
    this.allDoctors = await this.doctorService.getAllDoctors()
  }

}
