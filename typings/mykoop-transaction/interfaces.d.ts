

declare module Transaction {
  export interface successCallback {
    (err?: Error): void;
  }

  export interface AddBillTransaction {
    idBill: number;
    amount: number;
  }

  export interface NewBill {
    archiveBill: boolean;
    customerEmail?: string;
    discounts?: Discount[];
    idEvent?: number;
    items: {
      id: number;
      price: number;
      quantity: number;
    }[];
    notes?: string;
    total: number;
    category: string;
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
    transactionCount: number;
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

  module GetBill {
    export interface Params {
      id: number;
    }
    export interface CallbackResult extends Bill {}
    export interface Callback {
      (err: Error, result?: CallbackResult): void;
    }
  }

  module DeleteBill {
    export interface Params {
      id: number;
    }
    export interface Callback extends successCallback {}
  }
}
