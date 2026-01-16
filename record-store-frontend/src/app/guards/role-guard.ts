import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard = (allowed: UserRole[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.getCurrentUser();
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    if (allowed.includes(user.role)) return true;

    router.navigate(['/records']);
    return false;
  };
};
