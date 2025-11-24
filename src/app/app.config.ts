import {
    APP_INITIALIZER,
    ApplicationConfig,
    provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Estes são seus interceptors FUNCIONAIS
import { CredentialsInterceptor } from './interceptors/credentials.interceptor';
import { CsrfInterceptor } from './interceptors/csrf_interceptor';

// Isto é para o APP_INITIALIZER
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// Factory para o APP_INITIALIZER (estava correta)
function initializeAppFactory(authService: AuthService): () => Observable<any> {
    return () => authService.initializeAuthState();
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),

        provideHttpClient(
            withInterceptors([
                CredentialsInterceptor,
                CsrfInterceptor,
                ErrorInterceptor,
            ])
        ),

        {
            provide: APP_INITIALIZER,
            useFactory: initializeAppFactory,
            deps: [AuthService], // Injeta o AuthService na factory
            multi: true,
        },
    ],
};
