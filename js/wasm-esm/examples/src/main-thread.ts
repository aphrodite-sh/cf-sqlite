import sqliteWasm from "@vlcn.io/crsqlite-wasm";
// @ts-ignore
import { stringify as uuidStringify } from "uuid";

import wasmUrl from "@vlcn.io/crsqlite-wasm/dist/sqlite3.wasm?url";
import proxyUrl from "@vlcn.io/crsqlite-wasm/dist/sqlite3-opfs-async-proxy.js?url";

async function run() {
  const sqlite = await sqliteWasm({
    locateWasm: (f: string) => wasmUrl,
    locateProxy: (f: string) => proxyUrl,
  });

  const db = sqlite.open(":memory:");

  // @ts-ignore
  window.db = db;
  let rows: any[] = [];

  db.exec("CREATE TABLE foo (a primary key, b);");
  db.exec("SELECT crsql_as_crr('foo');");
  db.exec("INSERT INTO foo VALUES (1, 2);");
  rows = db.execA("select crsql_dbversion();");
  console.log("DB Version: ", rows[0][0]);
  rows = db.execA("select crsql_siteid();");
  console.log("Site ID: ", uuidStringify(rows[0][0]));

  rows = db.execA("select * from crsql_changes();");
  console.log("Changes: ", rows);

  rows = db.execA("SELECT * FROM foo");
  console.log(rows[0]);

  db.close();
}

run();
