export interface Autor {
  _id?: string;
  nombre: string;
  biografia: string;
  nacionalidad: string;
  fechaNacimiento: string;
  libros: string[] | LibroResumen[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LibroResumen {
  _id: string;
  titulo: string;
}