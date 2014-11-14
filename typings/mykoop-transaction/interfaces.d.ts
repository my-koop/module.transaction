

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

  export interface BillId {
    idBill: number;
  }

  export interface OpenBill {
    idBill: number;
    customerEmail?: string;
  }

  export interface ListBill {
    show: string;
  }

  export interface Bill {
    idBill: number;
    createdDate: string;
    total: number;
    idUser: number; // can be null
    paid: number;
  }
}
