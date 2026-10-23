import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  auth = inject(Auth);
  firestore = inject(Firestore);
  router = inject(Router);
  authService = inject(AuthService);

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const user: User | null = await this.getCurrentUser();

    if (!user) {
      this.router.navigate(['/auth/sign-in']);
      return false;
    }

    const userRole = await this.authService.getUserRole(user);
    const expectedRole = route.data['role'];

    if (userRole === expectedRole) {
      return true;
    }

    if (userRole) {
      this.router.navigate([`/${userRole}`]);
    } else {
      this.router.navigate(['/auth/sign-in']);
    }
    
    return false;
  }

  private getCurrentUser(): Promise<User | null> {
    return new Promise(resolve => {
      onAuthStateChanged(this.auth, resolve);
    });
  }
}

export const roleGuard: CanActivateFn = (route, state) => {
  return inject(RoleGuard).canActivate(route);
};