import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  constructor(private router: Router) {
  }

  goToStockTake() {
    this.router.navigate(['/stock-take']);
  }
  goToSales() {
    this.router.navigate(['/sales']);
  }
  goBack() {
    this.router.navigate(['/login']);
  }

}
