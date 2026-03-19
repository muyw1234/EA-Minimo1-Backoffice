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

  getLibroById(id: string): Observable<Libro> {
    return this.http.get<Libro>(`${this.apiUrl}/${id}`);
  }

  createLibro(libro: Libro): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, libro);
  }

  updateLibro(id: string, libro: Libro): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${id}`, libro);
  }

  deleteLibro(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  restoreLibro(id: string): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${id}/restore`, {});
  }
}