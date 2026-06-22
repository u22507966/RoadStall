import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Stock } from '../Models/stock';
import { StockTake } from '../Models/stock-take';
import { StockChange } from '../Models/stock-change';
import { Sale } from '../Models/sale';
import { OnInit, OnDestroy } from '@angular/core';
import { StockService } from '../Services/stock';
import { StockTakeService } from '../Services/stock-take';
import { StockChangeService } from '../Services/stock-change-service';
import { SaleService } from '../Services/sale-service';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { TopQuickModal } from '../Modals/top-quick-modal/top-quick-modal';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { UserService } from '../Services/user-service';
import { error } from 'console';

interface todaysStockChangesTable {
  StockName?: string;
  cStockChanges: StockChange[];
}

@Component({
  selector: 'app-stock-take',
  imports: [CommonModule, FormsModule, TopQuickModal],
  templateUrl: './stock-take.html',
  styleUrl: './stock-take.css',
})
export class StockTakeClass implements OnInit, OnDestroy {

  stock$!: Observable<Stock[]>;
  CurrentStock: Stock[] = [];

  // stockTake$!: Observable<StockTake[]>;
  StockTake: StockTake[] = [];
  stockTakeByStockId: Record<number, StockTake> = {};

  currentStockChange: StockChange[] = [];
  stockChangeNames: string[] = [];
  // todaysStockChangesTable: todaysStockChangesTable[] = [];

  currentSales: Sale[] = [];

  unitsSoldByStockId: Record<number, number> = {};

  stockAuditTrail: StockChange[] = [];
  selectedQuantity: number = 0;
  selectedStockItem?: Stock;
  showStockSelectModal: boolean = false;
  showQuantitySection: boolean = false;
  changeType: string = '';
  today = new Date();
  selectedDate: string = new Date().toISOString().split('T')[0];

  cachedUserNames: Record<number, string> = {};

  //Export variables
  exportErrorMessage: string = '';

  // Debounce timer for stock take updates
  private updateTimers: Map<number, any> = new Map();

  //role variables
  roleId!: number;

  //External modal variables (Top Quick Modal comp)
  showFeedbackModal: boolean = false; 
  feedbackTitle: string = "";
  feedbackMessage: string = "";
  feedbackType: 'success' | 'error' | 'warning' | 'info' = 'info'; 

  constructor(private router: Router, private stockService: StockService, private stockTakeService: StockTakeService, private stockChangeService: StockChangeService,
    @Inject(PLATFORM_ID) private platformId: object, private cdr: ChangeDetectorRef, private saleService: SaleService, private userService: UserService, private ngZone: NgZone
  ) { }

