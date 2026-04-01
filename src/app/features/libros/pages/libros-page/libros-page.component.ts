import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Autor } from '../../../../Core/models/autor.model';
import { Libro } from '../../../../Core/models/libro.model';
import { AutoresService } from '../../../../Core/services/autores.service';
import { LibrosService } from '../../../../Core/services/libros.service';
import { LibroFormComponent } from '../../components/libro-form/libro-form.component';
import { LibrosListComponent } from '../../components/libros-list/libros-list.component';

@Component({
  selector: 'app-libros-page',
  standalone: true,
  imports: [CommonModule, LibroFormComponent, LibrosListComponent],
  templateUrl: './libros-page.component.html',
  styleUrl: './libros-page.component.css',
})
export class LibrosPageComponent implements OnInit {
  private readonly librosService = inject(LibrosService);
  private readonly autoresService = inject(AutoresService);

  readonly libros = signal<Libro[]>([]);
  readonly autores = signal<Autor[]>([]);
  readonly selectedLibro = signal<Libro | null>(null);

  readonly isLoading = signal(false);
  readonly isLoadingAutores = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(true);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(5);

  readonly totalItems = computed(() => this.filteredLibros().length);

  readonly totalPages = computed(() => {
    const total = Math.ceil(this.totalItems() / this.pageSize());
    return total > 0 ? total : 1;
  });

