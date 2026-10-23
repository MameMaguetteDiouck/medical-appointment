import { Routes } from '@angular/router';
import { WelcomePageComponent } from './components/welcome-page/welcome-page.component';
import { AuthGuard, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { RoleGuard } from './shared/guards/role.guard';

const redirectToLogin = () => redirectUnauthorizedTo('/auth/sign-in');

export const routes: Routes = [
    {
        path: '',
        component: WelcomePageComponent
    },
    {
        path: 'auth',
        loadChildren: () => import('./components/auth/auth.routes')
        .then(m => m.AUTH_ROUTES),
    },
    {
        path: 'doctors',
        loadChildren: () => import('./components/doctor/doctor.routes')
        .then(m => m.DOCTOR_ROUTES),
        canActivate: [RoleGuard],
        data: {
            role: 'doctors'
        }
    },
    {
        path: 'secretaries',
        loadChildren: () => import('./components/secretary/secretary.routes')
        .then(m => m.SECRETARY_ROUTES),
        canActivate: [RoleGuard],
        data: {
            role: 'secretaries'
        }
    },
    {
        path: 'patients',
        loadChildren: () => import('./components/patient/patient.routes')
        .then(m => m.PATIENT_ROUTES),
        canActivate: [RoleGuard],
        data: {
            role: 'patients'
        }
    }
];