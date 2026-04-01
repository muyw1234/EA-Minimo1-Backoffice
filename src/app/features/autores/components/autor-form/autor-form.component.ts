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
export class AutorFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() autor: Autor | null = null;
  @Input() isSaving = false;
  @Input() isDeleting = false;
  @Input() isCreating = true;
  @Input() errorMessage = '';
  @Input() successMessage = '';

  @Output() save = new EventEmitter<Autor>();
  @Output() delete = new EventEmitter<Autor>();
  @Output() deletePermanent = new EventEmitter<Autor>();
  @Output() cancel = new EventEmitter<void>();
  @Output() restoreAutor = new EventEmitter<Autor>();

  readonly form = this.fb.nonNullable.group({
    _id: [''],
    fullName: ['', [Validators.maxLength(200)]],
    IsDeleted: [false],
  });

  ngOnInit(): void {
    this.applyModeValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['autor']) {
      this.patchForm(this.autor);
    }

    if (changes['isCreating']) {
      this.applyModeValidators();
    }
  }

  get fullNameControl() {
    return this.form.controls.fullName;
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
    this.applyModeValidators();

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

  onDeletePermanent(): void {
    const currentAutor = this.buildCurrentAutorFromForm();

    if (!currentAutor || !currentAutor._id) {
      return;
    }

    if (confirm('¿Estás seguro de que quieres borrar este autor definitivamente de la base de datos?')) {
      this.deletePermanent.emit(currentAutor);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onRestore(event: Event, autor: Autor): void {
      event.stopPropagation();
      this.restoreAutor.emit(autor);
    }

  private applyModeValidators(): void {
    if (this.isCreating) {
      this.fullNameControl.setValidators([
        Validators.required,
        Validators.maxLength(200),
      ]);
    } else {
      this.fullNameControl.setValidators([Validators.maxLength(200)]);
    }

    this.fullNameControl.updateValueAndValidity({ emitEvent: false });
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