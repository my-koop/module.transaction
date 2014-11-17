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
  }

}

