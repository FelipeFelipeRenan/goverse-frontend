import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app.component';


import { CredentialsInterceptor } from './credentials.interceptor'; // <-- 1. Importe o novo interceptor
import { CsrfInterceptor } from './csrf_interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([
        CsrfInterceptor,
        CredentialsInterceptor // <-- 2. Adicione-o à lista
      ])
    ),
    // A linha abaixo não é mais necessária aqui, pois ReactiveFormsModule é geralmente importado em componentes
    // ReactiveFormsModule 
  ]
});