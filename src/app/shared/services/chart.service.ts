import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  getPieChartForStatus(stats: { [label: string]: number }) {
    return {
      labels: Object.keys(stats),
      datasets: [{
        data: Object.values(stats),
        backgroundColor: ['#566573', '#7A8B9B', '#AAB7C4', '#3E4B58']
      }]
    };
  }

  getDoughnutForPerDoctor(data: { [doctorName: string]: number }) {
    return {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: ['#566573', '#7A8B9B', '#AAB7C4', '#3E4B58']
      }]
    };
  }


  getBarChartForStatus(stats: { [label: string]: number }): ChartData<'bar', number[], string> {
    return {
      labels: Object.keys(stats),
      datasets: [
        {
          label: 'Nombre de rendez-vous',
          data: Object.values(stats),
          backgroundColor: ['#566573', '#7A8B9B', '#AAB7C4', '#3E4B58']
        }
      ]
    };
  }
  getBarChartForDays(stats: { [day: string]: number }): ChartData<'bar', number[], string> {
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const colors = ['#566573', '#7A8B9B', '#AAB7C4', '#3E4B58', '#415266', '#6B7B8C', '#4F5E6C'];
    // const colors = ['#566573', '#4A5A66', '#6A7A89', '#3C4A56', '#7C8A98', '#626F7C', '#49525C'];



    const data = daysOfWeek.map(day => stats[day.toLowerCase()] ?? 0);

    return {
      labels: daysOfWeek,
      datasets: [
        {
          label: 'Nombre de rendez-vous',
          data: data,
          backgroundColor: colors
        }
      ]
    };
  }


}
