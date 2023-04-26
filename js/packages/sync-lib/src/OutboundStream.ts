/**
 * We could use this in our p2p setup too.
 * Starts an outbound stream. Streams either all changes made to the db
 * or only local writes that took place on the db.
 */
export default class OutboundStream {
  constructor(type: "LOCAL_WRITES" | "ALL_WRITES") {}
}