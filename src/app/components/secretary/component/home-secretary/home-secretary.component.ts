import { Component, inject, signal } from '@angular/core';
import { NavbarSecretaryComponent } from '../../layout/navbar-secretary/navbar-secretary.component';
import { FooterSecretaryComponent } from '../../layout/footer-secretary/footer-secretary.component';
import { materialImports } from '../../../../material.imports';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../../shared/interfaces/appointment';
import { ChartService } from '../../../../shared/services/chart.service';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { NgChartsModule } from 'ng2-charts';
import { ChartData, ChartType } from 'chart.js';
import { Doctor } from '../../../../shared/interfaces/doctor';
import { Patient } from '../../../../shared/interfaces/patient';
import { PatientService } from '../../../../shared/services/patient.service';



import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-secretary',
  imports: [NavbarSecretaryComponent, FooterSecretaryComponent, materialImports, CommonModule, NgChartsModule, RouterLink],
  templateUrl: './home-secretary.component.html',
  styleUrl: './home-secretary.component.css'
})
export class HomeSecretaryComponent {
  appointService = inject(AppointmentService)
  patientService = inject(PatientService);
  chartService = inject(ChartService);
  doctorService = inject(DoctorService)
  panelOpenState = signal(false);
  allAppointment: Appointment[] = [];
  allDoctors: Doctor[] = [];
  allPatients: Patient[] = [];
  allAppointmentStandby: Appointment[] = [];
  allAppointmentConfirmed: Appointment[] = [];
  allAppointmentCompleted: Appointment[] = [];
  allAppointmentCancelled: Appointment[] = [];
  standByStatus: string = 'Attente de confirmation';
  confirmedStatus: string = 'Confirmé';
  cancelledStatus: string = 'Annulé';
  completedStatus: string = 'Passé';
  pieChartData: any;
  barChartData: any;
  todayFormatted: string = this.getFormattedDate();

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12
          },
          color: '#566573'
        },
        grid: {
          color: '#eef2f6'
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          },
          color: '#566573'
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  pieChartType: ChartType = 'pie';
  pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 13,
            weight: 'normal' as const
          },
          color: '#566573',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };
  barChartDataDay: any;

  em?: string | null;
  currentUser: any = null;

  private getFormattedDate(): string {
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const str = new Intl.DateTimeFormat('fr-FR', options).format(d);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async ngOnInit() {
    this.allAppointment = await this.appointService.getAllAppointments();
    this.allPatients = await this.patientService.getAllPatients();
    this.allDoctors = await this.doctorService.getAllDoctors();
    console.log('Tous les RV:', this.allAppointment);
    this.getSatusStandBy();
    this.getSatusConfirmed();
    this.getStatusCancelled();
    this.getStatusCompleted();
    const statStatus = {
      'En attente': this.allAppointmentStandby.length,
      'Confirmé': this.allAppointmentConfirmed.length,
      'Complété': this.allAppointmentCompleted.length,
      'Annulé': this.allAppointmentCancelled.length,
    };
    const statHisto = {
      'En attente': this.allAppointmentStandby.length,
      'Confirmé': this.allAppointmentConfirmed.length,
      'Complété': this.allAppointmentCompleted.length,
      'Annulé': this.allAppointmentCancelled.length,
    };
    this.pieChartData = this.chartService.getPieChartForStatus(statStatus);
    this.barChartData = this.chartService.getBarChartForStatus(statHisto);

    const stats: { [key: string]: number } = { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0, samedi: 0, dimanche: 0, };
    this.allAppointment.forEach(appointment => {
      const date = new Date(appointment.day);
      const dayNumber = date.getDay();

      const daysMap = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const dayName = daysMap[dayNumber];

      if (stats.hasOwnProperty(dayName)) {
        stats[dayName]++;
      }
    });
    this.barChartDataDay = this.chartService.getBarChartForDays(stats);


  }

  getSatusConfirmed() {
    this.allAppointmentConfirmed = this.allAppointment.filter(
      (appointment: any) => appointment.status === this.confirmedStatus
    );
  }
  getStatusCancelled() {
    this.allAppointmentCancelled = this.allAppointment.filter(
      (appointment: any) => appointment.status === this.cancelledStatus
    );
  }
  getStatusCompleted() {
    this.allAppointmentCompleted = this.allAppointment.filter(
      (appointment: any) => appointment.status === this.completedStatus
    );
  }
  getSatusStandBy() {
    this.allAppointmentStandby = this.allAppointment.filter(
      (appointment: any) => appointment.status === this.standByStatus
    );
  }
}
