/**
 * Wraps the official SQLite API in a more sensible API
 * that better-sqlite & wa-sqlite and others can also conform to.
 */

import "./sqlite3.js";

import { DB as IDB, Stmt as IStmt } from "@vlcn.io/xplat-api";

/**
 * Create wrapper types for two reasons:
 * 1. Types (which we can get without wrappers)
 * 2. More ergonomic API(s)
 *
 * E.g., the base sqlite api requires passing row objects
 * that it'll then mutate and fill for you. A bit odd.
 */
export class SQLite3 {
  constructor(public readonly baseSqlite3: any) {}

  /**
   *
   * @param filename undefined file name opens an in-memory database
   */
  open(filename?: string, mode: string = "c") {
    if (filename == null || filename === ":memory:") {
      return new DB(new this.baseSqlite3.oo1.DB());
    } else {
      // wasmfs:
      // return new DB(new this.baseSqlite3.oo1.DB(filename));
      // opfsvfs:
      return new DB(new this.baseSqlite3.opfs.OpfsDb(filename, mode));
    }
  }
}

export class DB implements IDB {
  #closeListeners = new Set<() => void>();
  #inTx = false;

  constructor(private baseDb: any) {}

  execMany(sql: string[]): void {
    this.baseDb.exec(sql);
  }

  exec(sql: string, bind?: unknown | unknown[]) {
    this.baseDb.exec(sql, {
      bind,
    });
  }

  /**
   * Returns rows as JSON objects.
   * I.e., column names are keys, column values are values
   * @param sql query to run
   * @param bind values, if any, to bind
   */
  execO<T extends {}>(sql: string, bind?: unknown | unknown[]): T[] {
    return this.baseDb.exec(sql, {
      returnValue: "resultRows",
      rowMode: "object",
      bind,
    });
  }

  /**
   * Returns rows as arrays.
   * @param sql query to run
   * @param bind values, if any, to bind
   */
  execA<T extends any[]>(sql: string, bind?: unknown | unknown[]): T[] {
    return this.baseDb.exec(sql, {
      returnValue: "resultRows",
      rowMode: "array",
      bind,
    });
  }

  isOpen() {
    return this.baseDb.isOpen();
  }

  dbFilename() {
    return this.baseDb.dbFilename();
  }

  dbName() {
    return this.baseDb.dbName();
  }

  openStatementCount() {
    return this.baseDb.openStatementCount();
  }

  prepare(sql: string) {
    const stmt = this.baseDb.prepare(sql);
    return new Stmt(stmt);
  }

  close() {
    this.#closeListeners.forEach((l) => l());
    this.#closeListeners = new Set();
    this.baseDb.exec("select crsql_finalize();");
    this.baseDb.close();
  }

  createFunction(name: string, fn: (...args: any) => unknown, opts?: {}) {
    // Unfortunate requirement for better-sqlite3 compatibility
    // better-sqlite3 doesn't pass `ctx` and isn't aware of it.
    // sqlite wasm is -- https://sqlite.org/wasm/doc/tip/api-oo1.md#db-createfunction
    // and thus compensates for it in function arity
    this.baseDb.createFunction(name, (ctx: any, ...args: any) => fn(...args), {
      arity: fn.length,
      ...opts,
    });
  }

  savepoint(cb: () => void) {
    this.baseDb.savepoint(cb);
  }

  transaction(cb: () => void) {
    if (this.#inTx) {
      this.savepoint(cb);
      return;
    }

    this.#inTx = true;
    try {
      this.baseDb.transaction(cb);
    } finally {
      this.#inTx = false;
    }
  }

  onClose(l: () => void) {
    this.#closeListeners.add(l);
  }

  removeOnClose(l: () => void) {
    this.#closeListeners.delete(l);
  }
}

export class Stmt implements IStmt {
  private mode: "col" | "obj" = "obj";
  private bound = false;
  constructor(private baseStmt: any) {}

  run(...bindArgs: any[]) {
    this.bind(bindArgs);
    this.baseStmt.step();
    this.baseStmt.reset();
  }

  get(...bindArgs: any[]): any {
    this.bind(bindArgs);
    if (this.baseStmt.step()) {
      const ret = this.baseStmt.get(this.mode == "col" ? [] : {});
      this.baseStmt.reset();
      return ret;
    } else {
      this.baseStmt.reset();
      return null;
    }
  }

  all(...bindArgs: any[]) {
    this.bind(bindArgs);
    const ret: any[] = [];
    while (this.baseStmt.step()) {
      ret.push(this.baseStmt.get(this.mode == "col" ? [] : {}));
    }
    this.reset();
    return ret;
  }

  *iterate(...bindArgs: any[]) {
    this.bind(bindArgs);
    while (this.baseStmt.step()) {
      yield this.baseStmt.get(this.mode == "col" ? [] : {});
    }
    this.reset();
  }

  raw(isRaw: boolean = true): this {
    if (isRaw) {
      this.mode = "col";
    } else {
      this.mode = "obj";
    }

    return this;
  }

  bind(args: any[]) {
    if (args.length == 0) {
      return this;
    }
    if (this.bound) {
      this.baseStmt.clearBindings();
    }
    this.baseStmt.bind(args);
    this.bound = true;
    return this;
  }

  reset(clearBindings: boolean = false): this {
    if (clearBindings) {
      this.bound = false;
    }
    this.baseStmt.reset(clearBindings);
    return this;
  }

  finalize() {
    this.baseStmt.finalize();
  }
}

export default function initWasm(locators: {
  locateWasm: (f: string) => string;
  locateProxy: (f: string) => string;
}): Promise<SQLite3> {
  // @ts-ignore
  return sqlite3InitModule(locators).then((baseSqlite3: any) => {
    return new SQLite3(baseSqlite3);
  });
}
