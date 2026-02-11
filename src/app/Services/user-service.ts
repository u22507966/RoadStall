import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest } from '../Models/RegisterRequest';

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  
  readonly apiUrl = `${environment.apiUrl}/api/Auth`;

  constructor(private http: HttpClient) {}

  Login(UserDTO: LoginRequest): Observable<LoginRequest>{
    return this.http.post<LoginRequest>(`${this.apiUrl}/login`, UserDTO);
  } 

  Register(registerRequest: RegisterRequest): Observable<RegisterRequest>{
    return this.http.post<RegisterRequest>(`${this.apiUrl}/register`, registerRequest);
  }
}
