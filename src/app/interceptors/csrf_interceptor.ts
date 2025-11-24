import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const CsrfInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const csrfToken = authService.getCsrfToken();

    if (csrfToken && req.method !== 'GET' && req.method !== 'HEAD') {
        const csrfReq = req.clone({
            setHeaders: {
                'X-CSRF-TOKEN': csrfToken,
            },
        });
        return next(csrfReq);
    }

    return next(req);
};
