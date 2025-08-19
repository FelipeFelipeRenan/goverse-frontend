import { ApplicationConfig, APP_INITIALIZER, FactoryProvider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

// Os interceptors que você já tinha
import { CredentialsInterceptor } from './credentials.interceptor';
import { CsrfInterceptor } from './csrf_interceptor';

// Factory function que o Angular vai chamar durante a inicialização
export function initializeAuth(authService: AuthService): () => Observable<any> {
    return () => authService.initializeAuthState();
}

// O provider do APP_INITIALIZER
export const appInitializerProvider: FactoryProvider = {
    provide: APP_INITIALIZER,
    useFactory: initializeAuth,
    deps: [AuthService], // Diz ao Angular para injetar o AuthService na nossa factory
    multi: true,
};

// Configuração principal da aplicação
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(
            withInterceptors([CsrfInterceptor, CredentialsInterceptor])
        ),
        // Registra o nosso provider de inicialização
        appInitializerProvider,
    ],
};