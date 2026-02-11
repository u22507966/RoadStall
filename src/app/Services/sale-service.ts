import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Sale } from '../Models/sale';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/api/Sales`;

  constructor(private http: HttpClient) {}

  getSales() {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  postSale(sale: Sale) {
    return this.http.post<Sale>(this.apiUrl, sale);
  }

  getUnitsSold(stockId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unitsSold/${stockId}`);
  }
  
}
