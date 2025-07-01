import { Component, OnInit } from '@angular/core';
//import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
})
export class LoginComponent {
    email = '';
    password = '';
    errorMessage = '';

    constructor(private authService: AuthService, private router: Router) {}

    onSubmit(event: Event) {
        event.preventDefault();

        const loginPayload = {
            email: this.email,
            password: this.password,
            type: 'password',
        };

        console.log('Payload enviado:', loginPayload);

        this.authService.login(loginPayload).subscribe({
            next: (response) => {
                this.authService.saveToken(response.token);
                this.router.navigate(['/home']);
            },
            error: (err) => {
                console.error('Erro de login:', err);
                this.errorMessage = 'E-mail ou senha inválidos';
            },
        });
    }

    onGoogleLogin() {
        const popup = window.open(
            'http://localhost:8088/oauth/google/login',
            '_blank',
            'width=500,height=600'
        );

        const listener = (event: MessageEvent) => {
            if (event.data?.type === 'oauth-success' && event.data?.token) {
                this.authService.saveToken(event.data.token);
                window.removeEventListener('message', listener);
                popup?.close();
                this.router.navigate(['/home']);
            }
        };

        window.addEventListener('message', listener);
    }

    toCreateUser() {
        this.router.navigate(['signup']);
    }
}
