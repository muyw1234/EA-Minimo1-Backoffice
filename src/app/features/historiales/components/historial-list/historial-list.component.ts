import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Historial } from '../../../../Core/models/historial.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-historial-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historial-list.component.html',
  styleUrl: './historial-list.component.css',
})
export class HistorialListComponent {
  @Input() historiales: Historial[] = [];
  @Input() selectedHistorialId: string | null = null;
  @Input() isLoading = false;
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 8;

  @Output() selectHistorial = new EventEmitter<Historial>();
  @Output() createNew = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() previousPage = new EventEmitter<void>();

  @Output() search = new EventEmitter<string>();
  @Output() deletePermanent = new EventEmitter<string>();
  searchHistorial = new FormControl('');
  destroy = new Subject<void>();

  ngOnInit(): void {
    this.searchHistorial.valueChanges.subscribe((value) => {
      this.search.emit(value ?? '');
    });
  }
  
  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  onSelect(historial: Historial): void {
    this.selectHistorial.emit(historial);
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

  onDeletePermanent(historialId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que quieres borrar este historial definitivamente?')) {
      this.deletePermanent.emit(historialId);
    }
  }

  isSelected(historial: Historial): boolean {
    return !!historial._id && historial._id === this.selectedHistorialId;
  }

  trackByHistorialId(index: number, historial: Historial): string | number {
    return historial._id ?? index;
  }

 getLibrosDisplay(historial: Historial): string {


  if (!historial || !historial.libro) {
    return 'Sin libro asignado';
  }

  if (typeof historial.libro === 'string') {
    return historial.libro || 'ID no disponible';
  }

  const titulo = historial.libro?.title;
  const id = historial.libro?._id;

  return titulo || id || 'Detalles no disponibles';
}

  getVisibleFields(historial: Historial): Array<{ label: string; value: string }> {
    return [
      {
        label: 'Accion',
        value: historial.accion || '-',
      },
      {
        label: 'Descripcion',
        value: historial.descripcion || '-',
      },
      {
        label: 'Libro',
        value: this.getLibrosDisplay(historial),
      },
      {
        label: 'id',
        value: historial._id || '-',
      },
      {
        label: 'Fecha',
        value: historial.fecha ? new Date(historial.fecha).toLocaleDateString() : '-',
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