  ngOnInit(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    //quickly get users roleId
    this.roleId = Number(localStorage.getItem('roleId'));

    // Expose the observable and let the template subscribe with the async pipe
    this.stock$ = this.stockService.getStock();
    this.CurrentStock = this.stock$ as unknown as Stock[];
    // localStorage.setItem('CurrentStock', JSON.stringify(this.CurrentStock));   Local Storage not working beacuse trying to save observable directly. I think observables change

    // First, subscribe to stock to get all stock items
    this.stockService.getStock().subscribe((stockItems: Stock[]) => {
      this.CurrentStock = stockItems;

      // Then fetch stock take data
      this.stockTakeService.getStockTake().subscribe((data: any[]) => {

        // Normalize/map incoming data (case-insensitive) to the StockTake interface
        this.StockTake = (data || []).map((item: any) => ({
          ID: item.ID ?? item.id ?? item.Id ?? 0,
          UserId: item.UserId ?? item.userId ?? item.user_id ?? 0,
          StockId: item.StockId ?? item.stockId ?? item.StockID ?? item.stock_id ?? 0,
          Date: new Date(item.Date ?? item.date ?? Date.now()),
          OpeningStock: item.OpeningStock ?? item.openingStock ?? item.opening_stock ?? 0,
          ClosingStock: item.ClosingStock ?? item.closingStock ?? item.closing_stock ?? 0,
        }));

        // Ensure every stock item has a corresponding StockTake entry
        stockItems.forEach((stockItem: Stock) => {
          const existingEntry = this.StockTake.find(st => st.StockId === stockItem.id);
          if (!existingEntry) {
            // Create a new StockTake entry with default values
            this.StockTake.push({
              ID: 0, // 0 indicates a new entry that hasn't been saved yet
              UserId: 0,
              StockId: stockItem.id,
              Date: new Date(),
              OpeningStock: 0,
              ClosingStock: 0,
            });
          }
        });

        // Sort StockTake to match the order of stock items
        this.StockTake.sort((a, b) => {
          const indexA = stockItems.findIndex(s => s.id === a.StockId);
          const indexB = stockItems.findIndex(s => s.id === b.StockId);
          return indexA - indexB;
        });

        this.stockTakeByStockId = this.StockTake.reduce((acc, item) => {
          acc[item.StockId] = item;
          return acc;
        }, {} as Record<number, StockTake>);

        this.cdr.detectChanges();
      });
    });

    this.stockChangeService.GetStockChange().subscribe((data: any[]) => {
      this.currentStockChange = data.map((item: any) => ({
        Id: item.Id ?? item.id ?? 0,
        UserId: item.UserId ?? item.userId ?? 0,
        StockId: item.StockId ?? item.stockId ?? 0,
        ChangeType: item.ChangeType ?? item.changeType ?? '',
        Quantity: item.Quantity ?? item.quantity ?? 0,
        ChangeDate: new Date(item.ChangeDate ?? item.changeDate ?? Date.now()),
        Adjustment: item.Adjustment ?? item.adjustment ?? 0,
      }));
      // filtering to only today's changes
      this.currentStockChange = this.currentStockChange.filter(item => {
        const itemDate = new Date(item.ChangeDate);
        const today = new Date();
        return itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear();
      });

      // for(let stockItem of this.currentStockChange){           
      //   this.todaysStockChangesTable.push({
      //     cStockChanges: stockItem ? [stockItem] : [],
      //     StockName: this.CurrentStock.find(s => s.id === stockItem.StockId)?.stockName || 'Unknown',
      //   });
      // }
      this.getStockChangeNames();

      // Fetch all unique usernames once
      const uniqueUserIds = [...new Set(this.currentStockChange.map(item => item.UserId))];
      uniqueUserIds.forEach(userId => {
        this.fetchUserName(userId);
      });

      this.cdr.detectChanges();

    });

    this.saleService.getSales().subscribe((data: any[]) => {
      this.currentSales = data.map((item: any) => ({
        Id: item.Id ?? item.id ?? 0,
        StockId: item.StockId ?? item.stockId ?? 0,
        QuantitySold: item.Quantity ?? item.quantity ?? 0,
        TotalPrice: item.TotalPrice ?? item.totalPrice ?? 0,
        Date: new Date(item.SaleDate ?? item.saleDate ?? Date.now()),
        SaleGroup: item.SaleGroup ?? item.saleGroup ?? '',

      }));
      this.cdr.detectChanges();
    });

    // Add window focus listener to refresh data when tab becomes active
    window.addEventListener('focus', this.onWindowFocus);
  }

  ngOnDestroy(): void {
    // Clean up event listener to prevent memory leaks
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('focus', this.onWindowFocus);
    }

