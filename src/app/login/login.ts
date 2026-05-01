import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../Models/user';
import { UserService } from '../Services/user-service';
import { Role } from '../Services/role';
import { ChangeDetectorRef } from '@angular/core';
import { RegisterRequest } from '../Models/RegisterRequest';
import { register } from 'module';
import { error } from 'console';
import { HttpErrorResponse } from '@angular/common/http';

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
  successMessage: string = '';

  constructor(private router: Router, private userService: UserService, private cdr: ChangeDetectorRef, private roleService: Role) {

  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  onSubmit() {

    if (this.username.trim() === '' || this.password.trim() === '') {
      this.errorMessage = 'Username and password are required.';
      return;
    }

    this.successMessage = 'Please Wait... Initial Login May Take Up To 20 Seconds';

    localStorage.setItem('username', this.username);
    this.userService.getUserId(this.username).subscribe({
      next: (userId) => {
        localStorage.setItem('userId', userId.toString());

        //Get user role quick before login happens and store in localstorage
        this.roleService.getUserRole(userId).subscribe({
          next: (role) => {
            localStorage.setItem('roleId', role);
          }
        });

        const loginRequest = {
          username: this.username,
          password: this.password
        };

        this.userService.Login(loginRequest).subscribe({
          next: (response) => {
            console.log('Login successful:', response);
            this.goToDashboard();
          },
          error: (error: HttpErrorResponse) => {
            this.successMessage = '';
            if (error.status === 401 || error.status === 400) {
              this.errorMessage = error.error?.message || 'Invalid username or password';
            }
            else{
              this.errorMessage = 'An unexpected error occurred. Contact Administrator';
            }
            this.cdr.detectChanges();
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching user ID:', error);
        this.successMessage = '';
        this.errorMessage = 'Invalid username or password';
        this.cdr.detectChanges();
      }
    });



    this.errorMessage = '';
  }

  onRegister() {

    if (this.username.trim() === '' || this.password.trim() === '') {
      this.errorMessage = 'Username and password are required.';
      return;
    }

    const registerRequest: RegisterRequest = {
      username: this.username,
      password: this.password
    };

    this.userService.Register(registerRequest).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.successMessage = 'Registration successful. Wait for authorization before logging in.';
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400) {
          // BadRequest - your custom message
          this.errorMessage = error.error.message; // "Username or email already exists"
        } else if (error.status === 500) {
          // Server error
          this.errorMessage = error.error.message || 'Registration failed';
        } else {
          this.errorMessage = 'An unexpected error occurred';
        }
        this.cdr.detectChanges();
      }
    });

    setTimeout(() => {
      this.errorMessage = '';
      this.successMessage = '';
    }, 3000);

    this.cdr.detectChanges();

  }

}
