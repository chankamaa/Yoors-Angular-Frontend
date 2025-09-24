import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface User {
  _id: string;
  id?: string;  // Updated to string to match _id
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  users: User[];
}

export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_BASE_URL = 'https://yoors-backend-api-c6f8aucrfjakfwdw.eastus-01.azurewebsites.net/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllUsers(): Observable<User[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<UsersResponse>(`${this.API_BASE_URL}/users`, { headers })
      .pipe(
        map(response => {
          // Add id property for compatibility
          return response.users.map(user => ({
            ...user,
            id: user._id
          }));
        })
      );
  }

  getCurrentUser(): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_BASE_URL}/users/me`, { headers }).pipe(
      map(response => {
        // Handle both direct user object and wrapped response
        const user = response.user || response;
        return {
          ...user,
          id: user._id // Ensure compatibility
        };
      })
    );
  }

  getUserById(id: string): Observable<User> {
    // Since the API doesn't have getUserById endpoint, 
    // we'll get all users and find the specific one
    return this.getAllUsers().pipe(
      map(users => {
        const user = users.find(u => (u.id || u._id) === id);
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      })
    );
  }

  updateCurrentUser(userData: UpdateUserRequest): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.patch<User>(`${this.API_BASE_URL}/users/me`, userData, { headers });
  }

  updateUserById(id: string, userData: UpdateUserRequest): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.patch<User>(`${this.API_BASE_URL}/users/${id}`, userData, { headers });
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.patch(`${this.API_BASE_URL}/users/me/password`, passwordData, { headers });
  }

  deleteCurrentUser(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.API_BASE_URL}/users/me`, { headers });
  }

  deleteUserById(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.API_BASE_URL}/users/${id}`, { headers });
  }

  private getAuthHeaders(): HttpHeaders {
    const authHeaders = this.authService.getAuthHeaders();
    return new HttpHeaders(authHeaders);
  }
}