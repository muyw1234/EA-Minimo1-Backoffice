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

import { Autor } from '../../../../Core/models/autor.model';

@Component({
  selector: 'app-autor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './autor-form.component.html',
  styleUrl: './autor-form.component.css',
})
export class AutorFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() autor: Autor | null = null;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = false;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Autor>();
  @Output() delete = new EventEmitter<Autor>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    biografia: ['', [Validators.maxLength(4000)]],
    nacionalidad: ['', [Validators.required, Validators.maxLength(100)]],
    fechaNacimiento: [''],
    libros: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['autor']) {
      this.patchForm(this.autor);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    const payload: Autor = {
      _id: rawValue._id || undefined,
      nombre: rawValue.nombre.trim(),
      biografia: rawValue.biografia.trim(),
      nacionalidad: rawValue.nacionalidad.trim(),
      fechaNacimiento: rawValue.fechaNacimiento,
      libros: this.parseLibros(rawValue.libros),
    };

    this.save.emit(payload);
  }

  onDelete(): void {
    if (!this.autor) {
      return;
    }

    this.delete.emit(this.autor);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get nombreControl() {
    return this.form.controls.nombre;
  }

  get biografiaControl() {
    return this.form.controls.biografia;
  }

  get nacionalidadControl() {
    return this.form.controls.nacionalidad;
  }

  get fechaNacimientoControl() {
    return this.form.controls.fechaNacimiento;
  }

  get librosControl() {
    return this.form.controls.libros;
  }

  get hasAutor(): boolean {
    return !!this.autor || this.isCreating;
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo autor' : 'Detalle del autor';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa la información para registrar un nuevo autor.'
      : 'Consulta y edita los datos del autor seleccionado.';
  }

  private patchForm(autor: Autor | null): void {
    if (!autor) {
      this.form.reset({
        _id: '',
        nombre: '',
        biografia: '',
        nacionalidad: '',
        fechaNacimiento: '',
        libros: '',
      });
      return;
    }

    this.form.reset({
      _id: autor._id ?? '',
      nombre: autor.nombre ?? '',
      biografia: autor.biografia ?? '',
      nacionalidad: autor.nacionalidad ?? '',
      fechaNacimiento: this.normalizeDate(autor.fechaNacimiento),
      libros: this.stringifyLibros(autor.libros),
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

  private stringifyLibros(libros: Autor['libros']): string {
    if (!Array.isArray(libros) || libros.length === 0) {
      return '';
    }

    return libros
      .map((libro) => (typeof libro === 'string' ? libro : libro._id))
      .filter(Boolean)
      .join(', ');
  }

  private parseLibros(value: string): string[] {
    if (!value.trim()) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}