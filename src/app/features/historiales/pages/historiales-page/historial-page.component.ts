import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Libro } from '../../../../Core/models/libro.model';
import { Historial } from '../../../../Core/models/historial.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import { HistorialService} from '../../../../Core/services/historial.service';
import { HistorialFormComponent } from '../../components/historial-form/historial-form.component';
import { HistorialListComponent } from '../../components/historial-list/historial-list.component';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, HistorialFormComponent, HistorialListComponent],
  templateUrl: './historial-page.component.html',
  styleUrl: './historial-page.component.css',
})
export class HistorialPageComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly librosService = inject(LibrosService);
  private readonly historialService = inject(HistorialService);

  readonly historiales = signal<Historial[]>([]);
  readonly libros = signal<Libro[]>([]);
  readonly selectedHistorial = signal<Historial | null>(null);

  readonly isLoading = signal(false);
  readonly isLoadingLibros = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(true);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(5);

  readonly totalItems = computed(() => this.filteredHistorial().length);

  readonly totalPages = computed(() => {
    const total = Math.ceil(this.totalItems() / this.pageSize());
    return total > 0 ? total : 1;
  });

  readonly paginatedHistoriales = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredHistorial().slice(start, end);
  });

  readonly searchHistorial = signal('');
  readonly filteredHistorial = computed(() => {
    const term = this.searchHistorial().toLowerCase().trim();
    const allHistoriales = this.historiales();

    if (!term) {
      return allHistoriales;
    }
    return allHistoriales.filter((historial) =>
      historial.accion?.toLowerCase().includes(term)
    );
  }); 

  onSearch(term: string): void {
    this.searchHistorial.set(term);
    this.currentPage.set(1);
  }


  ngOnInit(): void {
    this.loadLibros();
    this.loadHistorial();
  }

  loadHistorial(selectedHistorialId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.historialService
      .getAllHistorial()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (historiales) => {
          const safeHistoriales = Array.isArray(historiales) ? historiales : [];
          this.historiales.set(safeHistoriales);

          this.ensureValidPage();

          if (selectedHistorialId) {
            const historialRecienAfectado =
              safeHistoriales.find((historial) => historial._id === selectedHistorialId) ?? null;

            this.selectedHistorial.set(
              historialRecienAfectado ? this.mapHistorialToFormValue(historialRecienAfectado) : null
            );
            this.isCreating.set(false);
            return;
          }

          const selectedId = this.selectedHistorial()?._id;

          if (selectedId) {
            const refreshedSelectedHistorial =
              safeHistoriales.find((historial) => historial._id === selectedId) ?? null;

            this.selectedHistorial.set(
              refreshedSelectedHistorial
                ? this.mapHistorialToFormValue(refreshedSelectedHistorial)
                : this.createEmptyHistorial()
            );

            if (!refreshedSelectedHistorial) {
              this.isCreating.set(true);
            }

            return;
          }

          this.selectedHistorial.set(this.createEmptyHistorial());
          this.isCreating.set(true);
        },
        error: (error) => {
          console.error('Error al cargar usuarios:', error);
          this.errorMessage.set('No se pudieron cargar los usuarios.');
        },
      });
  }

  loadLibros(): void {
    this.isLoadingLibros.set(true);

    this.librosService
      .getLibros()
      .pipe(finalize(() => this.isLoadingLibros.set(false)))
      .subscribe({
        next: (libros) => {
          this.libros.set(Array.isArray(libros) ? libros : []);
        },
        error: (error) => {
          console.error('Error al cargar libros:', error);
          this.errorMessage.set('No se pudieron cargar los libros.');
        },
      });
  }

  onCreateNew(): void {
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedHistorial.set(this.createEmptyHistorial());
  }

  onSelectHistorial(historial: Historial): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedHistorial.set(this.mapHistorialToFormValue(historial));
  }

  onSaveHistorial(historialData: Historial): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.isCreating() || !historialData._id) {
      const createPayload = this.buildCreateHistorialPayload(historialData);

      this.historialService
        .createHistorial(createPayload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (createdHistorial) => {
            this.isCreating.set(false);
            this.successMessage.set('Historial creado correctamente.');

            if (createdHistorial._id) {
              this.loadHistorial(createdHistorial._id);
            } else {
              this.loadHistorial();
            }
          },
          error: (error) => {
            console.error('Error al crear usuario:', error);
            this.errorMessage.set(
              error?.error?.message ||
                error?.error?.details?.[0]?.message ||
                'No se pudo crear el usuario.'
            );
          },
        });

      return;
    }

    const updatePayload = this.buildCreateHistorialPayload(historialData);

    this.historialService
      .updateHistorial(historialData._id, updatePayload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updatedHistorial) => {
          this.isCreating.set(false);
          this.successMessage.set('Usuario actualizado correctamente.');

          if (updatedHistorial._id) {
            this.loadHistorial(updatedHistorial._id);
          } else {
            this.loadHistorial();
          }
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.errorMessage.set(
            error?.error?.message ||
              error?.error?.details?.[0]?.message ||
              'No se pudo actualizar el usuario.'
          );
        },
      });
  }


  onDeletePermanent(historialId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.historialService
      .permanentDeleteHistorial(historialId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario eliminado permanentemente.');
          this.loadHistorial();
        },
        error: (error) => {
          console.error('Error al eliminar permanentemente:', error);
          this.errorMessage.set('Error al eliminar permanentemente el usuario.');
        }
      });
  }


  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedHistorial.set(this.createEmptyHistorial());
    this.isCreating.set(true);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  onNextPage(): void {
    this.onPageChange(this.currentPage() + 1);
  }

  onPreviousPage(): void {
    this.onPageChange(this.currentPage() - 1);
  }

  trackByHistorialId(index: number, historial: Historial): string | number {
    return historial._id ?? index;
  }

  private ensureValidPage(): void {
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }

    if (this.currentPage() < 1) {
      this.currentPage.set(1);
    }
  }

  private createEmptyHistorial(): Historial {
    return {
      libro: '',
      accion: '',
      descripcion: '',
      fecha: new Date(),
    };
  }

  private mapHistorialToFormValue(historial: Historial): Historial {
    return {
      _id: historial._id,
      libro: historial.libro ?? '',
      accion: historial.accion ?? '',
      descripcion: historial.descripcion ?? '',
      fecha: historial.fecha,
    };
  }

  private buildCreateHistorialPayload(historial: Historial): Historial {
    return {
      libro: historial.libro,
      accion: historial.accion,
      descripcion: historial.descripcion,
      fecha: historial.fecha
    };
  }

  private buildUpdateHistorialPayload(historial: Historial): Partial<Historial> {
    return {
      libro: historial.libro,
      accion: historial.accion,
      descripcion: historial.descripcion,
      fecha: historial.fecha
    };
  }

  private extractLibroIds(libros: Historial['libro']): string[] {
    if (!Array.isArray(libros)) {
      return [];
    }

    return libros
      .map((libro) => (typeof libro === 'string' ? libro : libro._id))
      .filter((libroId): libroId is string => !!libroId);
  }
}