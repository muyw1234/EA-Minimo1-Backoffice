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
    isbn: ['', [Validators.required, Validators.maxLength(50)]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    authors: [''],
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
    const authors = this.parseAuthors(rawValue.authors);

    const hasInvalidAuthors = authors.some((authorId) => !this.isValidObjectId(authorId));

    if (hasInvalidAuthors) {
      this.form.controls.authors.setErrors({ invalidObjectId: true });
      this.form.controls.authors.markAsTouched();
      return;
    }

    const payload: Libro = {
      _id: rawValue._id || undefined,
      isbn: rawValue.isbn.trim(),
      title: rawValue.title.trim(),
      authors: this.parseAuthors(rawValue.authors),
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

  get isbnControl() {
    return this.form.controls.isbn;
  }

  get titleControl() {
    return this.form.controls.title;
  }

  get authorsControl() {
    return this.form.controls.authors;
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
        isbn: '',
        title: '',
        authors: '',
      });
      return;
    }

    this.form.reset({
      _id: libro._id ?? '',
      isbn: libro.isbn ?? '',
      title: libro.title ?? '',
      authors: this.stringifyAuthors(libro.authors),
    });
  }

  private stringifyAuthors(authors: Libro['authors']): string {
    if (!Array.isArray(authors) || authors.length === 0) {
      return '';
    }

    return authors
      .map((author) => (typeof author === 'string' ? author : author._id))
      .filter(Boolean)
      .join(', ');
  }

  private parseAuthors(value: string): string[] {
    if (!value.trim()) {
      return [];
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private isValidObjectId(value: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(value);
  }

}