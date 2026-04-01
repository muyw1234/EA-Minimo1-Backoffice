import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Autor } from '../../../../Core/models/autor.model';
import { AutoresService } from '../../../../Core/services/autores.service';
import { AutorFormComponent } from '../../components/autor-form/autor-form.component';
import { AutoresListComponent } from '../../components/autores-list/autores-list.component';

@Component({
  selector: 'app-autores-page',
  standalone: true,
  imports: [CommonModule, AutorFormComponent, AutoresListComponent],
  templateUrl: './autores-page.component.html',
  styleUrl: './autores-page.component.css',
})
export class AutoresPageComponent implements OnInit {
  private readonly autoresService = inject(AutoresService);

  readonly autores = signal<Autor[]>([]);
  readonly selectedAutor = signal<Autor | null>(null);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(true);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(5);

  readonly totalItems = computed(() => this.filteredAutores().length);

  readonly totalPages = computed(() => {
    const total = Math.ceil(this.totalItems() / this.pageSize());
    return total > 0 ? total : 1;
  });

  readonly paginatedAutores = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredAutores().slice(start, end);
  });

  readonly searchAutor = signal('');

  readonly filteredAutores = computed(() => {
    const term = this.searchAutor().toLowerCase().trim();
    const allAutores = this.autores();

    if (!term) {
      return allAutores;
    }

    return allAutores.filter((autor) =>
      autor.fullName?.toLowerCase().includes(term)
    );
  });

  onSearch(term: string): void {
    this.searchAutor.set(term);
    this.currentPage.set(1);
  }



  ngOnInit(): void {
    this.loadAutores();
  }

  loadAutores(selectedAutorId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.autoresService
      .getAllAutores()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (autores) => {
          const safeAutores = Array.isArray(autores) ? autores : [];
          this.autores.set(safeAutores);

          this.ensureValidPage();

          if (selectedAutorId) {
            const autorRecienAfectado =
              safeAutores.find((autor) => autor._id === selectedAutorId) ?? null;

            this.selectedAutor.set(
              autorRecienAfectado ? this.mapAutorToFormValue(autorRecienAfectado) : null
            );
            this.isCreating.set(false);
            return;
          }

          const selectedId = this.selectedAutor()?._id;

          if (selectedId) {
            const refreshedSelectedAutor =
              safeAutores.find((autor) => autor._id === selectedId) ?? null;

            this.selectedAutor.set(
              refreshedSelectedAutor
                ? this.mapAutorToFormValue(refreshedSelectedAutor)
                : this.createEmptyAutor()
            );

            if (!refreshedSelectedAutor) {
              this.isCreating.set(true);
            }

            return;
          }

          this.selectedAutor.set(this.createEmptyAutor());
          this.isCreating.set(true);
        },
        error: (error) => {
          console.error('Error al cargar autores:', error);
          this.errorMessage.set('No se pudieron cargar los autores.');
        },
      });
  }

  onCreateNew(): void {
    this.isCreating.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedAutor.set(this.createEmptyAutor());
  }

  onSelectAutor(autor: Autor): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedAutor.set(this.mapAutorToFormValue(autor));
  }

  onSaveAutor(autorData: Autor): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.isCreating() || !autorData._id) {
      const createPayload = this.buildCreateAutorPayload(autorData);

      this.autoresService
        .createAutor(createPayload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (createdAutor) => {
            this.isCreating.set(false);
            this.successMessage.set('Autor creado correctamente.');

            if (createdAutor._id) {
              this.loadAutores(createdAutor._id);
            } else {
              this.loadAutores();
            }
          },
          error: (error) => {
            console.error('Error al crear autor:', error);
            this.errorMessage.set(
              error?.error?.message ||
                error?.error?.details?.[0]?.message ||
                'No se pudo crear el autor.'
            );
          },
        });

      return;
    }

    const updatePayload = this.buildUpdateAutorPayload(autorData);

    this.autoresService
      .updateAutor(autorData._id, updatePayload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updatedAutor) => {
          this.isCreating.set(false);
          this.successMessage.set('Autor actualizado correctamente.');

          if (updatedAutor._id) {
            this.loadAutores(updatedAutor._id);
          } else {
            this.loadAutores();
          }
        },
        error: (error) => {
          console.error('Error al actualizar autor:', error);
          this.errorMessage.set(
            error?.error?.message ||
              error?.error?.details?.[0]?.message ||
              'No se pudo actualizar el autor.'
          );
        },
      });
  }

  onDeleteAutor(autor: Autor): void {
    if (!autor._id) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres marcar como eliminado al autor "${autor.fullName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.autoresService
      .updateAutor(autor._id, {
        IsDeleted: true,
      })
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Autor eliminado correctamente.');
          this.selectedAutor.set(this.createEmptyAutor());
          this.isCreating.set(true);
          this.loadAutores();
        },
        error: (error) => {
          console.error('Error al eliminar autor:', error);
          this.errorMessage.set(
            error?.error?.message ||
              error?.error?.details?.[0]?.message ||
              'No se pudo eliminar el autor.'
          );
        },
      });
  }

  onDeletePermanent(autorId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.autoresService
      .deleteAutor(autorId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Autor eliminado permanentemente.');
          this.loadAutores();
        },
        error: (error) => {
          console.error('Error al eliminar permanentemente:', error);
          this.errorMessage.set('Error al eliminar permanentemente el autor.');
        }
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedAutor.set(this.createEmptyAutor());
    this.isCreating.set(true);
  }

  onRestore(autor: Autor): void {
      if (!autor || !autor._id) return;
  
      this.isLoading.set(true);
      this.autoresService
        .restoreAutor(autor._id, autor)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.successMessage.set('Autor restaurado con éxito');
            this.loadAutores(autor._id);
          },
          error: () => this.errorMessage.set('Error al restaurar el autor.')
        });
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

  trackByAutorId(index: number, autor: Autor): string | number {
    return autor._id ?? index;
  }

  private ensureValidPage(): void {
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }

    if (this.currentPage() < 1) {
      this.currentPage.set(1);
    }
  }

  private createEmptyAutor(): Autor {
    return {
      fullName: '',
      IsDeleted: false,
    };
  }

  private mapAutorToFormValue(autor: Autor): Autor {
    return {
      _id: autor._id,
      fullName: autor.fullName ?? '',
      IsDeleted: autor.IsDeleted ?? false,
      createdAt: autor.createdAt,
      updatedAt: autor.updatedAt,
    };
  }

  private buildCreateAutorPayload(autor: Autor): Autor {
    return {
      fullName: autor.fullName.trim(),
      IsDeleted: autor.IsDeleted ?? false,
    };
  }

  private buildUpdateAutorPayload(autor: Autor): Partial<Autor> {
    return {
      fullName: autor.fullName.trim(),
      IsDeleted: autor.IsDeleted ?? false,
    };
  }
}