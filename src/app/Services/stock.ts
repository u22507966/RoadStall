import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Stock } from '../Models/stock';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockService {

  private apiUrl = `${environment.apiUrl}/api/Stocks`;

  // private apiUrl = 'https://localhost:7224/api/Stocks';

  constructor(private http: HttpClient) { }

  getStock(): Observable<Stock[]> {
    // map backend JSON (likely using lowercase keys) to the Angular Stock interface (PascalCase)
    return this.http.get<any[]>(this.apiUrl);
  }

  getStockById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.apiUrl}/${id}`);
  }

  deleteStock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addStock(newStock: Stock): Observable<Stock> {
    return this.http.post<Stock>(this.apiUrl, newStock);
  }


}