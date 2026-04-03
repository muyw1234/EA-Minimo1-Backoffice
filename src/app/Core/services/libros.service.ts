import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Libro } from '../models/libro.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LibrosService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/libros';
  
  getLibros(): Observable<Libro[]> {
    return this.http.get<Libro[]>(this.apiUrl);
  }

  getAllLibros(): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${this.apiUrl}/all`);
  }

  getLibroById(libroId: string): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/${libroId}`);
  }

  createLibro(libro: Libro): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, libro);
  }

  updateLibro(libroId: string, libro: Partial<Libro>): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${libroId}`, libro);
  }

  softDeleteLibro(libroId: string, libroActual: Libro): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${libroId}`, {
      ...libroActual,
      IsDeleted: true,
    });
  }

  restoreLibro(libroId: string, libroActual: Libro): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/restore/${libroId}`, {
      ...libroActual,
      IsDeleted: false,
    });
  }

  deleteLibro(libroId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${libroId}`);
  }
  
    createLibroByIsbn(isbn: string) : Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/isbn/${isbn}`);
  }
}