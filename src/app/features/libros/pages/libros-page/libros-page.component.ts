import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { Libro } from '../../../../Core/models/libro.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import { LibroFormComponent } from '../../components/libro-form/libro-form.component';
import { LibrosListComponent } from '../../components/libros-list/libros-list.component';

@Component({
  selector: 'app-libros-page',
  standalone: true,
  imports: [CommonModule, LibrosListComponent, LibroFormComponent],
  templateUrl: './libros-page.component.html',
  styleUrl: './libros-page.component.css',
})
export class LibrosPageComponent implements OnInit {
  private readonly librosService = inject(LibrosService);

  libros: Libro[] = [];
  selectedLibro: Libro | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isCreating = false;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadLibros();
  }

  loadLibros(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.librosService
      .getLibros()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (libros) => {
          this.libros = libros ?? [];

          if (this.selectedLibro?._id) {
            const refreshedSelectedLibro = this.libros.find(
              (libro) => libro._id === this.selectedLibro?._id
            );

            this.selectedLibro = refreshedSelectedLibro ?? null;
          } else if (!this.isCreating && this.libros.length > 0) {
            this.selectedLibro = this.libros[0];
          }
        },
        error: (error) => {
          console.error('Error al cargar libros:', error);
          this.errorMessage = 'No se pudieron cargar los libros.';
        },
      });
  }

  onSelectLibro(libro: Libro): void {
    this.isCreating = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedLibro = { ...libro };
  }

  onCreateNew(): void {
    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedLibro = this.createEmptyLibro();
  }

  onCancelForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.libros.length > 0) {
      this.isCreating = false;
      this.selectedLibro = this.libros[0];
      return;
    }

    this.isCreating = false;
    this.selectedLibro = null;
  }

  onSaveLibro(libroData: Libro): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isCreating || !libroData._id) {
      const payload = this.buildLibroPayload(libroData);

      this.librosService
        .createLibro(payload)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe({
          next: (createdLibro) => {
            this.libros = [createdLibro, ...this.libros];
            this.selectedLibro = createdLibro;
            this.isCreating = false;
            this.successMessage = 'Libro creado correctamente.';
          },
          error: (error) => {
            console.error('Error al crear libro:', error);
            this.errorMessage = 'No se pudo crear el libro.';
          },
        });

      return;
    }

    const payload = this.buildLibroPayload(libroData);

    this.librosService
      .updateLibro(libroData._id, payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (updatedLibro) => {
          this.libros = this.libros.map((libro) =>
            libro._id === updatedLibro._id ? updatedLibro : libro
          );
          this.selectedLibro = updatedLibro;
          this.isCreating = false;
          this.successMessage = 'Libro actualizado correctamente.';
        },
        error: (error) => {
          console.error('Error al actualizar libro:', error);
          this.errorMessage = 'No se pudo actualizar el libro.';
        },
      });
  }

  onDeleteLibro(libro: Libro): void {
    if (!libro._id || this.isCreating) {
      this.selectedLibro = null;
      this.isCreating = false;
      this.successMessage = '';
      this.errorMessage = '';
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres borrar el libro "${libro.titulo}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.librosService
      .deleteLibro(libro._id)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.libros = this.libros.filter((item) => item._id !== libro._id);

          if (this.libros.length > 0) {
            this.selectedLibro = this.libros[0];
          } else {
            this.selectedLibro = null;
          }

          this.isCreating = false;
          this.successMessage = 'Libro eliminado correctamente.';
        },
        error: (error) => {
          console.error('Error al eliminar libro:', error);
          this.errorMessage = 'No se pudo eliminar el libro.';
        },
      });
  }

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  private createEmptyLibro(): Libro {
    return {
      titulo: '',
      descripcion: '',
      fechaPublicacion: '',
      genero: '',
      isbn: '',
      autor: null,
    };
  }

  private buildLibroPayload(libro: Libro): Libro {
    return {
      titulo: libro.titulo?.trim() ?? '',
      descripcion: libro.descripcion?.trim() ?? '',
      fechaPublicacion: libro.fechaPublicacion ?? '',
      genero: libro.genero?.trim() ?? '',
      isbn: libro.isbn?.trim() ?? '',
      autor: libro.autor ?? null,
    };
  }
}