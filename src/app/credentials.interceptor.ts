import { HttpInterceptorFn } from '@angular/common/http';

export const CredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Clona a requisição original e adiciona a flag withCredentials
  const newReq = req.clone({
    withCredentials: true,
  });

  // Envia a requisição clonada em vez da original
  return next(newReq);
};