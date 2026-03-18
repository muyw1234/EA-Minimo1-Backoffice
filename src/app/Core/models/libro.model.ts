export interface Libro {
  _id?: string;
  titulo: string;
  descripcion: string;
  fechaPublicacion: string;
  genero: string;
  isbn: string;
  autor?: string | AutorResumen | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AutorResumen {
  _id: string;
  nombre: string;
}