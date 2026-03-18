import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { Autor } from '../../../../Core/models/autor.model';
import { AutoresService } from '../../../../Core/services/autores.service';
import { AutorFormComponent } from '../../components/autor-form/autor-form.component';
import { AutoresListComponent } from '../../components/autores-list/autores-list.component';

@Component({
  selector: 'app-autores-page',
  standalone: true,
  imports: [CommonModule, AutoresListComponent, AutorFormComponent],
  templateUrl: './autores-page.component.html',
  styleUrl: './autores-page.component.css',
})
export class AutoresPageComponent implements OnInit {
  private readonly autoresService = inject(AutoresService);

  autores: Autor[] = [];
  selectedAutor: Autor | null = null;

  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isCreating = false;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadAutores();
  }

  loadAutores(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.autoresService
      .getAutores()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (autores) => {
          this.autores = autores ?? [];

          if (this.selectedAutor?._id) {
            const refreshedSelectedAutor = this.autores.find(
              (autor) => autor._id === this.selectedAutor?._id
            );

            this.selectedAutor = refreshedSelectedAutor ?? null;
          } else if (!this.isCreating && this.autores.length > 0) {
            this.selectedAutor = this.autores[0];
          }
        },
        error: (error) => {
          console.error('Error al cargar autores:', error);
          this.errorMessage = 'No se pudieron cargar los autores.';
        },
      });
  }

  onSelectAutor(autor: Autor): void {
    this.isCreating = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedAutor = { ...autor };
  }

  onCreateNew(): void {
    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedAutor = this.createEmptyAutor();
  }

  onCancelForm(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.autores.length > 0) {
      this.isCreating = false;
      this.selectedAutor = this.autores[0];
      return;
    }

    this.isCreating = false;
    this.selectedAutor = null;
  }

  onSaveAutor(autorData: Autor): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isCreating || !autorData._id) {
      const payload = this.buildAutorPayload(autorData);

      this.autoresService
        .createAutor(payload)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe({
          next: (createdAutor) => {
            this.autores = [createdAutor, ...this.autores];
            this.selectedAutor = createdAutor;
            this.isCreating = false;
            this.successMessage = 'Autor creado correctamente.';
          },
          error: (error) => {
            console.error('Error al crear autor:', error);
            this.errorMessage = 'No se pudo crear el autor.';
          },
        });

      return;
    }

    const payload = this.buildAutorPayload(autorData);

    this.autoresService
      .updateAutor(autorData._id, payload)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (updatedAutor) => {
          this.autores = this.autores.map((autor) =>
            autor._id === updatedAutor._id ? updatedAutor : autor
          );
          this.selectedAutor = updatedAutor;
          this.isCreating = false;
          this.successMessage = 'Autor actualizado correctamente.';
        },
        error: (error) => {
          console.error('Error al actualizar autor:', error);
          this.errorMessage = 'No se pudo actualizar el autor.';
        },
      });
  }

  onDeleteAutor(autor: Autor): void {
    if (!autor._id || this.isCreating) {
      this.selectedAutor = null;
      this.isCreating = false;
      this.successMessage = '';
      this.errorMessage = '';
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres borrar al autor "${autor.nombre}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.autoresService
      .deleteAutor(autor._id)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: () => {
          this.autores = this.autores.filter((item) => item._id !== autor._id);

          if (this.autores.length > 0) {
            this.selectedAutor = this.autores[0];
          } else {
            this.selectedAutor = null;
          }

          this.isCreating = false;
          this.successMessage = 'Autor eliminado correctamente.';
        },
        error: (error) => {
          console.error('Error al eliminar autor:', error);
          this.errorMessage = 'No se pudo eliminar el autor.';
        },
      });
  }

  trackByAutorId(index: number, autor: Autor): string | number {
    return autor._id ?? index;
  }

  private createEmptyAutor(): Autor {
    return {
      nombre: '',
      biografia: '',
      nacionalidad: '',
      fechaNacimiento: '',
      libros: [],
    };
  }

  private buildAutorPayload(autor: Autor): Autor {
    return {
      nombre: autor.nombre?.trim() ?? '',
      biografia: autor.biografia?.trim() ?? '',
      nacionalidad: autor.nacionalidad?.trim() ?? '',
      fechaNacimiento: autor.fechaNacimiento ?? '',
      libros: autor.libros ?? [],
    };
  }
}