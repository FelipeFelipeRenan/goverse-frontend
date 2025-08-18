import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { map, filter, switchMap, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.authCheckFinished$.pipe(
        filter((isFinished) => isFinished),
        take(1),
        switchMap(() => authService.currentUser$),
        map((user) => {
            if (user) {
                return true; // Se tem usuário, permite acesso
            }
            return router.createUrlTree(['/login']); // Se não, vai para o login
        })
    );
};
