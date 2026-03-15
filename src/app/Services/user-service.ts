import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest } from '../Models/RegisterRequest';
import { EditUser } from '../Models/Dto/EditUser';

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  
  readonly apiUrl = `${environment.apiUrl}/api/Users`;
  readonly authUrl = `${environment.apiUrl}/api/Auth`;

  constructor(private http: HttpClient) {}

  Login(UserDTO: LoginRequest): Observable<LoginRequest>{
    return this.http.post<LoginRequest>(`${this.authUrl}/login`, UserDTO);
  } 

  Register(registerRequest: RegisterRequest): Observable<RegisterRequest>{
    return this.http.post<RegisterRequest>(`${this.authUrl}/register`, registerRequest);
  }

  getUserId(username: string): Observable<number>{
    return this.http.get<number>(`${this.apiUrl}/by-username/${username}`);
  }

  getUserById(id: number): Observable<any>{
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getUsers(): Observable<EditUser[]>{
    return this.http.get<EditUser[]>(`${this.apiUrl}`);
  }

  updateUserStatus(id: number, status: number): Observable<void>{
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, status);
  }

  updateUserRole(id: number, roleId: number): Observable<void>{
    return this.http.patch<void>(`${this.apiUrl}/${id}/role`, roleId);
  }
}
