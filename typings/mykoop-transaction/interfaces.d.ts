

declare module Transaction {
  export interface AddBillTransaction {
    idBill: number;
    amount: number;
  }

  export interface NewBill {
    archiveBill: boolean;
    customerEmail?: string;
    discounts?: Discount[];
    items: {
      id: number;
      price: number;
      quantity: number;
    }[];
    total: number;
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
    closedDate: string; // can be null
    createdDate: string;
    idBill: number;
    idUser: number; // can be null
    paid: number;
    total: number;
  }

  export interface Discount {
    type: number;
    value: number;
    isAfterTax: boolean;
  }

  export interface TaxInfo {
    rate: number;
    localizeKey: string;
  }
}
