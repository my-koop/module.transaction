

declare module mktransaction {
  export module db {
    export interface BillItem {
      idBill: number;
      idItem?: number;
      quantity: number;
      price: number;
    }

    export interface BillDiscount {
      idBill: number;
      type: string;
      amount: number;
      isAfterTax: boolean;
    }

    export interface FinancialReport {
      fromDate: Date;
      toDate: Date;
    }
  }
}
