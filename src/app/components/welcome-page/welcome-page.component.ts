import { Component, inject, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { materialImports } from '../../material.imports';
import { RouterLink } from '@angular/router';
import { DoctorService } from '../../shared/services/doctor.service';
import { AuthService } from '../../shared/services/auth.service';
import { Doctor } from '../../shared/interfaces/doctor';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-welcome-page',
  imports: [materialImports, RouterLink, CommonModule],
  templateUrl: './welcome-page.component.html',
  styleUrl: './welcome-page.component.css'
})
export class WelcomePageComponent implements OnInit, OnDestroy {
  private doctorService = inject(DoctorService);
  private authService = inject(AuthService);

  allDoctors: Doctor[] = [];
  availableServices: string[] = ['Tous'];
  selectedService = signal<string>('Tous');
  activeSection = signal<string>('home');
  currentUser = signal<User | null>(null);
  currentUserRole = signal<string | null>(null);

  private observer?: IntersectionObserver;
  private authSub?: Subscription;

  async ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe(async (user) => {
      this.currentUser.set(user);
      if (user) {
        try {
          const role = await this.authService.getUserRole(user);
          this.currentUserRole.set(role);
        } catch (e) {
          console.warn('Role lookup on welcome page:', e);
        }
      } else {
        this.currentUserRole.set(null);
      }
    });

    this.allDoctors = await this.doctorService.getAllDoctors();
    const uniqueServices = Array.from(new Set(this.allDoctors.map(d => d.service).filter(Boolean)));
    this.availableServices = ['Tous', ...uniqueServices];
    this.setupScrollSpy();
  }

  getUserDashboardRoute(): string {
    const role = this.currentUserRole();
    if (role === 'doctors') return '/doctors';
    if (role === 'secretaries') return '/secretaries';
    if (role === 'patients') return '/patients';
    return '/auth/sign-in';
  }

  getUserRoleLabel(): string {
    const role = this.currentUserRole();
    if (role === 'doctors') return 'Dr. ' + (this.currentUser()?.displayName || 'Praticien');
    if (role === 'secretaries') return 'Secrétariat';
    if (role === 'patients') return 'Patient';
    return 'Mon Espace';
  }

  async logout() {
    this.closeMobileMenu();
    await this.authService.logout();
    this.currentUser.set(null);
    this.currentUserRole.set(null);
  }

  get filteredDoctors(): Doctor[] {
    const sel = this.selectedService();
    if (sel === 'Tous') return this.allDoctors;
    return this.allDoctors.filter(d => d.service === sel);
  }

  selectService(service: string) {
    this.selectedService.set(service);
    const container = document.getElementById('doctorsScrollContainer');
    if (container) {
      container.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }

  selectServiceAndScroll(service: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.selectService(service);
    this.scrollTo('doctors');
  }

  getServiceIcon(service: string): string {
    const s = (service || '').toLowerCase();
    if (s.includes('cardio')) return 'bi-heart-pulse-fill';
    if (s.includes('pédiatr') || s.includes('pediatr')) return 'bi-emoji-smile-fill';
    if (s.includes('gynéco') || s.includes('gyneco')) return 'bi-gender-female';
    if (s.includes('ophtalm')) return 'bi-eye-fill';
    if (s.includes('dermat')) return 'bi-bandaid-fill';
    if (s.includes('dent')) return 'bi-shield-plus';
    if (s.includes('chroniq')) return 'bi-activity';
    if (s.includes('général') || s.includes('general')) return 'bi-clipboard2-pulse-fill';
    return 'bi-hospital-fill';
  }

  getDoctorInitials(fullName: string): string {
    if (!fullName) return 'DR';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.authSub?.unsubscribe();
  }

  scrollTo(sectionId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.closeMobileMenu();
    this.activeSection.set(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 70;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: 'smooth'
      });
    }
  }

  closeMobileMenu() {
    const collapseEl = document.getElementById('navbarSupportedContent');
    if (collapseEl && collapseEl.classList.contains('show')) {
      collapseEl.classList.remove('show');
    }
  }

  scrollDoctors(direction: 'left' | 'right') {
    const container = document.getElementById('doctorsScrollContainer');
    if (container) {
      const scrollAmount = 380;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  isDragging = false;
  private startX = 0;
  private scrollLeftStart = 0;

  onMouseDown(event: MouseEvent) {
    const container = document.getElementById('doctorsScrollContainer');
    if (!container) return;
    this.isDragging = true;
    this.startX = event.pageX - container.offsetLeft;
    this.scrollLeftStart = container.scrollLeft;
    container.classList.add('is-dragging');
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    const container = document.getElementById('doctorsScrollContainer');
    if (!container) return;
    const x = event.pageX - container.offsetLeft;
    const walk = (x - this.startX) * 1.4;
    container.scrollLeft = this.scrollLeftStart - walk;
  }

  onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const container = document.getElementById('doctorsScrollContainer');
    if (container) {
      container.classList.remove('is-dragging');
    }
  }

  onMouseLeave() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const container = document.getElementById('doctorsScrollContainer');
    if (container) {
      container.classList.remove('is-dragging');
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollPosition = window.scrollY + 120;
    const sections = ['contacts', 'doctors', 'about', 'home'];
    for (const sectionId of sections) {
      const el = document.getElementById(sectionId);
      if (el && scrollPosition >= el.offsetTop) {
        this.activeSection.set(sectionId);
        break;
      }
    }
  }

  private setupScrollSpy() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }
    const sections = ['home', 'about', 'doctors', 'contacts'];
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSection.set(entry.target.id);
        }
      });
    }, {
      root: null,
      rootMargin: '-10% 0px -70% 0px',
      threshold: [0, 0.2]
    });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) this.observer?.observe(el);
    });
  }
}
