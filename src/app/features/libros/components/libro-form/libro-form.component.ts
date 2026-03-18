import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Libro } from '../../../../Core/models/libro.model';

@Component({
  selector: 'app-libro-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './libro-form.component.html',
  styleUrl: './libro-form.component.css',
})
export class LibroFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() libro: Libro | null = null;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = false;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Libro>();
  @Output() delete = new EventEmitter<Libro>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', [Validators.maxLength(2000)]],
    fechaPublicacion: [''],
    genero: ['', [Validators.required, Validators.maxLength(100)]],
    isbn: ['', [Validators.required, Validators.maxLength(50)]],
    autor: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['libro']) {
      this.patchForm(this.libro);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    const payload: Libro = {
      _id: rawValue._id || undefined,
      titulo: rawValue.titulo.trim(),
      descripcion: rawValue.descripcion.trim(),
      fechaPublicacion: rawValue.fechaPublicacion,
      genero: rawValue.genero.trim(),
      isbn: rawValue.isbn.trim(),
      autor: rawValue.autor.trim() || null,
    };

    this.save.emit(payload);
  }

  onDelete(): void {
    if (!this.libro) {
      return;
    }

    this.delete.emit(this.libro);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get titleControl() {
    return this.form.controls.titulo;
  }

  get descripcionControl() {
    return this.form.controls.descripcion;
  }

  get fechaPublicacionControl() {
    return this.form.controls.fechaPublicacion;
  }

  get generoControl() {
    return this.form.controls.genero;
  }

  get isbnControl() {
    return this.form.controls.isbn;
  }

  get autorControl() {
    return this.form.controls.autor;
  }

  get hasLibro(): boolean {
    return !!this.libro || this.isCreating;
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo libro' : 'Detalle del libro';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa la información para registrar un nuevo libro.'
      : 'Consulta y edita los datos del libro seleccionado.';
  }

  private patchForm(libro: Libro | null): void {
    if (!libro) {
      this.form.reset({
        _id: '',
        titulo: '',
        descripcion: '',
        fechaPublicacion: '',
        genero: '',
        isbn: '',
        autor: '',
      });
      return;
    }

    let autorValue = '';

    if (typeof libro.autor === 'string') {
      autorValue = libro.autor;
    } else if (libro.autor && typeof libro.autor === 'object') {
      autorValue = libro.autor._id;
    }

    this.form.reset({
      _id: libro._id ?? '',
      titulo: libro.titulo ?? '',
      descripcion: libro.descripcion ?? '',
      fechaPublicacion: this.normalizeDate(libro.fechaPublicacion),
      genero: libro.genero ?? '',
      isbn: libro.isbn ?? '',
      autor: autorValue,
    });
  }

  private normalizeDate(value: string | undefined): string {
    if (!value) {
      return '';
    }

    if (value.includes('T')) {
      return value.split('T')[0];
    }

    return value;
  }
}