  readonly paginatedLibros = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredLibros().slice(start, end);
  });

  readonly searchBook = signal('');

  readonly filteredLibros = computed(() => {
    const term = this.searchBook().toLowerCase().trim();
    const allLibros = this.libros();
    
    if (!term) return allLibros;

    return allLibros.filter(libro => 
      libro.title?.toLowerCase().includes(term) || 
      libro.isbn?.toLowerCase().includes(term)
    );
  });

  onSearch(term: string): void {
    this.searchBook.set(term);
    this.currentPage.set(1);
  }

  ngOnInit(): void {
    this.loadAutores();
    this.loadLibros();
  }

  loadLibros(selectedLibroId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.librosService
      .getAllLibros()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (libros) => {
          const safeLibros = Array.isArray(libros) ? libros : [];
          this.libros.set(safeLibros);

          this.ensureValidPage();

          if (selectedLibroId) {
            const libroRecienAfectado =
              safeLibros.find((libro) => libro._id === selectedLibroId) ?? null;

            this.selectedLibro.set(
              libroRecienAfectado ? this.mapLibroToFormValue(libroRecienAfectado) : null
            );
            this.isCreating.set(false);
            return;
          }

          const selectedId = this.selectedLibro()?._id;

          if (selectedId) {
            const refreshedSelectedLibro =
              safeLibros.find((libro) => libro._id === selectedId) ?? null;

            this.selectedLibro.set(
              refreshedSelectedLibro
                ? this.mapLibroToFormValue(refreshedSelectedLibro)
                : this.createEmptyLibro()
            );

            if (!refreshedSelectedLibro) {
              this.isCreating.set(true);
            }

            return;
          }

          this.selectedLibro.set(this.createEmptyLibro());
          this.isCreating.set(true);
        },
        error: (error) => {
          console.error('Error al cargar libros:', error);
          this.errorMessage.set('No se pudieron cargar los libros.');
        },
      });
  }

  loadAutores(): void {
    this.isLoadingAutores.set(true);

    this.autoresService
      .getAutores()
      .pipe(finalize(() => this.isLoadingAutores.set(false)))
      .subscribe({
        next: (autores) => {
          this.autores.set(Array.isArray(autores) ? autores : []);
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
    this.selectedLibro.set(this.createEmptyLibro());
  }

  onSelectLibro(libro: Libro): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibro.set(this.mapLibroToFormValue(libro));
  }

  onSaveLibro(libroData: Libro): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.isCreating() || !libroData._id) {
      const createPayload = this.buildCreateLibroPayload(libroData);

      this.librosService
        .createLibro(createPayload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (createdLibro) => {
            this.isCreating.set(false);
            this.successMessage.set('Libro creado correctamente.');

            if (createdLibro._id) {
              this.loadLibros(createdLibro._id);
            } else {
              this.loadLibros();
            }
          },
          error: (error) => {
            console.error('Error al crear libro:', error);
            this.errorMessage.set(
              error?.error?.message ||
                error?.error?.details?.[0]?.message ||
                'No se pudo crear el libro.'
            );
          },
        });

      return;
    }

    const updatePayload = this.buildUpdateLibroPayload(libroData);

    this.librosService
      .updateLibro(libroData._id, updatePayload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updatedLibro) => {
          this.isCreating.set(false);
          this.successMessage.set('Libro actualizado correctamente.');

          if (updatedLibro._id) {
            this.loadLibros(updatedLibro._id);
          } else {
            this.loadLibros();
          }
        },
        error: (error) => {
          console.error('Error al actualizar libro:', error);
          this.errorMessage.set(
            error?.error?.message ||
              error?.error?.details?.[0]?.message ||
              'No se pudo actualizar el libro.'
          );
        },
      });
  }

  onDeleteLibro(libro: Libro): void {
    if (!libro._id) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres marcar como eliminado el libro "${libro.title}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.librosService
      .updateLibro(libro._id, {
        IsDeleted: true,
      })
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Libro eliminado correctamente.');
          this.selectedLibro.set(this.createEmptyLibro());
          this.isCreating.set(true);
          this.loadLibros();
        },
        error: (error) => {
          console.error('Error al eliminar libro:', error);
          this.errorMessage.set(
            error?.error?.message ||
              error?.error?.details?.[0]?.message ||
              'No se pudo eliminar el libro.'
          );
        },
      });
  }

  onDeletePermanent(libroId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.librosService
      .deleteLibro(libroId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Libro eliminado permanentemente.');
          this.loadLibros();
        },
        error: (error) => {
          console.error('Error al eliminar permanentemente:', error);
          this.errorMessage.set('Error al eliminar permanentemente el libro.');
        }
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedLibro.set(this.createEmptyLibro());
    this.isCreating.set(true);
  }

  onRestore(libro: Libro): void {
    if (!libro || !libro._id) return;

    this.isLoading.set(true);
    this.librosService
      .restoreLibro(libro._id, libro)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Libro restaurado con éxito');
          this.loadLibros(libro._id);
        },
        error: () => this.errorMessage.set('Error al restaurar el libro.')
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

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  private ensureValidPage(): void {
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }

    if (this.currentPage() < 1) {
      this.currentPage.set(1);
    }
  }

  private createEmptyLibro(): Libro {
    return {
      title: '',
      isbn: '',
      authors: [],
      IsDeleted: false,
    };
  }

  private mapLibroToFormValue(libro: Libro): Libro {
    return {
      _id: libro._id,
      title: libro.title ?? '',
      isbn: libro.isbn ?? '',
      authors: this.extractAuthorIds(libro.authors),
      IsDeleted: libro.IsDeleted ?? false,
      createdAt: libro.createdAt,
      updatedAt: libro.updatedAt,
    };
  }

  private buildCreateLibroPayload(libro: Libro): Libro {
    return {
      title: libro.title.trim(),
      isbn: (libro.isbn ?? '').trim(),
      authors: this.extractAuthorIds(libro.authors),
      IsDeleted: libro.IsDeleted ?? false,
    };
  }

  private buildUpdateLibroPayload(libro: Libro): Partial<Libro> {
    return {
      title: libro.title.trim(),
      isbn: (libro.isbn ?? '').trim(),
      authors: this.extractAuthorIds(libro.authors),
      IsDeleted: libro.IsDeleted ?? false,
    };
  }

  private extractAuthorIds(authors: Libro['authors']): string[] {
    if (!Array.isArray(authors)) {
      return [];
    }

    return authors
      .map((author) => (typeof author === 'string' ? author : author._id))
      .filter((authorId): authorId is string => !!authorId);
  }
}