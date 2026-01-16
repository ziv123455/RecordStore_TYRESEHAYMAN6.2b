import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface RecordItem {
  id: number;
  title: string;
  artist: string;
  genre: string;
  format: string;
  releaseYear: number;
  price: number;
  stockQty: number;

  customerId?: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerContact?: string;
  customerEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class RecordsService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<RecordItem[]> {
    return this.http.get<RecordItem[]>(`${environment.apiUrl}/records`);
  }

  getById(id: number): Observable<RecordItem> {
    return this.http.get<RecordItem>(`${environment.apiUrl}/records/${id}`);
  }

  create(record: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/records`, record);
  }

  update(id: number, record: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/records/${id}`, record);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/records/${id}`);
  }

  // ✅ required by assignment: dropdown data from API
  getFormats(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/formats`);
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/genres`);
  }
}
