import { Libro } from './libro.model';
export interface Usuario {
  _id: string;
  name: string;
  email: string;     
  password?: string;  // La contraseña es opcional para evitar exponerla al obtener el usuario
  libro: Libro [];
  createdAt?: string;
  updatedAt?: string;
}