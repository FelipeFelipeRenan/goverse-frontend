import { HttpInterceptorFn } from '@angular/common/http';

export const CredentialsInterceptor: HttpInterceptorFn = (req, next) => {
    // Clona a requisição e adiciona a flag que envia os cookies
    const newReq = req.clone({
        withCredentials: true,
    });
    return next(newReq);
};
