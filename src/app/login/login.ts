import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../Models/user';
import { UserService } from '../Services/user-service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private userService: UserService, private cdr: ChangeDetectorRef) {
  
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onSubmit(){

    if(this.username.trim() === '' || this.password.trim() === ''){
      this.errorMessage = 'Username and password are required.';
      return;
    }

    const loginRequest = {
      username: this.username,
      password: this.password
    };

    this.userService.Login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.goToDashboard();
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = 'Invalid username or password';
        this.cdr.detectChanges();
      }
    });

    this.errorMessage = '';
  }

  onRegister() {


    
  }

}
