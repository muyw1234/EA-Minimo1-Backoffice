import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Usuario } from '../../../../Core/models/usuario.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
})
export class UsuariosListComponent {
  @Input() usuarios: Usuario[] = [];
  @Input() selectedUsuarioId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;

  @Output() selectUsuario = new EventEmitter<Usuario>();
  @Output() createNew = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() previousPage = new EventEmitter<void>();

  @Output() search = new EventEmitter<string>();
  @Output() deletePermanent = new EventEmitter<string>();
  searchUsuario = new FormControl('');
  destroy = new Subject<void>();

  ngOnInit(): void {
    this.searchUsuario.valueChanges.subscribe((value) => {
      this.search.emit(value ?? '');
    });
  }
  
  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  onSelect(usuario: Usuario): void {
    this.selectUsuario.emit(usuario);
  }

  onCreateNew(): void {
    this.createNew.emit();
  }

  onGoToPage(page: number): void {
    this.pageChange.emit(page);
  }

  onNextPage(): void {
    this.nextPage.emit();
  }

  onPreviousPage(): void {
    this.previousPage.emit();
  }

  onDeletePermanent(usuarioId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que quieres borrar este usuario definitivamente?')) {
      this.deletePermanent.emit(usuarioId);
    }
  }

  isSelected(usuario: Usuario): boolean {
    return !!usuario._id && usuario._id === this.selectedUsuarioId;
  }

  trackByUsuarioId(index: number, usuario: Usuario): string | number {
    return usuario._id ?? index;
  }

  getLibrosDisplay(usuario: Usuario): string {
    if (!Array.isArray(usuario.libros) || usuario.libros.length === 0) {
      return 'Sin libros';
    }

    return usuario.libros
      .map((libro) => {
        if (typeof libro === 'string') {
          return libro;
        }

        return libro.title || libro._id;
      })
      .join(', ');
  }

  getVisibleFields(usuario: Usuario): Array<{ label: string; value: string }> {
    return [
      {
        label: 'Nombre',
        value: usuario.name || '-',
      },
      {
        label: 'Email',
        value: usuario.email || '-',
      },
      {
        label: 'Password',
        value: usuario.password || '-',
      },
      {
        label: 'Libros',
        value: this.getLibrosDisplay(usuario),
      },
      {
        label: 'Estado',
        value: usuario.IsDeleted ? 'Eliminado' : 'Activo',
      },
      {
        label: 'ID',
        value: usuario._id || '-',
      },
    ];
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  get showingFrom(): number {
    if (this.totalItems === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }
}