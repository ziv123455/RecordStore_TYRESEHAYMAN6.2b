import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService, User } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.html',
})
export class App {
  constructor(public auth: AuthService, private router: Router) {}

  get user(): User | null {
    return this.auth.getCurrentUser();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
