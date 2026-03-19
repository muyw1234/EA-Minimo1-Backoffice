import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../services/usuario.service';
import { Usuario } from '../models/usuario.model';
import { Libro } from '../models/libro.model';
import { Organizacion } from '../models/organizacion.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';


@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-list.html',
  styleUrls: ['./usuario-list.css'],
})

export class UsuarioList implements OnInit {
  // Variable para almacenar la lista de usuarios y organizaciones
  usuarios: Usuario[] = [];
  organizaciones: Organizacion[] = [];
  // Variable para almacenar la lista de usuarios filtrados según el término de búsqueda
  usuariosFiltrados: Usuario[] = [];
  // Variable para hacer la busqueda
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  // Variable mostrar formulario de añadir nuevo usuario
  mostrarForm = false;
  // variable para añadir nuevo usuario o editar usuario existente
  usuarioForm!: FormGroup;
  //variable para saber si estamos editando o creando un nuevo usuario
  editando = false;
  //ID del usuario que se está editando (valor intruducido por cliente) (null si estamos creando un nuevo usuario)
  usuarioEditId: string | null = null;
  // Variable para limitar la longitud del nombre de usuarios, 
  // si el nombre es más largo se muestra "..." y se puede expandir para ver el nombre completo
  expanded: { [key: string]: boolean } = {};
  // Variable para mostrar todos los usuarios o solo un número limitado
  limite = 10;
  mostrarTodosUsuarios = false;
  //Paginar
  paginaActual = 1;
  itemsPorPagina = 10;

  // Constructor con inyección de dependencias para el servicio de usuarios, form builder, change detector y dialog
  constructor(private api: UsuarioService, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dialog: MatDialog) {
    this.usuarioForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      organizacion: ['', Validators.required],
    });
    this.searchControl = new FormControl('');
  }

  // Función para validar que las contraseñas son idénticas
  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    // Solo validamos si ambos campos tienen algo escrito
    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  //-------------------------------------------------Función: leer--------------------------------------
  ngOnInit(): void {
    this.load();
    this.loadOrganizaciones();
    
    this.searchControl.valueChanges.subscribe(value => {
      const term = value?.toLowerCase() ?? '';
      this.paginaActual = 1;
      this.usuariosFiltrados = this.usuarios.filter(org =>
        org.name.toLowerCase().includes(term)
      );
    });
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.api.getUsuarios().subscribe({
      next: (res) => {
        this.usuarios = res;
        this.usuariosFiltrados = [...this.usuarios];
        this.loading = false;
        this.usuarios.forEach(user => {
          this.mostrarLibros(user); 
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se han podido cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  //Función: trackBy para optimizar el ngFor
  trackById(_index: number, u: Usuario): string {
    return u._id;
  }

  //Función: obtener nombre de organización para mostrar en la tabla
 //organizacionLabel(u: Usuario): string {
    //const org = u.organizacion;
    //if (!org) return '-';
    //if (typeof org === 'string') return org; 
    //return (org as Organizacion).name ?? '-';
  //}

  
  //Función: cargar organizaciones para el select del formulario
  loadOrganizaciones(): void {
    this.api.getOrganizaciones().subscribe({
      next: (res) => {
        this.organizaciones = res;
        console.log('Organizaciones:', this.organizaciones);
      },
      error: (err) => console.error(err)
    });
  }

  //Función: mostrar más usuarios
  mostrarMas(): void {
  this.mostrarTodosUsuarios = true;
  } 
  
  //Función: expandir nombre entero si es demasiado largo
  toggleExpand(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  //Función: mostrar libros del usuario
  mostrarLibros(user: Usuario): void {
    this.api.getUsuarioLibros(user._id).subscribe({
      next: (librosRecibidos: Libro[]) => {
        user.libro = librosRecibidos;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando libros de ' + user.name, err)
    });
  } 

  //Función: mostrar resumen de los libros del usuario (solo los títulos, separados por comas)
  
//----------------------------Función: guardar (tanto para crear como para actualizar)-----------------------
  guardar(): void {
    
    if (this.usuarioForm.invalid) return;

    const { name, email, password, organizacion } = this.usuarioForm.value;

    if (this.editando && this.usuarioEditId) {
      // UPDATE: pasamos id, name, email, password, organizacion
      this.api.updateUsuario(this.usuarioEditId, name, email, password, organizacion)
        .subscribe({
          next: () => {
            this.resetForm();
            this.load();
          },
          error: (err) => {
            console.error(err);
            this.errorMsg = 'No se ha podido actualizar el usuario.';
          }
        });

    } else {
      // CREATE: pasamos name, email, password, organizacion
      this.api.createUsuario(name, email, password, organizacion)
        .subscribe({
          next: () => {
            this.resetForm();
            this.load();
          },
          error: (err) => {
            console.error(err);
            this.errorMsg = 'No se ha podido crear el usuario.';
          }
        });
    }
  }

  //Función: mostrar formulario de añadir nuevo usuario
  mostrarFormulario(): void {
    this.mostrarForm = true;
  }

  //Función: editar usuario (muestra el formulario con los datos cargados)
  editar(user: Usuario): void {
    this.mostrarForm = true;
    this.editando = true;
    this.usuarioEditId = user._id;

    this.usuarioForm.patchValue({
      name: user.name,
      //organizacion: typeof user.organizacion === 'string'
        //? user.organizacion
        //: (user.organizacion as Organizacion)?._id
    });
  }
  //Función: resetear formulario de añadir/editar usuario a su estado inicial
  resetForm(): void {
    this.mostrarForm = false;
    this.editando = false;
    this.usuarioEditId = null;
    this.usuarioForm.reset();
  }

//-------------------------------------------Función: eliminar usuario---------------------------
  delete(id: string): void {
    this.errorMsg = '';
    this.loading = true;
    
    this.api.deleteUsuario(id).subscribe({
      next: () => {
        this.load();
      },
      error: () => {
        this.errorMsg = 'Error delete';
        this.loading = false;
      }
    });
  }
  
  //Función: confirmar eliminación de usuario
  confirmDelete(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete(id);
      }
    });
  }

//-----------------------------Función: paginación-----------------------------

  TotalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina);
  }

  get usuariosVisibles(): Usuario[] {
    const inicioDePagina = (this.paginaActual - 1) * this.itemsPorPagina;
    const finDePagina = inicioDePagina + this.itemsPorPagina;
    return this.usuariosFiltrados.slice(inicioDePagina, finDePagina);
  }

  cambiarPagina(nuevapagina: number): void {
    if (nuevapagina < 1 || nuevapagina > this.TotalPaginas()) return;
    this.paginaActual = nuevapagina;
  }

}