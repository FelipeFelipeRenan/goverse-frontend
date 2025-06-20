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
export class LoginComponent  {
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
        alert('Login com Google - implementar fluxo OAuth');
        // Aqui você pode iniciar o fluxo OAuth com seu backend, redirecionar para o endpoint ou abrir popup
    }
    toCreateUser() {
        this.router.navigate(['signup']);
    }
}
