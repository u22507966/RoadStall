import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Notifications } from '../Services/notifications';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  errorMessage: string = '';
  roleId: number = Number(localStorage.getItem('roleId'));

  constructor(private router: Router, private notificationService: Notifications) {
  }

  ngOnInit(): void {
  }

  goToStockTake() {
    this.router.navigate(['/stock-take']);
  }
  goToSales() {
    this.router.navigate(['/sales']);
  }
  goToProducts(){
    if(this.roleId === 0){
      this.errorMessage = 'You do not have permission to access the Products page.';
      return;
    }

    this.router.navigate(['/products']);
  }

  goToUsers(){
    if(this.roleId === 0){
      this.errorMessage = 'You do not have permission to access the Users page.';
      return;
    }

    this.router.navigate(['/user']);
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  enableNotifications(){
    this.notificationService.subscribeToNotification();
  }

  sendTestNotification(){
    this.notificationService.sendTestNotiToAll();
  }

}
