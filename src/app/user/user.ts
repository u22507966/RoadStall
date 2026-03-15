import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OnInit } from '@angular/core';
import { EditUser } from '../Models/Dto/EditUser';
import { UserService } from '../Services/user-service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-user',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './user.html',
  styleUrl: './user.css',
})

export class User implements OnInit{

  Users: EditUser[] = [];
  selectedUser: EditUser | null = null;

  constructor(private userService: UserService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.Users = data;
        // console.log('Users fetched successfully:', this.Users);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      }
    }
      
    );
  }

  onRoleChange(event: Event) {
    if(this.selectedUser?.roleId === 2){
      alert('Cannot change role of Admin');
      return;
    }

    if (this.selectedUser) {
      const newRoleId = Number((event.target as HTMLSelectElement).value);
      
      this.userService.updateUserRole(this.selectedUser.id, newRoleId).subscribe({
        next: () => {
          if(this.selectedUser) {
            this.selectedUser.roleId = newRoleId;
          }
          console.log('User role updated successfully');
        },
        error: (error) => {
          console.error('Error updating user role:', error);
          alert('Failed to update user role. Please try again.');
        }
      });
    }
  }

  onStatusChange(event: Event) {
    if(this.selectedUser?.roleId === 2){
      alert('Cannot change status of Admin');
      return;
    }

    if (this.selectedUser) {
      const newStatus = (event.target as HTMLInputElement).checked ? 1 : 0;
      
      this.userService.updateUserStatus(this.selectedUser.id, newStatus).subscribe({
        next: () => {
          if(this.selectedUser) {
            this.selectedUser.status = newStatus;
          }
          console.log('User status updated successfully');
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          alert('Failed to update user status. Please try again.');
        }
      });
    }
  }

}
