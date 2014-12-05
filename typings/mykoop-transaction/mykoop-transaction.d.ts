// Type definitions for module v0.0.0
// Project: https://github.com/my-koop/service.website
// Definitions by: Michael Ferris <https://github.com/Cellule/>
// Definitions: https://github.com/my-koop/type.definitions

/// <reference path="../mykoop/mykoop.d.ts" />
/// <reference path="./interfaces.d.ts" />
/// <reference path="./dbQueryStruct.d.ts" />
declare module mktransaction {

  export interface successCallback {
    (err: Error): void;
  }
  export interface saveNewBillCallback {
    (err: Error, res?: {idBill: number}): void;
  }
  export interface listBillsCallback {
    (err: Error, res?: Transaction.Bill[]): void;
  }
  export interface Module extends mykoop.IModule {
    addBillTransaction(
      params: Transaction.AddBillTransaction,
      callback: successCallback
    );
    openBill(
      params: Transaction.OpenBill,
      callback: successCallback
    );
    closeBill(
      params: Transaction.BillId,
      callback: successCallback
    );
    saveNewBill(
      params: Transaction.NewBill,
      callback: saveNewBillCallback
    );
    listBills(
      params: Transaction.ListBill,
      callback: listBillsCallback
    );

    getBill(
      params: Transaction.GetBill.Params,
      callback: Transaction.GetBill.Callback
    );
    __getBill(
      connection: mysql.IConnection,
      params: Transaction.GetBill.Params,
      callback: Transaction.GetBill.Callback
    );

    deleteBill(
      params: Transaction.DeleteBill.Params,
      callback: Transaction.DeleteBill.Callback
    );
    __deleteBill(
      connection: mysql.IConnection,
      params: Transaction.DeleteBill.Params,
      callback: Transaction.DeleteBill.Callback
    );
    getBillHistory(
      params: number,
      callback: (err, bills) => void
    );
  }

}

