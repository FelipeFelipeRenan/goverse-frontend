import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { CredentialsInterceptor } from './app/credentials.interceptor';
import { CsrfInterceptor } from './app/csrf_interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        CredentialsInterceptor, // Adiciona 'withCredentials: true'
        CsrfInterceptor       // Adiciona o cabeçalho X-CSRF-TOKEN
      ])
    ),
  ]
});