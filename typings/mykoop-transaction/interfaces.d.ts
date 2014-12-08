

declare module mktransaction {
  export interface successCallback {
    (err?: Error): void;
  }

  export interface AddBillTransaction {
    idBill: number;
    amount: number;
  }

  export interface BillItem {
    id: number;
    price: number;
    quantity: number;
    name: string;
  }

  export interface NewBill {
    archiveBill: boolean;
    customerEmail?: string;
    discounts?: Discount[];
    idEvent?: number;
    items: BillItem[];
    notes?: string;
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
    idBill: number;
    paid: number;
    total: number;
    createdDate: string;
    closedDate: string; // can be null
    idUser: number; // can be null
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    transactionCount: number;
    discounts: Discount[];
    notes: string;
    taxes: TaxInfo[];
    idEvent: number;
    eventName: string;
  }

  export interface Discount {
    type: number;
    value: number;
    isAfterTax: boolean;
  }

  export interface TaxInfo {
    rate: number;
    name: string;
  }

  module GetTaxInformation {
    export interface Params {}
    export interface Result extends Array<TaxInfo> {}
    export interface Callback {
      (err, taxes?: Result): void;
    }
  }

  export interface FinancialReport {
    category: string;
    total: number;
    totalSales: number;
    totalRefunds: number;
    transactions: number;
    sales: number;
    refunds: number;
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

  module GetBillHistory {
    export interface Params {
      id: number;
    }
    export interface Result {
      bills: {
        idbill: number;
        createdDate: Date;
        isClosed: number;
        total: number;
        paid: number;
      }[];
    }
    export interface Callback {
      (err: Error, result?: Result)
    }
  }

  module GetBillDetails {
    export interface Params {
      id: number;
    }
    export interface Result extends Bill {
      items: BillItem[];
    }
    export interface Callback {
      (err: Error, res?: Result): void;
    }
  }

  module UpdateBill {
    export interface Params {
      id: number;
      notes: string;
      idEvent: number;
    }
    export interface Callback {
      (err?: Error): void;
    }
  }

  module GetCustomerInformations {
    export interface Params {
      email: string;
    }
    export interface Result {
      id: number;
      firstName: string;
      lastName: string;
      // null if not a member
      subscriptionExpiration: Date;
      openBillCount: number;
      unpaidAmount: number;
    }
    export interface Callback {
      (err: Error, res?: Result): void;
    }
  }
}
