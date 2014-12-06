function makeSelectBillQuery(whereClause: string) {
  return (
    "SELECT \
      b.idBill,\
      coalesce(sum(amount),0) AS paid,\
      total,\
      createdDate,\
      closedDate,\
      idUser,\
      u.firstname AS customerFirstName,\
      u.lastname AS customerLastName,\
      u.email AS customerEmail,\
      coalesce(count(bt.idTransaction),0) AS transactionCount,\
      b.discounts,\
      b.notes,\
      b.taxes,\
      b.idEvent,\
      e.name AS eventName\
    FROM bill b\
    LEFT JOIN bill_transaction bt ON b.idBill=bt.idBill\
    LEFT JOIN transaction t ON bt.idTransaction=t.idTransaction \
    LEFT JOIN user u on b.idUser = u.id\
    LEFT JOIN event e on b.idEvent = e.idEvent " +
    whereClause +
    " GROUP BY b.idBill"
  );
}

class BillInformation implements mktransaction.Bill {
  static Get1BillQuery = makeSelectBillQuery("WHERE b.idBill=?");
  static GetOpenBillsQuery = makeSelectBillQuery("WHERE closedDate IS NULL");
  static GetCloseBillsQuery = makeSelectBillQuery("WHERE closedDate IS NOT NULL");

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
  discounts: mktransaction.Discount[];
  notes: string;
  taxes: mktransaction.TaxInfo[];
  idEvent: number;
  eventName: string;

  constructor(dbQueryResult) {
    this.idBill = dbQueryResult.idBill;
    this.paid = dbQueryResult.paid;
    this.total = dbQueryResult.total;
    this.createdDate = dbQueryResult.createdDate;
    this.closedDate = dbQueryResult.closedDate;
    this.idUser = dbQueryResult.idUser;
    this.customerFirstName = dbQueryResult.customerFirstName;
    this.customerLastName = dbQueryResult.customerLastName;
    this.customerEmail = dbQueryResult.customerEmail;
    this.transactionCount = dbQueryResult.transactionCount;
    try {
      this.discounts = JSON.parse(dbQueryResult.discounts);
    } catch(e) {
      this.discounts = [];
    }
    this.notes = dbQueryResult.notes;
    try {
      this.taxes = JSON.parse(dbQueryResult.taxes);
    } catch(e) {
      this.taxes = [];
    }
    this.idEvent = dbQueryResult.idEvent;
    this.eventName = dbQueryResult.eventName;
  }
}

export = BillInformation
