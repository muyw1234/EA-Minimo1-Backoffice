import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'libros',
  },
  {
    path: 'libros',
    loadComponent: () =>
      import('./features/libros/pages/libros-page/libros-page.component').then(
        (m) => m.LibrosPageComponent
      ),
    title: 'BackOffice - Libros',
  },
  {
    path: 'autores',
    loadComponent: () =>
      import('./features/autores/pages/autores-page/autores-page.component').then(
        (m) => m.AutoresPageComponent
      ),
    title: 'BackOffice - Autores',
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./features/usuarios/pages/usuarios-page/usuarios-page.component').then(
        (m) => m.UsuariosPageComponent
      ),
    title: 'BackOffice - Usuarios',
  },
  {
    path: 'historiales',
    loadComponent: () =>
      import('./features/historiales/pages/historiales-page/historial-page.component').then(
        (m) => m.HistorialPageComponent
      ),
    title: 'BackOffice - Autores',
  },
  {
    path: '**',
    redirectTo: 'libros',
  },
];