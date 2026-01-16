import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  error = '';
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  submit(): void {
    this.error = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.get('email')?.value;
    const password = this.form.get('password')?.value;

    console.log('Logging in with:', email);

    this.auth.login(email, password).subscribe({
      next: (user) => {
        console.log('Logged in user:', user);
        this.router.navigate(['/records']);
      },
      error: (err) => {
        console.log('Login error:', err);
        this.error = err?.error?.error ?? 'Login failed';
      },
    });
  }
}
