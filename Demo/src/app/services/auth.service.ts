import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = 'https://yoors-backend-api-c6f8aucrfjakfwdw.eastus-01.azurewebsites.net/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setUser(response.user);
          this.isLoggedInSubject.next(true);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_BASE_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setUser(response.user);
          this.isLoggedInSubject.next(true);
        })
      );
  }

  logout(): void {
    this.removeToken();
    this.removeUser();
    this.isLoggedInSubject.next(false);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): any {
    const userStr = sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: any): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  private removeUser(): void {
    sessionStorage.removeItem(this.USER_KEY);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
}