import { Change } from "@vlcn.io/partykit-common";
import { Transport } from "./transport/Transport";

export interface DB {
  pullChangeset(since: [bigint, number]): PromiseLike<readonly Change[]>;
  applyChangeset(changes: readonly Change[]): PromiseLike<void>;

  getLastSeen(siteId: Uint8Array): PromiseLike<[bigint, number]>;
  setLastSeen(siteId: Uint8Array, end: [bigint, number]): PromiseLike<void>;

  onChange(cb: () => void): () => void;
}

export default {
  dbProvider: (dbname: string): PromiseLike<DB> => {
    throw new Error(
      "You must configure a db provider. `config.dbProvider = yourProvider;`"
    );
  },

  transportProvider: <T>(
    dbname: string,
    transportOpts: T
  ): Promise<Transport> => {
    throw new Error(
      "You must configure a transport provider. `confgi.transportProvider = yourProvider;`"
    );
  },
};