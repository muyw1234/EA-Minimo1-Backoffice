import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Libro } from '../../../../Core/models/libro.model';

@Component({
  selector: 'app-libros-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './libros-list.component.html',
  styleUrl: './libros-list.component.css',
})
export class LibrosListComponent {
  @Input() libros: Libro[] = [];
  @Input() selectedLibroId: string | null = null;
  @Input() isLoading = false;

  @Output() selectLibro = new EventEmitter<Libro>();
  @Output() createNew = new EventEmitter<void>();

  onSelect(libro: Libro): void {
    this.selectLibro.emit(libro);
  }

  onCreateNew(): void {
    this.createNew.emit();
  }

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  getAutorNombre(libro: Libro): string {
    if (!libro.autor) {
      return 'Sin autor';
    }

    if (typeof libro.autor === 'string') {
      return 'Autor asignado';
    }

    return libro.autor.nombre || 'Sin autor';
  }

  isSelected(libro: Libro): boolean {
    return !!libro._id && libro._id === this.selectedLibroId;
  }
}