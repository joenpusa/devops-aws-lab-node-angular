import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Material, HealthResponse } from '../models/material.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private readonly apiUrl = `${environment.apiUrl}/api/materials`;
  private readonly healthUrl = `${environment.apiUrl}/health`;

  constructor(private http: HttpClient) {}

  // Listar todos los materiales desde MySQL
  getMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener un material por UUID
  getMaterialById(id: string): Observable<Material> {
    return this.http.get<Material>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Crear nuevo material
  createMaterial(material: Partial<Material>): Observable<Material> {
    return this.http.post<Material>(this.apiUrl, material).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar material
  updateMaterial(id: string, material: Partial<Material>): Observable<Material> {
    return this.http.put<Material>(`${this.apiUrl}/${id}`, material).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar material
  deleteMaterial(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Verificar estado del backend y base de datos (Health check probe)
  checkHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(this.healthUrl).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('[MaterialService Error]', error);
    const errorMessage = error.error?.error || error.message || 'Error de conexión con el backend';
    return throwError(() => new Error(errorMessage));
  }
}