    // Clear any pending update timers
    this.updateTimers.forEach((timer) => clearTimeout(timer));
    this.updateTimers.clear();
  }

  // Arrow function to maintain 'this' context
  private onWindowFocus = (): void => {
    this.refreshAllData();
  }

  private refreshAllData(): void {
    // Refresh stock data
    this.stock$ = this.stockService.getStock();
    this.stockService.getStock().subscribe((stockItems: Stock[]) => {
      this.CurrentStock = stockItems;
      this.cdr.detectChanges();
    });

    // Refresh stock take data
    this.stockTakeService.getStockTake().subscribe((data: any[]) => {
      this.StockTake = (data || []).map((item: any) => ({
        ID: item.ID ?? item.id ?? item.Id ?? 0,
        UserId: item.UserId ?? item.userId ?? item.user_id ?? 0,
        StockId: item.StockId ?? item.stockId ?? item.StockID ?? item.stock_id ?? 0,
        Date: new Date(item.Date ?? item.date ?? Date.now()),
        OpeningStock: item.OpeningStock ?? item.openingStock ?? item.opening_stock ?? 0,
        ClosingStock: item.ClosingStock ?? item.closingStock ?? item.closing_stock ?? 0,
      }));
      this.stockTakeByStockId = this.StockTake.reduce((acc, item) => {
        acc[item.StockId] = item;
        return acc;
      }, {} as Record<number, StockTake>);
      this.cdr.detectChanges();
    });

    // Refresh stock changes
    this.stockChangeService.GetStockChange().subscribe((data: any[]) => {
      this.currentStockChange = data.map((item: any) => ({
        Id: item.Id ?? item.id ?? 0,
        UserId: item.UserId ?? item.userId ?? 0,
        StockId: item.StockId ?? item.stockId ?? 0,
        ChangeType: item.ChangeType ?? item.changeType ?? '',
        Quantity: item.Quantity ?? item.quantity ?? 0,
        ChangeDate: new Date(item.ChangeDate ?? item.changeDate ?? Date.now()),
        Adjustment: item.Adjustment ?? item.adjustment ?? 0,
      }));

      // Filter to today's changes
      this.currentStockChange = this.currentStockChange.filter(item => {
        const itemDate = new Date(item.ChangeDate);
        const today = new Date();
        return itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear();
      });

      this.getStockChangeNames();

      // Fetch usernames
      const uniqueUserIds = [...new Set(this.currentStockChange.map(item => item.UserId))];
      uniqueUserIds.forEach(userId => {
        this.fetchUserName(userId);
      });

      this.cdr.detectChanges();
    });

    // Refresh sales data and clear cache
    this.unitsSoldByStockId = {};
    this.saleService.getSales().subscribe((data: any[]) => {
      this.currentSales = data.map((item: any) => ({
        Id: item.Id ?? item.id ?? 0,
        StockId: item.StockId ?? item.stockId ?? 0,
        QuantitySold: item.Quantity ?? item.quantity ?? 0,
        TotalPrice: item.TotalPrice ?? item.totalPrice ?? 0,
        Date: new Date(item.SaleDate ?? item.saleDate ?? Date.now()),
        SaleGroup: item.SaleGroup ?? item.saleGroup ?? '',
      }));
      this.cdr.detectChanges();
    });
  }

  getUnitsSold(stockId: number): number {
    const cached = this.unitsSoldByStockId[stockId];
    if (typeof cached === 'number') {
      return cached;
    }

    this.saleService.getUnitsSold(stockId).subscribe({
      next: (totalSold) => {
        this.unitsSoldByStockId[stockId] = Number(totalSold ?? 0);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`Error fetching units sold for stock ID ${stockId}:`, error);
        this.unitsSoldByStockId[stockId] = 0;
      },
    });

    return 0;
  }

  getStockChangeNames() {
    let count = 0;
    for (let item of this.currentStockChange) {
      // this.stockService.getStockById(item.StockId).subscribe((data: Stock) => {
      //   this.stockChangeNames[count] = data.stockName;
      //   count++;
      // });
      this.stockService.getStockById(item.StockId).subscribe({
        next: (data: Stock) => {
          this.stockChangeNames[count] = data.stockName;
          count++;
          this.cdr.detectChanges();
        }
      });
      // this.stockChangeNames[count] = 
    }
  }

  getStockChangeById(stockId: number) {
    return this.currentStockChange.find(s => s.StockId == stockId)?.Quantity || 0;
  }

  getReceivedChanges(stockId: number): StockChange[] {
    return this.currentStockChange
      .filter(c => c.StockId === stockId && c.ChangeType === 'Stock Received')
      .sort((a, b) => +new Date(a.ChangeDate) - +new Date(b.ChangeDate));
  }

  getRemovedChanges(stockId: number): StockChange[] {
    return this.currentStockChange
      .filter(c => c.StockId === stockId && c.ChangeType === 'Stock Removed')
      .sort((a, b) => +new Date(a.ChangeDate) - +new Date(b.ChangeDate));
  }

  // 2) Compute "row counts" (max number of changes across all products)
  getReceivedRowCount(currentStock: Stock[]): number[] {
    const max = Math.max(
      0,
      ...currentStock.map(s => this.getReceivedChanges(s.id).length)
    );
    return Array.from({ length: max }, (_, i) => i);
  }

  getRemovedRowCount(currentStock: Stock[]): number[] {
    const max = Math.max(
      0,
      ...currentStock.map(s => this.getRemovedChanges(s.id).length)
    );
    return Array.from({ length: max }, (_, i) => i);
  }

  // Calculate stock left based on opening stock, changes, and sales
  getStockLeft(stockId: number): number {
    const stockTakeEntry = this.StockTake.find(st => st.StockId === stockId);
    if (!stockTakeEntry) return 0;

    const openingStock = stockTakeEntry.OpeningStock || 0;
    const received = this.getReceivedChanges(stockId).reduce((sum, ch) => sum + ch.Quantity, 0);
    const removed = this.getRemovedChanges(stockId).reduce((sum, ch) => sum + ch.Quantity, 0);
    const unitsSold = this.getUnitsSold(stockId);

    return openingStock + received - removed - unitsSold;
  }

  goBackDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  closeStockSelectionModal() {
    this.showStockSelectModal = false;
    this.showQuantitySection = false;
    this.selectedQuantity = 0;
    this.selectedStockItem = undefined;
  }

  selectStockItem(stockitem: Stock, index: number) {
    this.selectedStockItem = stockitem;
  }

  saveStockChange() {

    if (!this.selectedStockItem || this.selectedQuantity <= 0) {
      this.showFeedbackModal = true;
      this.feedbackMessage = 'Invalid stock item or quantity. Cannot save stock change.';
      this.feedbackType = 'error';

      setTimeout(() => {
        this.showFeedbackModal = false;
        this.cdr.detectChanges();
      }, 1500);
      return;
    }


    const selectedStockItem = this.selectedStockItem;
    const selectedQuantity = this.selectedQuantity;

    //Getting the stocks StockTake to check if theres a closing stock, to then add the adjustment value to stock change model
    this.stockTakeService.getStockTakeByStockId(selectedStockItem.id).subscribe({
      next: (stockTake) => {

        var isAdjustment = 0;
        // Backend sends closingStock with lowercase 'c'
        const closingStock = (stockTake as any).closingStock ?? stockTake.ClosingStock ?? 0;
        if (closingStock > 0) {
          isAdjustment = 1;
        }

        this.stockAuditTrail.push({
          Id: this.stockAuditTrail.length + 1,
          UserId: Number(localStorage.getItem('userId') ?? 0),
          StockId: selectedStockItem.id,
          ChangeType: this.changeType,
          Quantity: selectedQuantity,
          ChangeDate: new Date(),
        });

        var x: StockChange = {
          Id: 0,
          UserId: Number(localStorage.getItem('userId') ?? 0),
          StockId: selectedStockItem.id,
          ChangeType: this.changeType,
          Quantity: selectedQuantity,
          ChangeDate: new Date(),
          Adjustment: isAdjustment
        }

        this.stockChangeService.PostStockChange(x).subscribe({
          next: (response) => {
            // Refresh data without hard reload
            this.stock$ = this.stockService.getStock();
            this.stockChangeService.GetStockChange().subscribe((data: any[]) => {
              this.currentStockChange = data.map((item: any) => ({
                Id: item.Id ?? item.id ?? 0,
                UserId: item.UserId ?? item.userId ?? 0,
                StockId: item.StockId ?? item.stockId ?? 0,
                ChangeType: item.ChangeType ?? item.changeType ?? '',
                Quantity: item.Quantity ?? item.quantity ?? 0,
                ChangeDate: new Date(item.ChangeDate ?? item.changeDate ?? Date.now()),
                Adjustment: item.Adjustment ?? item.adjustment ?? 0
              }));
              this.currentStockChange = this.currentStockChange.filter(item => {
                const itemDate = new Date(item.ChangeDate);
                const today = new Date();
                return itemDate.getDate() === today.getDate() &&
                  itemDate.getMonth() === today.getMonth() &&
                  itemDate.getFullYear() === today.getFullYear();
              });
              this.getStockChangeNames();

              // Fetch all unique usernames again after refresh
              const uniqueUserIds = [...new Set(this.currentStockChange.map(item => item.UserId))];
              uniqueUserIds.forEach(userId => {
                this.fetchUserName(userId);
              });

              setTimeout(() => {
                this.cdr.detectChanges();
              });
            });

            this.selectedQuantity = 0;
          },
          error: (error) => {
            console.error('Error saving stock change:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error fetching stock take:', error);
      }
    });

    this.closeStockSelectionModal();

  } //save stock changes method

  sendUpdates() {
    // console.log("Sending stock updates to backend...", this.CurrentStock);
  }

  UpdateStockTake(product?: StockTake) {

    if (!product) {
      console.warn('UpdateStockTake called with undefined product', 'prod:', product);
      return;
    }

    const currentUserId: number = Number(localStorage.getItem('userId') ?? 0);
    if (currentUserId === 0) {
      console.warn('No valid user ID found in localStorage');
    }
    product.UserId = currentUserId;

    product.Date = this.today;                //Need to update the date to the day when it was updated for auditing

    const idForUrl = Number((product as any).ID ?? (product as any).Id ?? (product as any).id);

    // Clear existing timer for this product
    if (this.updateTimers.has(idForUrl)) {
      clearTimeout(this.updateTimers.get(idForUrl));
    }

    // Set new timer - only sends API request after 500ms of no changes
    const timer = setTimeout(() => {
      const payloadPascal: any = {
        Id: idForUrl,
        UserId: Number((product as any).UserId ?? 0),
        StockId: Number((product as any).StockId ?? 0),
        Date: this.today,                                               //product.Date ? (product.Date instanceof Date ? product.Date.toISOString() : new Date(product.Date).toISOString()) : null
        OpeningStock: Number((product as any).OpeningStock ?? 0),
        ClosingStock: Number((product as any).ClosingStock ?? 0),
      };

      this.stockTakeService.updateStockTake(product!.ID, product!).subscribe({
        next: (response) => {
          // No need to refresh stock data - only StockTake was updated
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating stock take:', error);
        }
      });

      this.updateTimers.delete(idForUrl);
    }, 500); // Wait 500ms after user stops typing

    this.updateTimers.set(idForUrl, timer);

  }

  async exportStockTableToExcel() {
    // Helper to format date as dd/MM/YYYY
    const formatDate = (d: Date | string) => {
      const date = d instanceof Date ? d : new Date(d);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    const dateStr = formatDate(this.selectedDate);
    const exportDate = new Date(this.selectedDate);
    const today = new Date();
    const isToday = exportDate.toDateString() === today.toDateString();

    // If exporting today's data, use the DOM table (existing behavior)
    if (isToday) {
      await this.exportCurrentDayFromDOM(dateStr, exportDate);
    } else {
      // If exporting historical data, fetch from API
      await this.exportHistoricalDataFromAPI(dateStr, exportDate);
    }
  }

  private async exportCurrentDayFromDOM(dateStr: string, exportDate: Date) {
    const element = document.getElementById('stockTablePdf') as HTMLTableElement | null;
    if (!element) return;

    // Build table body from the rendered DOM table
    const rows = Array.from(element.querySelectorAll('tr'));
    const tableData: string[][] = rows.map((row) => {
      const cells = Array.from(row.querySelectorAll('th,td'));
      return cells.map((cell) => {
        const input = cell.querySelector('input') as HTMLInputElement | null;
        if (input) return (input.value ?? '').toString();
        return (cell.textContent ?? '').replace(/\s+/g, ' ').trim();
      });
    });

    // Create workbook and worksheet
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Stock Take');

    // Add title and date at the top
    ws.mergeCells('A1:D1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Stock Take';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    ws.mergeCells('A2:D2');
    const dateCell = ws.getCell('A2');
    dateCell.value = `Date: ${dateStr}`;
    dateCell.font = { bold: true, size: 12 };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add table data starting from row 4
    tableData.forEach((rowData, rowIndex) => {
      const excelRow = ws.getRow(rowIndex + 4);
      rowData.forEach((cellValue, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        // Try to parse as number if possible
        const numValue = Number(cellValue);
        cell.value = !isNaN(numValue) && cellValue !== '' ? numValue : cellValue;

        // Style section rows (headers)
        const domRow = rows[rowIndex];
        if (domRow.classList.contains('section-row')) {
          cell.font = { bold: true };
          if (colIndex === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF5F5F5' }
            };
          }
        }

        // Add borders
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    // Auto-size columns
    ws.columns.forEach((column) => {
      if (column && column.eachCell) {
        let maxLength = 10;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 30);
      }
    });

    // Save file
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `StockTake_${exportDate.toISOString().slice(0, 10)}.xlsx`);
  }

  private async exportHistoricalDataFromAPI(dateStr: string, exportDate: Date) {
    try {
      // Fetch historical data from API
      const response = await this.stockTakeService.getHistoryExportData(exportDate.toISOString().split('T')[0]).toPromise();


      if (!response || !response.data || response.data.length === 0) {
        alert(`No stock take data found for ${dateStr}`);
        return;
      }

      const historyData = response.data;

      // Helper to safely get property (try both PascalCase and camelCase)
      const getProp = (obj: any, propName: string): any => {
        if (obj[propName] !== undefined) return obj[propName];
        const lowerProp = propName.charAt(0).toLowerCase() + propName.slice(1);
        if (obj[lowerProp] !== undefined) return obj[lowerProp];
        return null;
      };

      // Create workbook and worksheet
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Stock Take');

      // Add title and date at the top
      ws.mergeCells('A1:D1');
      const titleCell = ws.getCell('A1');
      titleCell.value = 'Stock Take';
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      ws.mergeCells('A2:D2');
      const dateCell = ws.getCell('A2');
      dateCell.value = `Date: ${dateStr}`;
      dateCell.font = { bold: true, size: 12 };
      dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Build table data array (matching the DOM table structure)
      const tableData: any[][] = [];

      // Parse received and removed entries for each product
      const parsedData = historyData.map((item: any) => {
        const receivedDisplay = getProp(item, 'StockReceivedDisplay') || '';
        const removedDisplay = getProp(item, 'StockRemovedDisplay') || '';

        // Split by newline and parse to numbers
        const receivedEntries = receivedDisplay
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s)
          .map((s: string) => {
            const num = s.replace(/[+\-]/g, '').trim();
            return num ? Number(num) : null;
          })
          .filter((n: number | null) => n !== null);

        const removedEntries = removedDisplay
          .split('\n')
          .map((s: string) => s.trim())
          .filter((s: string) => s)
          .map((s: string) => {
            const num = s.replace(/[+\-]/g, '').trim();
            return num ? Number(num) : null;
          })
          .filter((n: number | null) => n !== null);

        return {
          ...item,
          receivedEntries,
          removedEntries
        };
      });

      // Calculate max rows needed for received and removed
      const maxReceivedRows = Math.max(0, ...parsedData.map((d: any) => d.receivedEntries.length));
      const maxRemovedRows = Math.max(0, ...parsedData.map((d: any) => d.removedEntries.length));

      // Row 1: Product names header
      tableData.push(['', ...historyData.map((item: any) => {
        const name = getProp(item, 'StockName');
        return name || 'Unknown';
      })]);

      // Row 2: Prices
      tableData.push(['Price', ...historyData.map((item: any) => {
        const price = getProp(item, 'Price');
        return price ?? 0;
      })]);

      // Row 3: Opening Stock
      tableData.push(['Opening Stock', ...historyData.map((item: any) => {
        const opening = getProp(item, 'OpeningStock');
        return opening ?? 0;
      })]);

      // Stock Received header
      tableData.push(['Stock Received', ...historyData.map(() => '')]);

      // Stock Received individual rows
      for (let i = 0; i < maxReceivedRows; i++) {
        tableData.push(['', ...parsedData.map((item: any) => {
          return item.receivedEntries[i] ?? '';
        })]);
      }

      // Stock Removed header
      tableData.push(['Stock Removed', ...historyData.map(() => '')]);

      // Stock Removed individual rows
      for (let i = 0; i < maxRemovedRows; i++) {
        tableData.push(['', ...parsedData.map((item: any) => {
          return item.removedEntries[i] ?? '';
        })]);
      }

      // Closing Stock
      tableData.push(['Closing Stock', ...historyData.map((item: any) => {
        const closing = getProp(item, 'ClosingStock');
        return closing ?? 0;
      })]);

      // Units Sold - from actual sales data in the API
      tableData.push(['Units Sold', ...historyData.map((item: any) => {
        const unitsSold = getProp(item, 'UnitsSold');
        return unitsSold ?? 0;
      })]);

      // Stock Left - from API
      tableData.push(['Stock Left', ...historyData.map((item: any) => {
        const stockLeft = getProp(item, 'StockLeft');
        return stockLeft ?? 0;
      })]);

      // Section row indices (for styling) - dynamic based on maxReceivedRows and maxRemovedRows
      const stockReceivedHeaderRow = 3;
      const stockRemovedHeaderRow = 3 + maxReceivedRows + 1;
      const closingStockRow = stockRemovedHeaderRow + maxRemovedRows + 1;
      const unitsSoldRow = closingStockRow + 1;
      const stockLeftRow = unitsSoldRow + 1;

      const sectionRows = [0, 1, 2, stockReceivedHeaderRow, stockRemovedHeaderRow, closingStockRow, unitsSoldRow, stockLeftRow];

      // Add table data starting from row 4
      tableData.forEach((rowData, rowIndex) => {
        const excelRow = ws.getRow(rowIndex + 4);
        const isSectionRow = sectionRows.includes(rowIndex);

        rowData.forEach((cellValue, colIndex) => {
          const cell = excelRow.getCell(colIndex + 1);

          // Handle value conversion
          if (typeof cellValue === 'number') {
            cell.value = cellValue;
          } else if (typeof cellValue === 'string') {
            const numValue = Number(cellValue);
            cell.value = !isNaN(numValue) && cellValue !== '' ? numValue : cellValue;
          } else {
            cell.value = cellValue || '';
          }

          // Style section rows (headers)
          if (isSectionRow) {
            cell.font = { bold: true };
            if (colIndex === 0) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF5F5F5' }
              };
            }
          }

          // Add borders
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // Commit the row
        excelRow.commit();
      });

      // Auto-size columns
      ws.columns.forEach((column, idx) => {
        if (column) {
          let maxLength = 10;
          column.eachCell?.({ includeEmpty: false }, (cell) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            maxLength = Math.max(maxLength, cellValue.length);
          });
          column.width = Math.min(maxLength + 2, 30);
        }
      });

      // Save file
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `StockTake_${exportDate.toISOString().slice(0, 10)}.xlsx`);

    } catch (error: any) {

      this.ngZone.run(() => {
        this.exportErrorMessage = error.error?.message + ". Please select a new valid date to export.";
        // Force Angular to detect the change
        setTimeout(() => this.cdr.markForCheck(), 0);
      });
      return;

    }
  }

  getUserNameById(userId: number): string {
    return this.cachedUserNames[userId] || 'Loading...';
  }

  private fetchUserName(userId: number): void {
    if (this.cachedUserNames[userId]) {
      return; // Already cached
    }

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.cachedUserNames[userId] = user.username;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching user:', error);
        this.cachedUserNames[userId] = 'Unknown User';
      }
    });
  }

  clickReceiveRemoveButton(modalType: string) {
    if (this.roleId === 0) {
      alert("You do not have permission to perform stock adjustments");
      return;
    }

    if (modalType === 'Received') {
      this.changeType = 'Stock Received';
    }
    else if (modalType === 'Removed') {
      this.changeType = 'Stock Removed';
    }
    this.selectedQuantity = 0;
    this.selectedStockItem = undefined;
    this.showStockSelectModal = true;
  }

}


