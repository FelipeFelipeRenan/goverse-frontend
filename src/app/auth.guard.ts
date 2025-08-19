import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Esta verificação agora é 100% confiável, pois ela só roda
    // depois que o APP_INITIALIZER terminou seu trabalho.
    if (authService.isAuthenticatedSync()) {
        return true;
    }

    return router.createUrlTree(['/login']);
};