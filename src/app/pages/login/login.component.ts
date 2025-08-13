import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs'; // Importe o Subscription

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
    email = '';
    password = '';
    errorMessage = '';
    private messageListener?: (event: MessageEvent) => void;
    private authSubscription?: Subscription;

    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit(): void {
        // Verifica se o usuário já está logado ao entrar na página
        this.authSubscription = this.authService.currentUser$.subscribe(user => {
            if (user) {
                this.router.navigate(['/home']);
            }
        });
    }

    ngOnDestroy(): void {
        // Limpa a inscrição para evitar vazamentos de memória
        if (this.authSubscription) {
            this.authSubscription.unsubscribe();
        }
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
        }
    }

    onSubmit(event: Event) {
        event.preventDefault();
        const loginPayload = {
            email: this.email,
            password: this.password,
            type: 'password',
        };

        this.authService.login(loginPayload).subscribe({
            next: () => {
                // Sucesso! O AuthService já guardou o estado. Apenas navegamos.
                this.router.navigate(['/home']);
            },
            error: (err) => {
                console.error('Erro de login:', err);
                this.errorMessage = 'E-mail ou senha inválidos';
            },
        });
    }

    onGoogleLogin() {
        // Definimos o listener como uma propriedade da classe
        this.messageListener = (event: MessageEvent) => {
            // A mensagem agora é genérica, não contém mais o token
            if (event.data?.type === 'oauth-success') {
                // Apenas recarrega a página. O AuthService vai pegar o novo
                // estado de login a partir do cookie na próxima inicialização.
                // Para uma melhor UX, poderíamos chamar um método this.authService.refreshUser()
                window.location.href = '/home';
            }
        };

        window.addEventListener('message', this.messageListener);

        // A URL do backend para o login do Google
        window.open(
            'http://localhost/oauth/google/login', // <-- Apontando para o gateway
            '_blank',
            'width=500,height=600'
        );
    }

    toCreateUser() {
        this.router.navigate(['signup']);
    }
}