

declare module Transaction {

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
