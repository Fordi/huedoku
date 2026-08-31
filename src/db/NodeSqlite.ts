import type { Client } from "knex";
import Client_SQLite3 from "knex/lib/dialects/sqlite3/index.js";
import { DatabaseSync } from "node:sqlite";
import type {
  StatementSync,
  SQLInputValue,
  SQLOutputValue,
  StatementResultingChanges,
} from "node:sqlite";

class _NodeSQLite extends Client_SQLite3 {
  _driver() {
    return DatabaseSync;
  }

  async acquireRawConnection() {
    const connection = new this.driver(
      (this.connectionSettings as { filename: string }).filename,
      {
        enableForeignKeyConstraints: true,
      },
    );
    return connection;
  }

  async destroyRawConnection(connection: DatabaseSync) {
    return connection.close();
  }

  async _query(
    connection: DatabaseSync,
    obj: {
      bindings: SQLInputValue[];
      context: unknown;
      method: string;
      response: Record<string, SQLOutputValue>[] | StatementResultingChanges;
      returning: boolean;
      sql: string;
    },
  ) {
    if (!obj.sql) {
      throw new Error("The query is empty");
    }
    if (!connection) {
      throw new Error("No connection provided");
    }
    if (!obj.sql) {
      throw new Error("The query is empty");
    }

    const { method } = obj;
    let callMethod: keyof StatementSync;
    switch (method) {
      case "insert":
      case "update":
        callMethod = obj.returning ? "all" : "run";
        break;
      case "counter":
      case "del":
        callMethod = "run";
        break;
      default:
        callMethod = "all";
    }
    const statement = connection.prepare(obj.sql);
    if (!statement[callMethod]) {
      throw new Error(`Error calling ${callMethod} on connection.`);
    }
    const response = statement[callMethod](
      ...(obj.bindings?.map((d) => {
        if (d instanceof Date) {
          return d.valueOf();
        } else if (typeof d === "boolean") {
          return d ? 1 : 0;
        }
        return d;
      }) ?? []),
    );
    obj.response = response;
    obj.context = {
      changes: (response as StatementResultingChanges).changes,
      lastID: (response as StatementResultingChanges).lastInsertRowid,
    };
    return Promise.resolve(obj);
  }
}

export const NodeSQLite = _NodeSQLite as unknown as typeof Client;