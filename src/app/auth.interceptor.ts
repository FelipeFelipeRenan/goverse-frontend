// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('access_token'); // <- corrigido aqui

    if (token) {
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
        return next(authReq);
    }

    return next(req); // não clona se não tiver token
};
