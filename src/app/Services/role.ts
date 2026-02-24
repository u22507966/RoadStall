import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Role {
  
  private apiUrl = environment.apiUrl;


  constructor(private http: HttpClient) {}

  getUserRole(userId: number) {
    return this.http.get<string>(`${this.apiUrl}/api/Users/${userId}/role`);
  }

}
