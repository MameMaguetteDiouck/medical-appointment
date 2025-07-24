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
        loadChildren: () => import('./components/auth/auth.module')
        .then(m => m.AuthModule),
    },
    {
        path: 'doctors',
        loadChildren: () => import('./components/doctor/doctor.module')
        .then(m => m.DoctorModule),
        canActivate: [RoleGuard],
        data: {
            role: 'doctors'
        }
    },
    {
        path: 'secretaries',
        loadChildren: () => import('./components/secretary/secretary.module')
        .then(m => m.SecretaryModule),
        canActivate: [RoleGuard],
        data: {
            role: 'secretaries'
        }
    },
    {
        path: 'patients',
        loadChildren: () => import('./components/patient/patient.module')
        .then(m => m.PatientModule),
        canActivate: [RoleGuard],
        data: {
            role: 'patients'
        }
    }
];