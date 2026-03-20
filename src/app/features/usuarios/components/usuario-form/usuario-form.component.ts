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
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Libro } from '../../../../Core/models/libro.model';
import { Usuario } from '../../../../Core/models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
})
export class UsuarioFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() usuario: Usuario | null = null;
  @Input() libros: Libro[] = [];
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() isLoadingLibros = false;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Usuario>();
  @Output() delete = new EventEmitter<Usuario>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    password: ['', [Validators.required, Validators.maxLength(200)]],
    IsDeleted: [false],
    libros: this.fb.array<string>([], [Validators.required, Validators.minLength(1)]),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario']) {
      this.patchForm(this.usuario);
    }
  }

  get nameControl() {
    return this.form.controls.name;
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }

  get librosControl(): FormArray {
    return this.form.controls.libros;
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo usuario' : 'Editar usuario';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear un nuevo usuario.'
      : 'Modifica los datos del usuario seleccionado.';
  }

  isLibroSelected(libroId: string): boolean {
    return this.librosArrayValues.includes(libroId);
  }

  onToggleLibro(libroId: string, checked: boolean): void {
    if (checked) {
      if (!this.isLibroSelected(libroId)) {
        this.librosControl.push(this.fb.control(libroId, { nonNullable: true }));
      }
    } else {
      const index = this.librosArrayValues.findIndex((id) => id === libroId);

      if (index >= 0) {
        this.librosControl.removeAt(index);
      }
    }

    this.librosControl.markAsTouched();
    this.librosControl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.librosControl.markAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    const libroIds = this.getSafeLibroIds(rawValue.libros);

    const payload: Usuario = {
      _id: rawValue._id || undefined,
      name: rawValue.name.trim(),
      email: rawValue.email.trim(),
      password: rawValue.password,
      libros: libroIds,
      IsDeleted: rawValue.IsDeleted ?? false,
    };

    this.save.emit(payload);
  }

  onDelete(): void {
    const currentUsuario = this.buildCurrentUsuarioFromForm();

    if (!currentUsuario || !currentUsuario._id) {
      return;
    }

    this.delete.emit(currentUsuario);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  private patchForm(usuario: Usuario | null): void {
    const libroIds = this.extractLibroIds(usuario?.libros);

    this.form.reset({
      _id: usuario?._id ?? '',
      name: usuario?.name ?? '',
      email: usuario?.email ?? '',
      password: usuario?.password ?? '',
      IsDeleted: usuario?.IsDeleted ?? false,
      libros: [],
    });

    this.librosControl.clear();

    libroIds.forEach((libroId) => {
      this.librosControl.push(this.fb.control(libroId, { nonNullable: true }));
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.librosControl.updateValueAndValidity();
  }

  private extractLibroIds(libros: Usuario['libros'] | undefined): string[] {
    if (!Array.isArray(libros)) {
      return [];
    }

    return libros
      .map((libro) => (typeof libro === 'string' ? libro : libro._id))
      .filter((libroId): libroId is string => !!libroId);
  }

  private buildCurrentUsuarioFromForm(): Usuario | null {
    const rawValue = this.form.getRawValue();
    const libroIds = this.getSafeLibroIds(rawValue.libros);

    if (!rawValue._id && !rawValue.name.trim() && !rawValue.email.trim()) {
      return null;
    }

    return {
      _id: rawValue._id || undefined,
      name: rawValue.name.trim(),
      email: rawValue.email.trim(),
      password: rawValue.password,
      libros: libroIds,
      IsDeleted: rawValue.IsDeleted ?? false,
    };
  }

  private getSafeLibroIds(values: Array<string | null | undefined>): string[] {
    return values.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    );
  }

  private get librosArrayValues(): string[] {
    return this.librosControl.getRawValue() as string[];
  }
}