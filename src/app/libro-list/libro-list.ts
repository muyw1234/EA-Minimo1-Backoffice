import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { LibroService } from '../services/libro.service';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-libro-list',
  imports: [],
  templateUrl: './libro-list.html',
  styleUrl: './libro-list.css',
})
export class LibroList {

  searchControl = new FormControl('');

  constructor(private api: LibroService, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dialog: MatDialog) {
    this.searchControl = new FormControl('');
  }
  
}