import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,  // importante: componente standalone
  imports: [ReactiveFormsModule],  // importa aqui
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(event : Event) {
    event.preventDefault();
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.value;
    console.log('Login:', email, password);
    alert("Login feito");
  }

    onGoogleLogin() {
    alert('Login com Google - implementar fluxo OAuth');
    // Aqui você pode iniciar o fluxo OAuth com seu backend, redirecionar para o endpoint ou abrir popup
  }
}
