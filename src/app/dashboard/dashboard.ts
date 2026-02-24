import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  errorMessage: string = '';
  roleId: number = Number(localStorage.getItem('roleId'));

  constructor(private router: Router) {
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
  goBack() {
    this.router.navigate(['/login']);
  }

}
