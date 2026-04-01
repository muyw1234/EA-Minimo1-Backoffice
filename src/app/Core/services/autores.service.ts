import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Autor } from '../models/autor.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AutoresService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl + '/autores';

  getAutores(): Observable<Autor[]> {
    return this.http.get<Autor[]>(this.apiUrl);
  }

  getAllAutores(): Observable<Autor[]> {
    return this.http.get<Autor[]>(`${this.apiUrl}/all`);
  }

  getAutorById(autorId: string): Observable<Autor> {
    return this.http.get<Autor>(`${this.apiUrl}/${autorId}`);
  }

  createAutor(autor: Autor): Observable<Autor> {
    return this.http.post<Autor>(this.apiUrl, autor);
  }

  updateAutor(autorId: string, autor: Partial<Autor>): Observable<Autor> {
    return this.http.put<Autor>(`${this.apiUrl}/${autorId}`, autor);
  }

  softDeleteAutor(autorId: string, autorActual: Autor): Observable<Autor> {
    return this.http.put<Autor>(`${this.apiUrl}/${autorId}`, {
      ...autorActual,
      IsDeleted: true,
    });
  }

  restoreAutor(autorId: string, autorActual: Autor): Observable<Autor> {
    return this.http.put<Autor>(`${this.apiUrl}/restore/${autorId}`, {
      ...autorActual,
      IsDeleted: false,
    });
  }

  deleteAutor(autorId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${autorId}`);
  }
}