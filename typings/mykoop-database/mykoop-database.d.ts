// Type definitions for database v0.0.1
// Project: https://github.com/my-koop/service.website
// Definitions by: Michael Ferris <https://github.com/Cellule/>
// Definitions: https://github.com/my-koop/type.definitions

/// <reference path="../mykoop/mykoop.d.ts" />

declare module mysql {
  export interface IConnection{}
  export interface IConnectionConfig{}
}

declare module mykoop {
  export interface IModule{}
}

declare module mkdatabase {

  export interface ConnectionCallback{
    (err: any, connection: mysql.IConnection) : void;
  }

  export interface Module extends mykoop.IModule {
    connect(dbConfig: mysql.IConnectionConfig): mysql.IConnection;
    getConnection(callback: ConnectionCallback): void;
  }

}

