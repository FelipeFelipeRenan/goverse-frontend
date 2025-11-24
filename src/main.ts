import { APP_INITIALIZER, FactoryProvider, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Observable } from 'rxjs';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthService } from './app/services/auth.service';
import { CredentialsInterceptor } from './app/interceptors/credentials.interceptor';
import { CsrfInterceptor } from './app/interceptors/csrf_interceptor';

// Factory function que o Angular vai chamar durante a inicialização
export function initializeAuthFactory(authService: AuthService): () => Observable<any> {
    return () => authService.initializeAuthState();
}

// O provider do APP_INITIALIZER
export const appInitializerProvider: FactoryProvider = {
    provide: APP_INITIALIZER,
    useFactory: initializeAuthFactory,
    deps: [AuthService], // Diz ao Angular para injetar o AuthService na nossa factory
    multi: true,
};

// Configuração principal da aplicação
bootstrapApplication(AppComponent, {
    providers: [
        // Importa e configura todos os providers necessários
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([CsrfInterceptor, CredentialsInterceptor])
        ),
        // Registra o nosso provider de inicialização que vai travar o app
        // até que a verificação de autenticação termine.
        appInitializerProvider,
    ],
}).catch((err) => console.error(err));