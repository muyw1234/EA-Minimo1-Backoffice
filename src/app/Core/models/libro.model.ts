export interface Libro {
  _id?: string;
  isbn: string;
  title: string;
  authors?: string[] | AutorResumen[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface AutorResumen {
  _id: string;
  nombre: string;
}