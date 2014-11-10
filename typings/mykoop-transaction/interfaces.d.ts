

declare module Transaction {
  export interface NewBill {
    items: {
      id: number;
      price: number;
      quantity: number;
    }[];
    discounts?: {
      type: string;
      value: number;
      isAfterTax: boolean;
    }[];
  }
}
