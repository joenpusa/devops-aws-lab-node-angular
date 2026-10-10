import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialService } from '../../services/material.service';
import { Material } from '../../models/material.model';

@Component({
  selector: 'app-material-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="materials-page animate-fade-in">
      <!-- Header y Acciones -->
      <div class="section-header">
        <div>
          <h2 class="section-title">Catálogo de Materiales</h2>
          <p class="section-desc">Registros relacionales persistidos en RDS MySQL con referencias de objetos a Amazon S3</p>
        </div>
        <button id="btn-open-create-modal" (click)="openModal()" class="btn-primary">
          <span class="icon">+</span> Nuevo Material
        </button>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="filter-bar">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Buscar por nombre o descripción..."
            class="input-search"
            id="input-search-materials"
          />
        </div>
        <div class="stats-badge">
          Total: <strong>{{ filteredMaterials.length }}</strong> materiales
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="state-container">
        <div class="spinner"></div>
        <p>Consultando base de datos MySQL...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage && !isLoading" class="alert-error">
        ⚠️ {{ errorMessage }}
        <button (click)="loadMaterials()" class="btn-retry">Reintentar</button>
      </div>

      <!-- Grid de Materiales -->
      <div *ngIf="!isLoading && !errorMessage" class="materials-grid">
        <div *ngFor="let item of filteredMaterials" class="material-card">
          <div class="card-header">
            <div class="s3-pill" title="Ubicación en Amazon S3">
              <span class="cloud-icon">☁</span> S3: {{ item.image_key || 'Sin imagen' }}
            </div>
            <button 
              (click)="onDelete(item)" 
              class="btn-delete" 
              title="Eliminar registro"
              [attr.id]="'btn-delete-' + item.id"
            >
              ✕
            </button>
          </div>

          <h3 class="card-title">{{ item.name }}</h3>
          <p class="card-desc">{{ item.description || 'Sin descripción detallada.' }}</p>

          <div class="card-meta">
            <div class="price-box">
              <span class="currency">$</span>
              <span class="amount">{{ item.price }}</span>
            </div>
            <div class="date-box">
              {{ item.created_at | date:'mediumDate' }}
            </div>
          </div>

          <div class="uuid-footer">
            <span class="uuid-label">UUID:</span>
            <span class="uuid-code">{{ item.id }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredMaterials.length === 0" class="empty-state">
          <p>No se encontraron materiales con el criterio de búsqueda.</p>
        </div>
      </div>

      <!-- Modal de Creación -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal-card animate-fade-in">
          <div class="modal-header">
            <h3>Registrar Nuevo Material</h3>
            <button (click)="closeModal()" class="btn-close">✕</button>
          </div>

          <form (ngSubmit)="onCreateSubmit()" class="modal-form">
            <div class="form-group">
              <label for="material-name">Nombre del Material *</label>
              <input 
                id="material-name" 
                type="text" 
                [(ngModel)]="newMaterial.name" 
                name="name" 
                required 
                placeholder="Ej. Lámina de Acero Inoxidable"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="material-price">Precio (USD) *</label>
              <input 
                id="material-price" 
                type="number" 
                step="0.01" 
                [(ngModel)]="newMaterial.price" 
                name="price" 
                required 
                placeholder="0.00"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="material-image-key">Clave de Objeto en Amazon S3</label>
              <input 
                id="material-image-key" 
                type="text" 
                [(ngModel)]="newMaterial.image_key" 
                name="image_key" 
                placeholder="materials/nombre-archivo.jpg"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="material-desc">Descripción</label>
              <textarea 
                id="material-desc" 
                [(ngModel)]="newMaterial.description" 
                name="description" 
                rows="3" 
                placeholder="Detalles técnicos y especificaciones..."
                class="form-textarea"
              ></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn-secondary">Cancelar</button>
              <button 
                type="submit" 
                class="btn-primary" 
                [disabled]="isSubmitting || !newMaterial.name || !newMaterial.price"
                id="btn-submit-material"
              >
                {{ isSubmitting ? 'Guardando...' : 'Crear en RDS MySQL' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .materials-page {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
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
      margin-top: 0.25rem;
    }
    .btn-primary {
      background: var(--primary-gradient);
      color: white;
      border: none;
      padding: 0.75rem 1.4rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-glow);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-glass);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 2rem;
    }
    .search-box {
      flex: 1;
    }
    .input-search {
      width: 100%;
      background: var(--bg-dark);
      border: 1px solid var(--border-glass);
      color: var(--text-main);
      padding: 0.6rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .input-search:focus {
      border-color: var(--primary);
    }
    .stats-badge {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .materials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .material-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
    }
    .material-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-hover);
      box-shadow: var(--shadow-md);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .s3-pill {
      font-size: 0.75rem;
      background: rgba(139, 92, 246, 0.15);
      color: #c4b5fd;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      border: 1px solid rgba(139, 92, 246, 0.3);
      max-width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .btn-delete {
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 1rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    .btn-delete:hover {
      color: var(--accent-red);
    }
    .card-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .card-desc {
      color: var(--text-muted);
      font-size: 0.88rem;
      line-height: 1.5;
      margin-bottom: 1.25rem;
      flex-grow: 1;
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-top: 1px solid var(--border-glass);
      padding-top: 0.85rem;
      margin-bottom: 0.75rem;
    }
    .price-box {
      font-family: var(--font-heading);
      font-weight: 700;
      color: var(--primary-light);
    }
    .currency {
      font-size: 0.9rem;
      margin-right: 2px;
    }
    .amount {
      font-size: 1.4rem;
    }
    .date-box {
      font-size: 0.78rem;
      color: var(--text-dim);
    }
    .uuid-footer {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      background: rgba(0, 0, 0, 0.25);
      padding: 0.35rem 0.6rem;
      border-radius: 4px;
      display: flex;
      gap: 0.4rem;
      overflow: hidden;
      color: var(--text-dim);
    }
    .uuid-label {
      color: var(--text-muted);
      font-weight: 600;
    }
    .uuid-code {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
    .state-container, .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-muted);
      grid-column: 1 / -1;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(6, 182, 212, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 1rem 1.5rem;
      border-radius: var(--radius-sm);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .btn-retry {
      background: var(--accent-red);
      color: white;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      cursor: pointer;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1rem;
    }
    .modal-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-glass);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 500px;
      padding: 2rem;
      box-shadow: var(--shadow-md);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.2rem;
      cursor: pointer;
    }
    .form-group {
      margin-bottom: 1.2rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }
    .form-input, .form-textarea {
      width: 100%;
      background: var(--bg-dark);
      border: 1px solid var(--border-glass);
      color: var(--text-main);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus, .form-textarea:focus {
      border-color: var(--primary);
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.8rem;
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-glass);
      color: var(--text-main);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
  `]
})
export class MaterialListComponent implements OnInit {
  materials: Material[] = [];
  searchQuery = '';
  isLoading = false;
  errorMessage = '';

  showModal = false;
  isSubmitting = false;
  newMaterial: Partial<Material> = {
    name: '',
    price: '',
    description: '',
    image_key: 'materials/nuevo-item.jpg'
  };

  constructor(private materialService: MaterialService) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.materialService.getMaterials().subscribe({
      next: (data) => {
        this.materials = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  get filteredMaterials(): Material[] {
    if (!this.searchQuery.trim()) {
      return this.materials;
    }
    const q = this.searchQuery.toLowerCase();
    return this.materials.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.description && m.description.toLowerCase().includes(q))
    );
  }

  openModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.newMaterial = {
      name: '',
      price: '',
      description: '',
      image_key: 'materials/nuevo-item.jpg'
    };
  }

  onCreateSubmit(): void {
    if (!this.newMaterial.name || !this.newMaterial.price) return;

    this.isSubmitting = true;
    this.materialService.createMaterial(this.newMaterial).subscribe({
      next: (created) => {
        this.materials.unshift(created);
        this.isSubmitting = false;
        this.closeModal();
      },
      error: (err) => {
        alert('Error al guardar material: ' + err.message);
        this.isSubmitting = false;
      }
    });
  }

  onDelete(material: Material): void {
    if (confirm(`¿Estás seguro de eliminar "${material.name}"?`)) {
      this.materialService.deleteMaterial(material.id).subscribe({
        next: () => {
          this.materials = this.materials.filter(m => m.id !== material.id);
        },
        error: (err) => {
          alert('Error al eliminar: ' + err.message);
        }
      });
    }
  }
}
