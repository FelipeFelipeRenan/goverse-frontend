import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = Inject(Router);
    const toastService = Inject(ToastService);
    const authService = Inject(AuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ocorreu um erro inesperado.';
            if (error.status === 0) {
                errorMessage = 'Sem conexão com o servidor.';
                toastService.error(errorMessage);
                return throwError(() => error);
            }

            // erros HTTP
            switch (error.status) {
                case 401:
                    // Token expirou ou invalido
                    if (!router.url.includes('/login')) {
                        toastService.error(
                            'Sessão expirada, faça login novamente.'
                        );
                        router.navigate(['/login']);
                    }
                    break;

                case 403:
                    toastService.error(
                        'Você não tem permissão para realizar esta ação.'
                    );
                    break;

                case 404:
                    errorMessage = 'Recurso não encontrado';
                    break;

                case 500:
                    toastService.error(
                        'Erro interno do servidor. Tente novamente mais tarde.'
                    );
                    break;

                default:
                    // tenta pegar a mensagem de erro do backend, se existir
                    if (error.error && error.error.message) {
                        errorMessage = error.error.message;
                    } else if (typeof error.error === 'string') {
                        errorMessage = error.error;
                    }
                    break;
            }
            return throwError(() => error);
        })
    );
};
