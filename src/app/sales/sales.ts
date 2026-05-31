import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Stock } from '../Models/stock';
import { StockChange } from '../Models/stock-change';
import { Sale } from '../Models/sale';
import { OnInit } from '@angular/core';
import { StockService } from '../Services/stock';
import { SaleService } from '../Services/sale-service';
import { setAlternateWeakRefImpl } from '@angular/core/primitives/signals';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-sales',
  imports: [FormsModule, CommonModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})

export class Sales implements OnInit {

  sales: Sale[] = [];
  saleNames: string[] = [];
  currentSales: Sale[] = [];
  saleGroupingForTable: { saleGroup: number; items: Sale[]; grandTotal: number }[] = [];


  grandTotals: number[] = [];
  grandTotalCounter: number = 0;


  currentStock: Stock[] = [];

  //---------------------------------------------------------------------------Variables---------------------------------------------------------------------------------------
  makingSale: boolean = false;
  numberOfProducts: number = 0;
  saleIdCounter: number = 1;
  today: Date = new Date();
  selectedProdNames: string[] = [];

  //variables for sales export function
  selectedDate?: Date;
  exportSales: Sale[] = [];

  // Compute grand total from current in-progress sale items so it reflects
  // quantity edits immediately. Template binds to `grandTotal` so keep
  // the property name as a getter.
  get grandTotal(): number {
    return this.currentSales.reduce((sum, s) => sum + (s.TotalPrice * (s.QuantitySold || 0)), 0);
  }
  //----------------------------------------------------------------------------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    console.log("New date variable instantiated as: ", this.selectedDate);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.saleService.getSales().subscribe(data => {
      this.sales = data.map((item: any) => ({
        Id: item.ID ?? item.saleId ?? 0,
        SaleGroup: item.SaleGroup ?? item.saleGroup ?? 0,
        StockId: item.StockId ?? item.stockId ?? 0,
        QuantitySold: item.QuantitySold ?? item.quantitySold ?? 0,
        TotalPrice: item.TotalPrice ?? item.totalPrice ?? 0,
        Date: new Date(item.Date ?? item.date ?? Date.now()),
      }))
      this.sales = this.sales.filter(item => {    //filtering sales for only today
        const itemDate = new Date(item.Date);
        const today = new Date();
        // Set both dates to midnight in local timezone for accurate day comparison
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return itemDateOnly.getTime() === todayDateOnly.getTime();
      });
      if (this.sales.length > 0) {
        const tempcount = this.sales.length - 1;
        const tempid = this.sales[tempcount].SaleGroup + 1;
        console.log('Sales.length - 1 :', tempcount)
        this.saleIdCounter = tempid;//this.sales[tempcount].SaleGroup + 1;
        this.getStockNames();
      }
      this.groupSalesForTable();

    });


    console.log("Fetched sales data:", this.sales);

    this.stockService.getStock().subscribe(data => {
      this.currentStock = data;
      console.log("Fetched stock data:", this.currentStock);
    })
  }

  constructor(
    private router: Router,
    private saleService: SaleService,
    private stockService: StockService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) { }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  async exportDailySalesToExcel(): Promise<void> {
    const today = new Date(); //comparison variable
    const day = this.selectedDate ? this.selectedDate.toString().slice(0, 10) : ''; //Gets '2026-05-30'

    //Exporting for specified date
    //this.selectedDate == undefined || this.selectedDate == null || this.selectedDate == today
    // if (this.selectedDate! < today) {
      this.saleService.exportSales(day).subscribe({
        next: (data) => {
          this.exportSales = data.map((item: any) => ({
            Id: item.ID ?? item.saleId ?? 0,
            StockId: item.StockId ?? item.stockId ?? 0,
            QuantitySold: item.QuantitySold ?? item.quantitySold ?? 0,
            TotalPrice: item.TotalPrice ?? item.totalPrice ?? 0,
            Date: new Date(item.Date ?? item.date ?? Date.now()),
            SaleGroup: item.SaleGroup ?? item.saleGroup ?? 0,
          }));
          console.log('Export sales response received.');
          console.log('Sales to export:', this.exportSales);
        },
        error: (error) => {
          console.error('Export sales failed:', error);
        },
      });
    // }
    console.log("Exporting sales for date:", this.selectedDate);

    // Ensure stock loaded (for names/prices)
    const products = [...this.currentStock];      //.sort((a, b) => a.stockName.localeCompare(b.stockName))
    if (products.length === 0) {
      console.warn('No stock loaded; cannot export sales.');
      return;
    }

    // Aggregate today's sales by product
    const byProduct = new Map<number, { qty: number; total: number }>();
    for (const s of this.sales) {
      const prev = byProduct.get(s.StockId) ?? { qty: 0, total: 0 };
      prev.qty += Number(s.QuantitySold ?? 0);
      prev.total += Number(s.TotalPrice ?? 0);
      byProduct.set(s.StockId, prev);
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Daily Sales');

    // Layout:
    // Row 1: Title (left) and Date (center)
    // Row 2: Price row
    // Row 3: Product names row
    // Row 4: QTY/TOTAL subheaders
    // Rows 5..n: Sale groups
    // Last row: Subtotal per product + far-right TOTAL column

    const dateStr = this.formatDate(new Date());
    const productCount = products.length;
    const firstProductCol = 2; // column A is labels
    const totalCol = firstProductCol + productCount * 2; // far-right TOTAL
    const lastCol = totalCol;

    // Row 1
    ws.getCell(1, 1).value = 'Daily Sales Sheet - Gilbert Packers Road Stall';
    ws.getCell(1, 1).font = { bold: true, size: 14 };
    ws.getCell(1, 1).alignment = { vertical: 'middle', horizontal: 'left' };

    ws.mergeCells(1, Math.max(2, Math.floor(lastCol / 2)), 1, Math.min(lastCol - 1, Math.floor(lastCol / 2) + 2));
    const dateCell = ws.getCell(1, Math.max(2, Math.floor(lastCol / 2)));
    dateCell.value = `Date: ${dateStr}`;
    dateCell.font = { bold: true };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Row 2: Price
    ws.getCell(2, 1).value = 'Price';
    ws.getCell(2, 1).font = { bold: true };
    for (let i = 0; i < productCount; i++) {
      const p = products[i];
      const startCol = firstProductCol + i * 2;
      ws.mergeCells(2, startCol, 2, startCol + 1);
      const c = ws.getCell(2, startCol);
      c.value = Number(p.price ?? 0);
      c.numFmt = '"R"#,##0.00';
      c.alignment = { horizontal: 'center' };
      c.font = { bold: true };
    }
    ws.getCell(2, totalCol).value = 'TOTAL';
    ws.getCell(2, totalCol).font = { bold: true };
    ws.getCell(2, totalCol).alignment = { horizontal: 'center' };

    // Row 3: Product names
    ws.getCell(3, 1).value = 'Product';
    ws.getCell(3, 1).font = { bold: true };
    for (let i = 0; i < productCount; i++) {
      const p = products[i];
      const startCol = firstProductCol + i * 2;
      ws.mergeCells(3, startCol, 3, startCol + 1);
      const c = ws.getCell(3, startCol);
      c.value = p.stockName;
      c.font = { bold: true };
      c.alignment = { horizontal: 'center', wrapText: true };
    }
    ws.getCell(3, totalCol).value = '';

    // Row 4: QTY/TOTAL headers
    ws.getCell(4, 1).value = '';
    for (let i = 0; i < productCount; i++) {
      const startCol = firstProductCol + i * 2;
      ws.getCell(4, startCol).value = 'QTY';
      ws.getCell(4, startCol + 1).value = 'TOTAL';
      ws.getCell(4, startCol).font = { bold: true };
      ws.getCell(4, startCol + 1).font = { bold: true };
      ws.getCell(4, startCol).alignment = { horizontal: 'center' };
      ws.getCell(4, startCol + 1).alignment = { horizontal: 'center' };
    }
    ws.getCell(4, totalCol).value = 'TOTAL';
    ws.getCell(4, totalCol).font = { bold: true };
    ws.getCell(4, totalCol).alignment = { horizontal: 'center' };

    // Sale group rows
    const sortedGroups = [...this.saleGroupingForTable].sort((a, b) => a.saleGroup - b.saleGroup);
    let row = 5;
    for (const group of sortedGroups) {
      ws.getCell(row, 1).value = `A${group.saleGroup}`;
      ws.getCell(row, 1).font = { bold: true };

      // Fill per-product qty/total in their two columns
      for (let i = 0; i < productCount; i++) {
        const p = products[i];
        const startCol = firstProductCol + i * 2;

        const item = group.items.find(x => x.StockId === p.id);
        const qty = item ? Number(item.QuantitySold ?? 0) : 0;
        const total = item ? Number(item.TotalPrice ?? 0) : 0;

        ws.getCell(row, startCol).value = qty === 0 ? '' : qty;
        ws.getCell(row, startCol + 1).value = total === 0 ? '' : total;
        ws.getCell(row, startCol + 1).numFmt = '"R"#,##0.00';
        ws.getCell(row, startCol).alignment = { horizontal: 'center' };
        ws.getCell(row, startCol + 1).alignment = { horizontal: 'center' };
      }

      // Far-right TOTAL sums all TOTAL columns in that row horizontally
      const totalStart = firstProductCol + 1;
      const totalEnd = firstProductCol + (productCount - 1) * 2 + 1;
      const rowTotals: string[] = [];
      for (let col = totalStart; col <= totalEnd; col += 2) {
        rowTotals.push(ws.getCell(row, col).address);
      }
      ws.getCell(row, totalCol).value = { formula: rowTotals.length ? `SUM(${rowTotals.join(',')})` : '0' };
      ws.getCell(row, totalCol).numFmt = '"R"#,##0.00';
      ws.getCell(row, totalCol).font = { bold: true };
      ws.getCell(row, totalCol).alignment = { horizontal: 'center' };

      row++;
    }

    // Subtotal row (last)
    ws.getCell(row, 1).value = 'SUBTOTAL';
    ws.getCell(row, 1).font = { bold: true };

    for (let i = 0; i < productCount; i++) {
      const startCol = firstProductCol + i * 2;
      const qtyCol = startCol;
      const totalColForProduct = startCol + 1;

      // Sum vertically for each product (QTY and TOTAL)
      ws.getCell(row, qtyCol).value = { formula: `SUM(${ws.getCell(5, qtyCol).address}:${ws.getCell(row - 1, qtyCol).address})` };
      ws.getCell(row, totalColForProduct).value = { formula: `SUM(${ws.getCell(5, totalColForProduct).address}:${ws.getCell(row - 1, totalColForProduct).address})` };
      ws.getCell(row, totalColForProduct).numFmt = '"R"#,##0.00';
      ws.getCell(row, qtyCol).font = { bold: true };
      ws.getCell(row, totalColForProduct).font = { bold: true };
      ws.getCell(row, qtyCol).alignment = { horizontal: 'center' };
      ws.getCell(row, totalColForProduct).alignment = { horizontal: 'center' };
    }

    // Subtotal row far-right TOTAL sums all product TOTAL subtotals
    const subtotalTotalAddresses: string[] = [];
    for (let i = 0; i < productCount; i++) {
      const subtotalTotalCol = firstProductCol + i * 2 + 1;
      subtotalTotalAddresses.push(ws.getCell(row, subtotalTotalCol).address);
    }
    ws.getCell(row, totalCol).value = { formula: subtotalTotalAddresses.length ? `SUM(${subtotalTotalAddresses.join(',')})` : '0' };
    ws.getCell(row, totalCol).numFmt = '"R"#,##0.00';
    ws.getCell(row, totalCol).font = { bold: true };
    ws.getCell(row, totalCol).alignment = { horizontal: 'center' };

    // Styling: borders + column widths
    ws.columns = Array.from({ length: lastCol }, (_, idx) => {
      if (idx === 0) return { width: 12 };
      if ((idx + 1) === totalCol) return { width: 14 };
      // QTY narrower than TOTAL
      return { width: (idx % 2 === 1) ? 8 : 12 };
    });

    const headerFill = {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFE5E7EB' },
    };

    for (let r = 2; r <= 4; r++) {
      for (let c = 1; c <= lastCol; c++) {
        const cell = ws.getCell(r, c);
        cell.fill = headerFill;
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    // Borders for data area (from row 5 to subtotal row)
    for (let r = 5; r <= row; r++) {
      for (let c = 1; c <= lastCol; c++) {
        const cell = ws.getCell(r, c);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    // Freeze header rows
    ws.views = [{ state: 'frozen', ySplit: 4, xSplit: 1 }];

    // Force Excel to recalculate formulas when opening
    wb.calcProperties = { fullCalcOnLoad: true };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `DailySales_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  getStockNames() {
    let index = 0;
    for (let item of this.sales) {
      this.stockService.getStockById(item.StockId).subscribe(data => {
        this.saleNames[index] = data.stockName;
        index++;
      })
    }
  }

  getStockNameById(stockId: number): string {
    return this.currentStock.find(s => s.id === stockId)?.stockName ?? '';
  }

  getStockById(stockid: number): Stock | undefined {
    return this.currentStock.find(s => s.id === stockid);
  }

  getSales() {
    this.saleService.getSales().subscribe(data => {
      this.sales = data.map((item: any) => ({
        Id: item.ID ?? item.saleId ?? 0,
        SaleGroup: item.SaleGroup ?? item.saleGroup ?? 0,
        StockId: item.StockId ?? item.stockId ?? 0,
        QuantitySold: item.QuantitySold ?? item.quantitySold ?? 0,
        TotalPrice: item.TotalPrice ?? item.totalPrice ?? 0,
        Date: new Date(item.Date ?? item.date ?? Date.now()),
      }))
      this.sales = this.sales.filter(item => {    //filtering sales for only today
        const itemDate = new Date(item.Date);
        const today = new Date();
        // Set both dates to midnight in local timezone for accurate day comparison
        const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return itemDateOnly.getTime() === todayDateOnly.getTime();
      });
    });
  }

  groupSalesForTable() {
    const map = new Map<number, Sale[]>();

    for (const sale of this.sales) {
      if (!map.has(sale.SaleGroup)) map.set(sale.SaleGroup, []);
      map.get(sale.SaleGroup)!.push(sale);
    }

    this.saleGroupingForTable = Array.from(map.entries()).map(([saleGroup, items]) => ({
      saleGroup,
      items,
      grandTotal: items.reduce((sum, s) => sum + (s.TotalPrice || 0), 0),
    }));
    console.log('SaleGrouping Details:', this.saleGroupingForTable)
  }


  goBackDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  selectedProduct(stockitem: Stock, index: number) {
    const newSale: Sale = {
      Id: 0,
      SaleGroup: this.saleIdCounter,
      StockId: stockitem.id,
      QuantitySold: 1,
      TotalPrice: stockitem.price,
      Date: new Date()
    };

    this.selectedProdNames.push(stockitem.stockName);

    // Only add to the active cart (`currentSales`).
    // We'll record the final quantities into `sales` when the sale is finished.
    this.currentSales.push({ ...newSale });
    // console.log("Current Sales:", this.sales);
  }

  finishSale() {
    // Copy current (possibly edited) cart items into the historic `sales` array
    for (const item of this.currentSales) {
      this.sales.push({ ...item });
      this.saleService.postSale(item).subscribe({
        next: (response) => {
          var tempname = this.saleNames[this.saleNames.length - 1]
          this.saleNames.pop();
          this.saleNames.push(tempname);
          this.getSales();
        },
        error: (error) => {
          console.log(error)
        }
      });
    }

    console.log('Total Sales for now are :', this.sales);

    // Clear the cart and advance the sale ID for the next sale
    this.currentSales = [];
    this.saleIdCounter++;
    this.makingSale = false;
    this.selectedProdNames = [];

    this.sales = [...this.sales];
    this.groupSalesForTable();
  }

}
