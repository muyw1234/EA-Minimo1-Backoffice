import {Libreria} from "./libreria.model";
import {Usuario} from "./usuario.model";

export interface Libro {
    title: string;
        author: string;
        description: string;
        price: number;
        type: 'VENTA' | 'ALQUILER';
        owner: Usuario | string;
        libreria?: Libreria | string;
        IsDeleted?: boolean;
}