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
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;

  @Output() selectAutor = new EventEmitter<Autor>();
  @Output() createNew = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() previousPage = new EventEmitter<void>();

  onSelect(autor: Autor): void {
    this.selectAutor.emit(autor);
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

  isSelected(autor: Autor): boolean {
    return !!autor._id && autor._id === this.selectedAutorId;
  }

  trackByAutorId(index: number, autor: Autor): string | number {
    return autor._id ?? index;
  }

  getVisibleFields(autor: Autor): Array<{ label: string; value: string }> {
    return [
      {
        label: 'Nombre completo',
        value: autor.fullName || '-',
      },
      {
        label: 'Estado',
        value: autor.IsDeleted ? 'Eliminado' : 'Activo',
      },
      {
        label: 'ID',
        value: autor._id || '-',
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