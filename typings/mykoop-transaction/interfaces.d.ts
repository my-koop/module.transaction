

declare module Transaction {
  export interface NewBill {
    total: number;
    customerEmail?: string;
    archiveBill: boolean;
    items: {
      id: number;
      price: number;
      quantity: number;
    }[];
    discounts?: {
      type: number;
      value: number;
      isAfterTax: boolean;
    }[];
  }
}
