import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// O backend também entrega o token no cookie `csrf_token` (legível por JS).
// Usado como fallback quando o token em memória se perdeu (reload, login via OAuth).
function readCsrfCookie(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export const CsrfInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const csrfToken = authService.getCsrfToken() ?? readCsrfCookie();

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
