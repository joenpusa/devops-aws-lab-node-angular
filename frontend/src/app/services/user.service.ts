import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { User } from '../models/material.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  createUser(userData: { name: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(this.apiUrl, userData).pipe(
      catchError(this.handleError)
    );
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('[UserService Error]', error);
    const errorMessage = error.error?.error || error.message || 'Error en servicio de usuarios';
    return throwError(() => new Error(errorMessage));
  }
}
