import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Notifications } from '../Services/notifications';
import { NotificationDto } from '../Models/Dto/NotificationDto';
import { Stock } from '../Models/stock';
import { FormsModule } from "@angular/forms";
import { OnInit } from '@angular/core';
import { StockService } from '../Services/stock';
import { title } from 'process';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  errorMessage: string = '';
  roleId: number = Number(localStorage.getItem('roleId'));

  showStockRequestModal: boolean = false;
  stock: Stock[] = [];
  selectedStock: {name: string; quantity: number} = {name: '', quantity: 0};
  selectedStockList: { name: string; quantity: number }[] = [];
  stockIndex: number = 0;

  constructor(private router: Router, private notificationService: Notifications, private stockService: StockService, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.stockService.getStock().subscribe(data => {
      this.stock = data.map((x: any) => ({
        id: x.id ?? x.Id ?? x.ID,
        stockName: x.stockName ?? x.StockName ?? x.stockname,
        quantity: x.quantity ?? x.Quantity ?? x.quantity,
        price: x.price ?? x.Price ?? x.price,
      }));
      this.cdr.detectChanges();
      // console.log(this.stock);
    });

  }

  goToStockTake() {
    this.router.navigate(['/stock-take']);
  }
  goToSales() {
    this.router.navigate(['/sales']);
  }
  goToProducts() {
    if (this.roleId === 0) {
      this.errorMessage = 'You do not have permission to access the Products page.';
      return;
    }

    this.router.navigate(['/products']);
  }

  goToUsers() {
    if (this.roleId === 0) {
      this.errorMessage = 'You do not have permission to access the Users page.';
      return;
    }

    this.router.navigate(['/user']);
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  goToProfile() {
    // this.router.navigate(['/profile'])
    alert("Functionality under construction. Come back later");
  }

  addStockToSummary(){
    if(this.selectedStock.name == "" || this.selectedStock.quantity == 0 || this.selectedStock.name == "Select stock"){
      alert("Please select a stock and enter an amount!");
      return;
    }

    this.selectedStockList.push({name: this.selectedStock.name, quantity: this.selectedStock.quantity});
    this.selectedStock.quantity = 0;
    // console.log("Stock Request Summary:", this.selectedStockList)
  }

  clearStockList(){
    for(let i = 0; i < this.selectedStockList.length; i++){
      this.selectedStockList.pop();
    }
  }

  sendStockRequest(){
    console.log(this.selectedStockList, this.selectedStockList.length);
    if(this.selectedStockList.length == 0){
      alert("Please select a stock number before submitting!")
      return;
    }

    this.showStockRequestModal = false;

    let notification: NotificationDto = {title: "Stock Request", message: ""};
    this.selectedStockList.forEach(stock => {
      notification.message = notification.message + stock.name + ": " + stock.quantity + "\n";
    });

    this.notificationService.sendTestNotiToAll(notification);

    this.selectedStock = {name: '', quantity: 0};
    this.selectedStockList = [];
  }

}
