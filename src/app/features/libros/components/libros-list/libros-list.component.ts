import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Libro } from '../../../../Core/models/libro.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-libros-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './libros-list.component.html',
  styleUrl: './libros-list.component.css',
})
export class LibrosListComponent {
  @Input() libros: Libro[] = [];
  @Input() selectedLibroId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;

  @Output() selectLibro = new EventEmitter<Libro>();
  @Output() createNew = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() previousPage = new EventEmitter<void>();
  
  @Output() search = new EventEmitter<string>();
  @Output() deletePermanent = new EventEmitter<string>();
  searchBook = new FormControl('');
  private destroy = new Subject<void>();

  ngOnInit(): void {
    this.searchBook.valueChanges.subscribe((value) => {
      this.search.emit(value ?? '');
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  onSelect(libro: Libro): void {
    this.selectLibro.emit(libro);
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

  onDeletePermanent(libroId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que quieres borrar este libro definitivamente?')) {
      this.deletePermanent.emit(libroId);
    }
  }

  isSelected(libro: Libro): boolean {
    return !!libro._id && libro._id === this.selectedLibroId;
  }

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  getAuthorsDisplay(libro: Libro): string {
    if (!Array.isArray(libro.authors) || libro.authors.length === 0) {
      return 'Sin autores';
    }

    return libro.authors
      .map((author) => {
        if (typeof author === 'string') {
          return author;
        }

        return author.fullName || author._id;
      })
      .join(', ');
  }

  getVisibleFields(libro: Libro): Array<{ label: string; value: string }> {
    return [
      {
        label: 'Título',
        value: libro.title || '-',
      },
      {
        label: 'ISBN',
        value: libro.isbn || '-',
      },
      {
        label: 'Autores',
        value: this.getAuthorsDisplay(libro),
      },
      {
        label: 'Estado',
        value: libro.IsDeleted ? 'Eliminado' : 'Activo',
      },
      {
        label: 'ID',
        value: libro._id || '-',
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