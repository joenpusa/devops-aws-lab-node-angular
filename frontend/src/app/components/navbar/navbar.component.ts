import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialService } from '../../services/material.service';
import { HealthResponse } from '../../models/material.model';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar-container">
      <div class="navbar-content">
        <div class="brand">
          <div class="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 class="brand-title">DevOpsLab <span class="badge-tag">AWS</span></h1>
            <p class="brand-subtitle">CRUD Fullstack & Cloud Infrastructure</p>
          </div>
        </div>

        <div class="status-indicator">
          <div class="pulse-dot" [ngClass]="{'status-online': isOnline, 'status-offline': !isOnline}"></div>
          <div class="status-text">
            <span class="status-label">Backend API:</span>
            <span class="status-value" [ngClass]="{'text-online': isOnline, 'text-offline': !isOnline}">
              {{ isOnline ? 'Online (MySQL Connected)' : 'Desconectado' }}
            </span>
          </div>
          <button (click)="checkBackendHealth()" class="btn-refresh" title="Revisar estado">
            ↻
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-container {
      background: var(--bg-glass);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-glass);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 0.85rem 1.5rem;
    }
    .navbar-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .brand-icon {
      width: 42px;
      height: 42px;
      background: var(--primary-gradient);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: var(--shadow-glow);
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge-tag {
      font-size: 0.7rem;
      background: rgba(6, 182, 212, 0.2);
      color: var(--primary-light);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      border: 1px solid rgba(6, 182, 212, 0.4);
    }
    .brand-subtitle {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-glass);
      padding: 0.45rem 0.95rem;
      border-radius: 30px;
      font-size: 0.82rem;
    }
    .pulse-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .status-online {
      background: var(--accent-green);
      box-shadow: 0 0 8px var(--accent-green);
      animation: pulseGlow 2s infinite;
    }
    .status-offline {
      background: var(--accent-red);
      box-shadow: 0 0 8px var(--accent-red);
    }
    .status-label {
      color: var(--text-muted);
      margin-right: 0.3rem;
    }
    .text-online {
      color: var(--accent-green);
      font-weight: 500;
    }
    .text-offline {
      color: var(--accent-red);
      font-weight: 500;
    }
    .btn-refresh {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
      transition: color 0.2s, transform 0.2s;
    }
    .btn-refresh:hover {
      color: var(--primary);
      transform: rotate(180deg);
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isOnline = false;
  private pollSub?: Subscription;

  constructor(private materialService: MaterialService) {}

  ngOnInit(): void {
    this.checkBackendHealth();
    // Revisar salud cada 15 segundos
    this.pollSub = interval(15000).subscribe(() => this.checkBackendHealth());
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  checkBackendHealth(): void {
    this.materialService.checkHealth().subscribe({
      next: (res) => {
        this.isOnline = res.status === 'ok' && res.checks.database === 'connected';
      },
      error: () => {
        this.isOnline = false;
      }
    });
  }
}
