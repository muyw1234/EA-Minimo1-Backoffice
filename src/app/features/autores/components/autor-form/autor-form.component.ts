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
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Autor>();
  @Output() delete = new EventEmitter<Autor>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    IsDeleted: [false],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['autor']) {
      this.patchForm(this.autor);
    }
  }

  get fullNameControl() {
    return this.form.controls.fullName;
  }

  get hasAutor(): boolean {
    return !!this.autor;
  }

  get formTitle(): string {
    return this.isCreating ? 'Nuevo autor' : 'Editar autor';
  }

  get formSubtitle(): string {
    return this.isCreating
      ? 'Completa los datos para crear un nuevo autor.'
      : 'Modifica los datos del autor seleccionado.';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    const payload: Autor = {
      _id: rawValue._id || undefined,
      fullName: rawValue.fullName.trim(),
      IsDeleted: rawValue.IsDeleted ?? false,
    };

    this.save.emit(payload);
  }

  onDelete(): void {
    const currentAutor = this.buildCurrentAutorFromForm();

    if (!currentAutor || !currentAutor._id) {
      return;
    }

    this.delete.emit(currentAutor);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private patchForm(autor: Autor | null): void {
    this.form.reset({
      _id: autor?._id ?? '',
      fullName: autor?.fullName ?? '',
      IsDeleted: autor?.IsDeleted ?? false,
    });

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  private buildCurrentAutorFromForm(): Autor | null {
    const rawValue = this.form.getRawValue();

    if (!rawValue._id && !rawValue.fullName.trim()) {
      return null;
    }

    return {
      _id: rawValue._id || undefined,
      fullName: rawValue.fullName.trim(),
      IsDeleted: rawValue.IsDeleted ?? false,
    };
  }
}