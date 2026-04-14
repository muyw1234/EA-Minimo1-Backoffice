export interface LibroRef {
  _id: string;
  title?: string;
}

export interface Historial {
    _id?: string;
    libro: string | LibroRef;
    accion: string;
    descripcion: string;
    fecha: Date;
}
