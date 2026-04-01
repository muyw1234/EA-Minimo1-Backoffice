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

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
})
export class UsuarioFormComponent implements OnInit, OnChanges {
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
  @Output() deletePermanent = new EventEmitter<Usuario>();
  @Output() cancel = new EventEmitter<void>();
  @Output() restoreUsuario = new EventEmitter<Usuario>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    name: ['', [Validators.maxLength(150)]],
    email: ['', [Validators.email, Validators.maxLength(200)]],
    password: ['', [Validators.maxLength(200)]],
    IsDeleted: [false],
    libros: this.fb.array<string>([]),
  });

  ngOnInit(): void {
    this.applyModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario']) {
      this.patchForm(this.usuario);
    }

    if (changes['isCreating']) {
      this.applyModeValidators();
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
    this.applyModeValidators();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

  onDeletePermanent(): void {
    const currentUsuario = this.buildCurrentUsuarioFromForm();

    if (!currentUsuario || !currentUsuario._id) {
      return;
    }

    if (confirm('¿Estás seguro de que quieres borrar este usuario definitivamente de la base de datos?')) {
      this.deletePermanent.emit(currentUsuario);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onRestore(event: MouseEvent, usuario: Usuario): void { 
    this.restoreUsuario.emit(usuario); 
  }

  trackByLibroId(index: number, libro: Libro): string | number {
    return libro._id ?? index;
  }

  private applyModeValidators(): void {
    if (this.isCreating) {
      this.nameControl.setValidators([Validators.required, Validators.maxLength(150)]);
      this.emailControl.setValidators([
        Validators.required,
        Validators.email,
        Validators.maxLength(200),
      ]);
      this.passwordControl.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(200),
      ]);
    } else {
      this.nameControl.setValidators([Validators.maxLength(150)]);
      this.emailControl.setValidators([Validators.email, Validators.maxLength(200)]);
      this.passwordControl.setValidators([Validators.minLength(6), Validators.maxLength(200)]);
    }

    this.nameControl.updateValueAndValidity({ emitEvent: false });
    this.emailControl.updateValueAndValidity({ emitEvent: false });
    this.passwordControl.updateValueAndValidity({ emitEvent: false });
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