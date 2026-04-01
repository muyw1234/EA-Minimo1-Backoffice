import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { Libro } from '../../../../Core/models/libro.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import { LibrosService } from '../../../../Core/services/libros.service';
import { UsuariosService } from '../../../../Core/services/usuarios.service';
import { UsuarioFormComponent } from '../../components/usuario-form/usuario-form.component';
import { UsuariosListComponent } from '../../components/usuarios-list/usuarios-list.component';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, UsuarioFormComponent, UsuariosListComponent],
  templateUrl: './usuarios-page.component.html',
  styleUrl: './usuarios-page.component.css',
})
export class UsuariosPageComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly librosService = inject(LibrosService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly libros = signal<Libro[]>([]);
  readonly selectedUsuario = signal<Usuario | null>(null);

  readonly isLoading = signal(false);
  readonly isLoadingLibros = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isCreating = signal(true);

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(5);

  readonly totalItems = computed(() => this.filteredUsuarios().length);

  readonly totalPages = computed(() => {
    const total = Math.ceil(this.totalItems() / this.pageSize());
    return total > 0 ? total : 1;
  });

  readonly paginatedUsuarios = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredUsuarios().slice(start, end);
  });

  readonly searchUsuario = signal('');
  readonly filteredUsuarios = computed(() => {
    const term = this.searchUsuario().toLowerCase().trim();
    const allUsuarios = this.usuarios();

    if (!term) {
      return allUsuarios;
    }
    return allUsuarios.filter((usuario) =>
      usuario.name?.toLowerCase().includes(term)
    );
  }); 

  onSearch(term: string): void {
    this.searchUsuario.set(term);
    this.currentPage.set(1);
  }


  ngOnInit(): void {
    this.loadLibros();
    this.loadUsuarios();
  }

  loadUsuarios(selectedUsuarioId?: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usuariosService
      .getAllUsuarios()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (usuarios) => {
          const safeUsuarios = Array.isArray(usuarios) ? usuarios : [];
          this.usuarios.set(safeUsuarios);

          this.ensureValidPage();

          if (selectedUsuarioId) {
            const usuarioRecienAfectado =
              safeUsuarios.find((usuario) => usuario._id === selectedUsuarioId) ?? null;

            this.selectedUsuario.set(
              usuarioRecienAfectado
                ? this.mapUsuarioToFormValue(usuarioRecienAfectado)
                : null
            );
            this.isCreating.set(false);
            return;
          }

          const selectedId = this.selectedUsuario()?._id;

          if (selectedId) {
            const refreshedSelectedUsuario =
              safeUsuarios.find((usuario) => usuario._id === selectedId) ?? null;

            this.selectedUsuario.set(
              refreshedSelectedUsuario
                ? this.mapUsuarioToFormValue(refreshedSelectedUsuario)
                : this.createEmptyUsuario()
            );

            if (!refreshedSelectedUsuario) {
              this.isCreating.set(true);
            }

            return;
          }

          this.selectedUsuario.set(this.createEmptyUsuario());
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
    this.selectedUsuario.set(this.createEmptyUsuario());
  }

  onSelectUsuario(usuario: Usuario): void {
    this.isCreating.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedUsuario.set(this.mapUsuarioToFormValue(usuario));
  }

  onSaveUsuario(usuarioData: Usuario): void {
    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.isCreating() || !usuarioData._id) {
      const createPayload = this.buildCreateUsuarioPayload(usuarioData);

      this.usuariosService
        .createUsuario(createPayload)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: (createdUsuario) => {
            this.isCreating.set(false);
            this.successMessage.set('Usuario creado correctamente.');

            if (createdUsuario._id) {
              this.loadUsuarios(createdUsuario._id);
            } else {
              this.loadUsuarios();
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

    const updatePayload = this.buildUpdateUsuarioPayload(usuarioData);

    this.usuariosService
      .updateUsuario(usuarioData._id, updatePayload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (updatedUsuario) => {
          this.isCreating.set(false);
          this.successMessage.set('Usuario actualizado correctamente.');

          if (updatedUsuario._id) {
            this.loadUsuarios(updatedUsuario._id);
          } else {
            this.loadUsuarios();
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

  onDeleteUsuario(usuario: Usuario): void {
    if (!usuario._id) {
      return;
    }

    const confirmed = window.confirm(
      `¿Seguro que quieres marcar como eliminado al usuario "${usuario.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usuariosService
      .updateUsuario(usuario._id, {
        IsDeleted: true,
      })
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario eliminado correctamente.');
          this.selectedUsuario.set(this.createEmptyUsuario());
          this.isCreating.set(true);
          this.loadUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.errorMessage.set(
            error?.error?.message ||
              error?.error?.details?.[0]?.message ||
              'No se pudo eliminar el usuario.'
          );
        },
      });
  }

  onDeletePermanent(usuarioId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.usuariosService
      .permanentDeleteUsuario(usuarioId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario eliminado permanentemente.');
          this.loadUsuarios();
        },
        error: (error) => {
          console.error('Error al eliminar permanentemente:', error);
          this.errorMessage.set('Error al eliminar permanentemente el usuario.');
        }
      });
  }

  onRestore(usuario: Usuario): void {
    if (!usuario || !usuario._id) return;

    this.isLoading.set(true);
    this.usuariosService
      .restoreUsuario(usuario._id, usuario)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Usuario restaurado con éxito');
          this.loadUsuarios(usuario._id); 
        },
        error: () => this.errorMessage.set('Error al restaurar el usuario.')
      });
  }

  onCancelEdit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedUsuario.set(this.createEmptyUsuario());
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

  trackByUsuarioId(index: number, usuario: Usuario): string | number {
    return usuario._id ?? index;
  }

  private ensureValidPage(): void {
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }

    if (this.currentPage() < 1) {
      this.currentPage.set(1);
    }
  }

  private createEmptyUsuario(): Usuario {
    return {
      name: '',
      email: '',
      password: '',
      libros: [],
      IsDeleted: false,
    };
  }

  private mapUsuarioToFormValue(usuario: Usuario): Usuario {
    return {
      _id: usuario._id,
      name: usuario.name ?? '',
      email: usuario.email ?? '',
      password: usuario.password ?? '',
      libros: this.extractLibroIds(usuario.libros),
      IsDeleted: usuario.IsDeleted ?? false,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
  }

  private buildCreateUsuarioPayload(usuario: Usuario): Usuario {
    return {
      name: usuario.name.trim(),
      email: usuario.email.trim(),
      password: usuario.password,
      libros: this.extractLibroIds(usuario.libros),
      IsDeleted: usuario.IsDeleted ?? false,
    };
  }

  private buildUpdateUsuarioPayload(usuario: Usuario): Partial<Usuario> {
    return {
      name: usuario.name.trim(),
      email: usuario.email.trim(),
      password: usuario.password,
      libros: this.extractLibroIds(usuario.libros),
      IsDeleted: usuario.IsDeleted ?? false,
    };
  }

  private extractLibroIds(libros: Usuario['libros']): string[] {
    if (!Array.isArray(libros)) {
      return [];
    }

    return libros
      .map((libro) => (typeof libro === 'string' ? libro : libro._id))
      .filter((libroId): libroId is string => !!libroId);
  }
}