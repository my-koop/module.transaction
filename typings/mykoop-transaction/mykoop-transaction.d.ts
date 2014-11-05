// Type definitions for module v0.0.0
// Project: https://github.com/my-koop/service.website
// Definitions by: Michael Ferris <https://github.com/Cellule/>
// Definitions: https://github.com/my-koop/type.definitions

/// <reference path="../mykoop/mykoop.d.ts" />
declare module mktransaction {

  export interface ModuleClass1 {
    value: string;
    id: number;
  }
  export interface Module extends mykoop.IModule {
    method1(
      inParam: {id:number; value:string},
      callback: (err: Error, res ?: ModuleClass1) => void
    ): void;
  }

}

