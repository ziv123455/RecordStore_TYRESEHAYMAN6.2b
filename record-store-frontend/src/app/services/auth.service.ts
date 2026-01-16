import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';

export type UserRole = 'clerk' | 'manager' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'currentUser';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<User>(`${environment.apiUrl}/login`, { email, password })
      .pipe(tap(user => localStorage.setItem(this.key, JSON.stringify(user))));
  }

  logout(): void {
    localStorage.removeItem(this.key);
  }

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(this.key);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }
}
