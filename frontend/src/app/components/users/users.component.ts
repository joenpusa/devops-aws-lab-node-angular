import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/material.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page animate-fade-in">
      <div class="section-header">
        <div>
          <h2 class="section-title">Gestión de Usuarios & Seguridad</h2>
          <p class="section-desc">Cuentas almacenadas en MySQL con hash bcrypt y autenticación para el laboratorio</p>
        </div>
      </div>

      <div class="users-grid-layout">
        <!-- Panel Izquierdo: Lista de Usuarios -->
        <div class="card-panel">
          <h3 class="panel-title">Usuarios en Base de Datos</h3>
          <div *ngIf="isLoading" class="loading-box">Cargando usuarios...</div>
          
          <div *ngIf="!isLoading" class="user-list">
            <div *ngFor="let user of users" class="user-item">
              <div class="user-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
              <div class="user-info">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-email">{{ user.email }}</div>
                <div class="user-uuid">UUID: {{ user.id }}</div>
              </div>
            </div>
            <div *ngIf="users.length === 0" class="empty-text">No hay usuarios registrados.</div>
          </div>
        </div>

        <!-- Panel Derecho: Probar Login & Registro -->
        <div class="card-panel">
          <div class="tabs-header">
            <button 
              [class.active]="activeTab === 'login'" 
              (click)="activeTab = 'login'"
              class="tab-btn"
            >
              Iniciar Sesión
            </button>
            <button 
              [class.active]="activeTab === 'register'" 
              (click)="activeTab = 'register'"
              class="tab-btn"
            >
              Registrar Nuevo
            </button>
          </div>

          <!-- Formulario Login -->
          <form *ngIf="activeTab === 'login'" (ngSubmit)="onLogin()" class="auth-form">
            <div class="form-group">
              <label>Correo Electrónico</label>
              <input type="email" [(ngModel)]="loginEmail" name="loginEmail" required class="form-input" placeholder="admin@devopslab.local"/>
            </div>
            <div class="form-group">
              <label>Contraseña</label>
              <input type="password" [(ngModel)]="loginPass" name="loginPass" required class="form-input" placeholder="••••••••"/>
            </div>
            <button type="submit" class="btn-primary w-full" [disabled]="!loginEmail || !loginPass">
              Autenticar con Backend
            </button>
            <div *ngIf="authResult" [ngClass]="{'msg-success': isAuthSuccess, 'msg-error': !isAuthSuccess}" class="auth-result">
              {{ authResult }}
            </div>
          </form>

          <!-- Formulario Registro -->
          <form *ngIf="activeTab === 'register'" (ngSubmit)="onRegister()" class="auth-form">
            <div class="form-group">
              <label>Nombre Completo</label>
              <input type="text" [(ngModel)]="regName" name="regName" required class="form-input" placeholder="Ing. DevOps"/>
            </div>
            <div class="form-group">
              <label>Correo Electrónico</label>
              <input type="email" [(ngModel)]="regEmail" name="regEmail" required class="form-input" placeholder="usuario@empresa.com"/>
            </div>
            <div class="form-group">
              <label>Contraseña (Se encripta con bcrypt)</label>
              <input type="password" [(ngModel)]="regPass" name="regPass" required class="form-input" placeholder="••••••••"/>
            </div>
            <button type="submit" class="btn-primary w-full" [disabled]="!regName || !regEmail || !regPass">
              Crear Usuario con UUID
            </button>
            <div *ngIf="regResult" [ngClass]="{'msg-success': isRegSuccess, 'msg-error': !isRegSuccess}" class="auth-result">
              {{ regResult }}
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-page {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .section-header {
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 0.92rem;
    }
    .users-grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    @media (max-width: 768px) {
      .users-grid-layout {
        grid-template-columns: 1fr;
      }
    }
    .card-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-md);
      padding: 1.75rem;
    }
    .panel-title {
      font-size: 1.2rem;
      margin-bottom: 1.5rem;
      color: var(--text-main);
    }
    .user-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .user-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-sm);
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .user-name {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.95rem;
    }
    .user-email {
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .user-uuid {
      font-size: 0.68rem;
      font-family: var(--font-mono);
      color: var(--text-dim);
    }
    .tabs-header {
      display: flex;
      border-bottom: 1px solid var(--border-glass);
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.6rem 1.2rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .form-group {
      margin-bottom: 1.2rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }
    .form-input {
      width: 100%;
      background: var(--bg-dark);
      border: 1px solid var(--border-glass);
      color: var(--text-main);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      outline: none;
    }
    .form-input:focus {
      border-color: var(--primary);
    }
    .btn-primary {
      background: var(--primary-gradient);
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
    }
    .w-full {
      width: 100%;
    }
    .auth-result {
      margin-top: 1rem;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }
    .msg-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #6ee7b7;
    }
    .msg-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .loading-box, .empty-text {
      color: var(--text-muted);
      font-size: 0.9rem;
      text-align: center;
      padding: 2rem;
    }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  activeTab: 'login' | 'register' = 'login';

  loginEmail = 'admin@devopslab.local';
  loginPass = 'Admin123!';
  authResult = '';
  isAuthSuccess = false;

  regName = '';
  regEmail = '';
  regPass = '';
  regResult = '';
  isRegSuccess = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onLogin(): void {
    this.authResult = 'Validando credenciales en backend...';
    this.userService.login({ email: this.loginEmail, password: this.loginPass }).subscribe({
      next: (res) => {
        this.isAuthSuccess = true;
        this.authResult = `✔ ${res.message}: Bienvenido, ${res.user.name}`;
      },
      error: (err) => {
        this.isAuthSuccess = false;
        this.authResult = `❌ Error: ${err.message}`;
      }
    });
  }

  onRegister(): void {
    this.regResult = 'Creando usuario...';
    this.userService.createUser({ name: this.regName, email: this.regEmail, password: this.regPass }).subscribe({
      next: (res) => {
        this.isRegSuccess = true;
        this.regResult = `✔ Usuario creado con éxito (UUID: ${res.id})`;
        this.loadUsers();
        this.regName = '';
        this.regEmail = '';
        this.regPass = '';
      },
      error: (err) => {
        this.isRegSuccess = false;
        this.regResult = `❌ Error: ${err.message}`;
      }
    });
  }
}
