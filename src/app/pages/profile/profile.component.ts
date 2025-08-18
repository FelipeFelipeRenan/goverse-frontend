import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, User } from '../../services/auth.service'; // Importe a interface User
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs'; // Importe o Subscription

@Component({
    selector: 'app-profile',
    imports: [CommonModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css',
    standalone: true,
})
export class ProfileComponent implements OnInit, OnDestroy {
    user: User | null = null; // Use a interface User para tipagem forte
    isLoading = true;
    error = '';
    private userSubscription?: Subscription;

    constructor(
        private authService: AuthService,
        // O UserService pode não ser mais necessário aqui se o AuthService já fornecer os dados
        private router: Router
    ) {}

    ngOnInit(): void {
        // Se inscreve para receber o usuário atual do AuthService
        this.userSubscription = this.authService.currentUser$.subscribe({
            next: (data) => {
                if (data) {
                    this.user = data;
                } else {
                    // Se não houver usuário no estado, redireciona para o login
                    this.router.navigate(['/login']);
                }
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Erro ao carregar perfil!';
                console.error(err);
                this.isLoading = false;
            },
        });
    }

    ngOnDestroy(): void {
        // Limpa a inscrição para evitar vazamentos de memória
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    logout() {
        this.authService.logout().subscribe({
            next: () => {
                this.router.navigate(['/login']);
            },
            error: (err) => {
                console.error('Erro ao fazer logout:', err);
                this.router.navigate(['/login']);
            },
        });
    }

    toHomePage() {
        this.router.navigate(['/home']);
    }
}
