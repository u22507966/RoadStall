import { Injectable } from '@angular/core';
import { StockChange } from '../Models/stock-change';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockChangeService {
  
  private apiUrl = `${environment.apiUrl}/api/StockChanges`;

  constructor(private http: HttpClient) { }

  GetStockChange(): Observable<StockChange[]> {
    return this.http.get<StockChange[]>(this.apiUrl);
  }

  PostStockChange(stockChange: StockChange): Observable<StockChange> {
    return this.http.post<StockChange>(this.apiUrl, stockChange);
  }

}
