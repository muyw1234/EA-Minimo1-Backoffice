import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Autor } from '../../../../Core/models/autor.model';

@Component({
  selector: 'app-autores-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autores-list.component.html',
  styleUrl: './autores-list.component.css',
})
export class AutoresListComponent {
  @Input() autores: Autor[] = [];
  @Input() selectedAutorId: string | null = null;
  @Input() isLoading = false;

  @Output() selectAutor = new EventEmitter<Autor>();
  @Output() createNew = new EventEmitter<void>();

  onSelect(autor: Autor): void {
    this.selectAutor.emit(autor);
  }

  onCreateNew(): void {
    this.createNew.emit();
  }

  trackByAutorId(index: number, autor: Autor): string | number {
    return autor._id ?? index;
  }

  getLibrosCount(autor: Autor): number {
    if (!autor.libros || !Array.isArray(autor.libros)) {
      return 0;
    }

    return autor.libros.length;
  }

  isSelected(autor: Autor): boolean {
    return !!autor._id && autor._id === this.selectedAutorId;
  }
}