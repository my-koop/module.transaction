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
    (err: Error, res?: mktransaction.Bill[]): void;
  }
  export interface Module extends mykoop.IModule {
    addBillTransaction(
      params: mktransaction.AddBillTransaction,
      callback: successCallback
    );
    openBill(
      params: mktransaction.OpenBill,
      callback: successCallback
    );
    closeBill(
      params: mktransaction.BillId,
      callback: successCallback
    );
    saveNewBill(
      params: mktransaction.NewBill,
      callback: saveNewBillCallback
    );
    listBills(
      params: mktransaction.ListBill,
      callback: listBillsCallback
    );

    getBill(
      params: mktransaction.GetBill.Params,
      callback: mktransaction.GetBill.Callback
    );
    __getBill(
      connection: mysql.IConnection,
      params: mktransaction.GetBill.Params,
      callback: mktransaction.GetBill.Callback
    );

    getBillDetails(
      params: mktransaction.GetBillDetails.Params,
      callback: mktransaction.GetBillDetails.Callback
    );
    __getBillDetails(
      connection: mysql.IConnection,
      params: mktransaction.GetBillDetails.Params,
      callback: mktransaction.GetBillDetails.Callback
    );

    deleteBill(
      params: mktransaction.DeleteBill.Params,
      callback: mktransaction.DeleteBill.Callback
    );
    __deleteBill(
      connection: mysql.IConnection,
      params: mktransaction.DeleteBill.Params,
      callback: mktransaction.DeleteBill.Callback
    );

    updateBill(
      params: mktransaction.UpdateBill.Params,
      callback: mktransaction.UpdateBill.Callback
    );
    __updateBill(
      connection: mysql.IConnection,
      params: mktransaction.UpdateBill.Params,
      callback: mktransaction.UpdateBill.Callback
    );
    getBillHistory(
      params: mktransaction.GetBillHistory.Params,
      callback: mktransaction.GetBillHistory.Callback
    );
    __getBillHistory(
      connection: mysql.IConnection,
      params: mktransaction.GetBillHistory.Params,
      callback: mktransaction.GetBillHistory.Callback
    );
  }

}

