declare module 'mssql' {
  export interface ConnectionPool {
    connect(): Promise<any>;
    request(): Connection;
    close(): Promise<void>;
  }

  export interface Connection {
    input(name: string, type: any, value: any): Connection;
    query(query: string): Promise<any>;
  }

  export const TYPES: {
    VarChar: any;
    NVarChar: any;
    Text: any;
    Int: any;
    BigInt: any;
    TinyInt: any;
    SmallInt: any;
    Bit: any;
    Float: any;
    Numeric: any;
    Decimal: any;
    Real: any;
    Date: any;
    DateTime: any;
    DateTime2: any;
    DateTimeOffset: any;
    SmallDateTime: any;
    Time: any;
    UniqueIdentifier: any;
    Variant: any;
    Binary: any;
    VarBinary: any;
    Image: any;
    UDT: any;
    Geography: any;
    Geometry: any;
  };

  export class ConnectionPool {
    constructor(config: any);
    connect(): Promise<ConnectionPool>;
    request(): Connection;
    close(): Promise<void>;
  }
} 