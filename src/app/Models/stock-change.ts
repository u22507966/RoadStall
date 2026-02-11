export interface StockChange {
    Id: number;
    StockId: number;
    UserId: number;
    ChangeType: string;
    Quantity: number;
    ChangeDate: Date;
    Adjustment?: number;
}
