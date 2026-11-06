import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { catchError, throwError } from 'rxjs';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const toastService = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 0) {
                toastService.error('Sem conexão com o servidor.');
                return throwError(() => error);
            }

            // O backend responde {"error": "...", "message": "..."}
            const backendMessage: string | undefined =
                error.error?.message ??
                (typeof error.error === 'string' ? error.error : undefined);

            switch (error.status) {
                case 401:
                    // Login/cadastro devolvem 401 para credenciais erradas: quem chamou mostra a mensagem.
                    if (!router.url.includes('/login') && !router.url.includes('/signup')) {
                        toastService.error('Sessão expirada, faça login novamente.');
                        router.navigate(['/login']);
                    }
                    break;
                case 403:
                    toastService.error(backendMessage ?? 'Você não tem permissão para realizar esta ação.');
                    break;
                case 500:
                    toastService.error('Erro interno do servidor. Tente novamente mais tarde.');
                    break;
                default:
                    // 400, 404, 409...: as telas tratam e mostram a mensagem do backend.
                    break;
            }
            return throwError(() => error);
        })
    );
};
