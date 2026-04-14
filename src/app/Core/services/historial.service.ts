import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Historial } from '../models/historial.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HistorialService {
    private readonly http = inject(HttpClient);
    
    private readonly apiUrl = environment.apiUrl + '/Historial';

      getAllHistorial(): Observable<Historial[]> {
        return this.http.get<Historial[]>(`${this.apiUrl}/all`);
      }
    
      getHistorialById(historialId: string): Observable<Historial> {
        return this.http.get<Historial>(`${this.apiUrl}/${historialId}`);
      }
    
      createHistorial(historial: Historial): Observable<Historial> {
        return this.http.post<Historial>(this.apiUrl, historial);
      }
    
      updateHistorial(historialId: string, historial: Partial<Historial>): Observable<Historial> {
        return this.http.put<Historial>(`${this.apiUrl}/${historialId}`, historial);
      }
    
      permanentDeleteHistorial(historialId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${historialId}`);
      }
}