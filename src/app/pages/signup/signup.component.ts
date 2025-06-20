import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CreateUserPayload, UserService } from '../../services/user.service';

@Component({
    selector: 'app-signup',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './signup.component.html',
    styleUrl: './signup.component.css',
    standalone: true,
})
export class SignupComponent {
    signupForm: FormGroup;
    error: string | null = null;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private router: Router
    ) {
        this.signupForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required],
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;

        return password === confirmPassword ? null : { passwordsNotMatch: true };
    }

    onSubmit() {
        if (this.signupForm.invalid) {
            this.error = 'Verifique os campos e tente novamente!';
            return;
        }

        this.error = null;
        this.loading = true;

        const payload: CreateUserPayload = {
            username: this.signupForm.value.name,
            email: this.signupForm.value.email,
            password: this.signupForm.value.password
        };
        
        this.userService.createUser(payload).subscribe({
            next: () => this.router.navigate(['/login']),
            error: (err) => {
                this.error =
                    'Erro ao registrar: ' + (err.error?.message || 'Tente novamente');
                this.loading = false;
            },
        });
    }

    toLogin(){
      this.router.navigate(['/login'])
    }
}