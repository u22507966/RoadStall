import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Stock } from '../Models/stock';
import { StockTake } from '../Models/stock-take';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockTakeService {

  private apiUrl = `${environment.apiUrl}/api/StockTakes`;

  constructor(private http: HttpClient) { }

  getStockTake(): Observable<StockTake[]> {
    return this.http.get<StockTake[]>(this.apiUrl);
  }

  getStockTakeById(id: number): Observable<StockTake> {
    return this.http.get<StockTake>(`${this.apiUrl}/${id}`);
  }

  getStockTakeByStockId(stockId: number): Observable<StockTake> {
    return this.http.get<StockTake>(`${this.apiUrl}/ByStockId/${stockId}`);
  }

  updateStockTake(id: number, stockTake: StockTake): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put(url, stockTake);
  }

  createStockTake(stockTake: StockTake): Observable<any> {
    return this.http.post(this.apiUrl, stockTake);
  }

  getHistoryExportData(date: string): Observable<any> {
    const historyUrl = `${environment.apiUrl}/api/StockTakeHistory/export/${date}`;
    return this.http.get<any>(historyUrl);
  }
  
}
