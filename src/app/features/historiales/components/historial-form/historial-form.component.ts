import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Libro } from '../../../../Core/models/libro.model';
import { Usuario } from '../../../../Core/models/usuario.model';
import {Historial} from '../../../../Core/models/historial.model';
import { raw } from 'express';

@Component({
  selector: 'app-historial-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historial-form.component.html',
  styleUrl: './historial-form.component.css',
})
export class HistorialFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() historial: Historial | null = null;
  @Input() libros: Libro[] = [];
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() isLoadingLibros = false;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Historial>();
  @Output() delete = new EventEmitter<Historial>();
  @Output() deletePermanent = new EventEmitter<Historial>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    accion: ['', [Validators.email, Validators.maxLength(200)]],
    descripcion: ['', [Validators.maxLength(200)]],
    libro: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.applyModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['historial']) {
      this.patchForm(this.historial);
    }

    if (changes['isCreating']) {
      this.applyModeValidators();
    }
  }

  get accionControl() {
    return this.form.controls.accion;
  }

  get descripcionControl() {
    return this.form.controls.descripcion;
  }

  get libroControl() {
    return this.form.controls.libro;
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo historial' : 'Editar historial';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear un nuevo historial.'
      : 'Modifica los datos del historial seleccionado.';
  }

  isLibroSelected(libroId: string): boolean {
    return this.libroControl.value === libroId;  
  }

  onToggleLibro(libroId: string, checked: boolean): void {
    if (checked) {
      this.libroControl.setValue(libroId);
    } else {
      if (this.libroControl.value === libroId) {
        this.libroControl.setValue('');
      }
    }
    this.libroControl.markAsTouched();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    const payload: Historial = {
      _id: rawValue._id || undefined,
      libro: rawValue.libro, // Ya es un string único
      accion: rawValue.accion.trim(),
      descripcion: rawValue.descripcion,
      fecha: new Date(),
    };

    this.save.emit(payload);
  }

  onDelete(): void {
    const currentHistorial = this.buildCurrentHistorialFromForm();

    if (!currentHistorial || !currentHistorial._id) {
      return;
    }

    this.delete.emit(currentHistorial);
  }

  onDeletePermanent(): void {
    const currentHistorial = this.buildCurrentHistorialFromForm();

    if (!currentHistorial || !currentHistorial._id) {
      return;
    }

    if (confirm('¿Estás seguro de que quieres borrar este usuario definitivamente de la base de datos?')) {
      this.deletePermanent.emit(currentHistorial);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  private applyModeValidators(): void {
    if (this.isCreating) {
      this.accionControl.setValidators([Validators.required, Validators.maxLength(150)]);
      this.descripcionControl.setValidators([
        Validators.required,
        Validators.maxLength(200),
      ]);
    } else {
      this.accionControl.setValidators([Validators.maxLength(150)]);
      this.descripcionControl.setValidators( [Validators.maxLength(200)]);
    }

    this.accionControl.updateValueAndValidity({ emitEvent: false });
    this.descripcionControl.updateValueAndValidity({ emitEvent: false });
  }

  private patchForm(historial: Historial | null): void {
    const libroId = typeof historial?.libro === 'string' 
      ? historial.libro 
      : historial?.libro?._id ?? '';    
      
    this.form.reset({
      _id: historial?._id ?? '',
      accion: historial?.accion ?? '',
      descripcion: historial?.descripcion ?? '',
      libro: libroId,
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private extractLibroIds(): string[] {
    if (!Array.isArray(this.libros)) {
      return [];
    }

    return this.libros
      .map((libro) => (typeof libro === 'string' ? libro : libro._id))
      .filter((libroId): libroId is string => !!libroId);
  }

  private buildCurrentHistorialFromForm(): Historial | null {
    const rawValue = this.form.getRawValue();

    if (!rawValue._id && !rawValue.accion.trim() && !rawValue.descripcion.trim()) {
      return null;
    }

    return {
      _id: rawValue._id || undefined,
      accion: rawValue.accion.trim(),
      descripcion: rawValue.descripcion.trim(),
      libro: rawValue.libro,
      fecha: new Date()
    };
  }

  private getSafeLibroIds(values: Array<string | null | undefined>): string[] {
    return values.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    );
  }

}