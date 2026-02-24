import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Stock } from '../Models/stock';
import { StockService } from '../Services/stock';
import { FormsModule } from "@angular/forms";
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink } from "@angular/router";
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})

export class Products implements OnInit {

  stock$: Observable<Stock[]>;
  stock: Stock[] = [];
  selectedProductId: number | null = null;

  isAddingProduct: boolean = false;
  newName: string = '';
  newPrice: number = 0;
  newProd!: Stock;

  //role variables
  roleId!: number;

  constructor(private stockService: StockService, private cdr: ChangeDetectorRef) {
    this.stock$ = this.stockService.getStock();
  }

  ngOnInit(): void {

    //quickly get users roleId and check if they've route hacked their way to this page
    this.roleId = Number(localStorage.getItem('roleId'));
    if(this.roleId === 0){
      alert("You do not have permission to access the Products page.");
      window.location.href = '/dashboard';
    }

    this.stockService.getStock().subscribe(data => {
      this.stock = data.map((item: any) => ({
        id: item.id ?? item.Id ?? item.ID,
        stockName: item.stockName ?? item.StockName ?? item.stockname,
        quantity: item.quantity ?? item.Quantity ?? item.quantity,
        price: item.price ?? item.Price ?? item.price,
      }));
      this.cdr.detectChanges();     //So this is trhe right fix for any refresh issues. DOM loads way before the data arrives from the subscribe
    });                             // which is async. So we manually trigger change detection after data arrives.
  }

  deleteProduct(){
    if(this.selectedProductId !== null){
      console.log("product id to delete:", this.selectedProductId);
      this.stockService.deleteStock(this.selectedProductId).subscribe({
        next: () => {
          console.log("Product deleted successfully:", this.selectedProductId);
          this.stockService.getStock().subscribe({
            next: (data) => {
              this.stock = data.map((item: any) => ({
                id: item.id ?? item.Id ?? item.ID,
                stockName: item.stockName ?? item.StockName ?? item.stockname,
                quantity: item.quantity ?? item.Quantity ?? item.quantity,
                price: item.price ?? item.Price ?? item.price,
              }));
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error("Error reloading stock:", err);
            }
          });
        },
        error: (err) => {
          console.error("Error deleting product:", err);
        }
      });
    }
  }

  addProduct(){

    if(this.newName.trim() === '' || this.newPrice <= 0){
      alert("Please enter a valid product name and price.");
      return;
    }
    this.newProd = {
      id: 0,
      stockName: this.newName,
      quantity: 0,
      price: this.newPrice
    };

    const userId = Number(localStorage.getItem('userId'));
    this.stockService.addStock(this.newProd, userId).subscribe({
      next: () => {
        console.log("Product added successfully:", this.newProd);
        this.stockService.getStock().subscribe({
          next: (data) => {
            this.stock = data.map((item: any) => ({
              id: item.id ?? item.Id ?? item.ID,
              stockName: item.stockName ?? item.StockName ?? item.stockname,
              quantity: item.quantity ?? item.Quantity ?? item.quantity,
              price: item.price ?? item.Price ?? item.price,
            }));
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error("Error reloading stock:", err);
          }
        });
      },
      error: (err) => {
        console.error("Error adding product:", err);
      }
    });

    this.isAddingProduct = false;
    this.newName = '';
    this.newPrice = 0;
  }

}