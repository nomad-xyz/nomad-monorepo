import { NomadMessage } from './consumer';
import { Pool } from 'pg';

// expand(3, 2) returns "($1, $2), ($3, $4), ($5, $6)"
function expand(rowCount: number, columnCount: number, startAt = 1) {
  var index = startAt;
  return Array(rowCount)
    .fill(0)
    .map(
      (v) =>
        `(${Array(columnCount)
          .fill(0)
          .map((v) => `$${index++}`)
          .join(', ')})`,
    )
    .join(', ');
}

export class DB {
  pool: Pool;
  syncedOnce: boolean;

  constructor() {
    this.syncedOnce = false;
    this.pool = new Pool();
  }

  async connect() {
    await this.pool.connect();
  }

  get startupSync() {
    const value = this.syncedOnce;
    this.syncedOnce = true;
    return !value;
  }

  async getMessageByEvm(tx: string): Promise<NomadMessage> {
    const query = `SELECT origin, destination, nonce, root, leaf_index, raw, block, sender, dispatched_at, updated_at, relayed_at, received_at, processed_at, hash FROM messages where evm = $1;`;
    const result = await this.pool.query(query, [tx.toLowerCase()]);
    const entry = result.rows[0];
    return NomadMessage.fromDB(entry.origin, 
      entry.destination,
      entry.nonce,
      entry.root,
      entry.hash,
      entry.leaf_index,
      entry.raw,
      entry.block,
      entry.dispatched_at,
      entry.updated_at,
      entry.relayed_at,
      entry.received_at,
      entry.processed_at,
      entry.sender,
      tx,
    )
  }

  async getMessageByHash(hash: string): Promise<NomadMessage> {
    const query = `SELECT origin, destination, nonce, root, leaf_index, raw, block, sender, evm, dispatched_at, updated_at, relayed_at, received_at, processed_at FROM messages where hash = $1;`;
    const result = await this.pool.query(query, [hash.toLowerCase()]);
    const entry = result.rows[0];
    return NomadMessage.fromDB(entry.origin, 
      entry.destination,
      entry.nonce,
      entry.root,
      hash,
      entry.leaf_index,
      entry.raw,
      entry.block,
      entry.dispatched_at,
      entry.updated_at,
      entry.relayed_at,
      entry.received_at,
      entry.processed_at,
      entry.sender,
      entry.evm,
    )
  }

  async insertMessage(messages: NomadMessage[]) {
    const rows = messages.length;
    if (!rows) return;
    const columns = 25;
    const query = `INSERT INTO messages (hash, origin, destination, nonce, nomad_sender, nomad_recipient, root, state, dispatched_at, updated_at, relayed_at, received_at, processed_at, bridge_msg_type, recipient, bridge_msg_amount, bridge_msg_allow_fast, bridge_msg_details_hash, bridge_msg_token_domain, bridge_msg_token_id, sender, raw, leaf_index, block, evm) VALUES ${expand(
      rows,
      columns,
    )};`;
    const values = messages.map((m) => m.intoDB()).flat();
    return await this.pool.query(query, values);
  }

  async updateMessage(messages: NomadMessage[]) {
    const rows = messages.length;
    if (!rows) return;
    const promises = messages.map((m) => {
      const query = `UPDATE messages SET
        origin = $2,
        destination = $3,
        nonce = $4,
        nomad_sender = $5,
        nomad_recipient = $6,
        root = $7,
        state = $8,
        dispatched_at = $9,
        updated_at = $10,
        relayed_at = $11,
        received_at = $12,
        processed_at = $13,
        bridge_msg_type = $14,
        recipient = $15,
        bridge_msg_amount = $16,
        bridge_msg_allow_fast = $17,
        bridge_msg_details_hash = $18,
        bridge_msg_token_domain = $19,
        bridge_msg_token_id = $20,
        sender = $21,
        raw = $22,
        leaf_index = $23,
        block = $24,
        evm = $25
        WHERE hash = $1
        `;
      return this.pool.query(query, m.intoDB());
    });

    return await Promise.all(promises);
  }

  async getExistingHashes(): Promise<string[]> {
    const res = await this.pool.query(`select hash from messages;`);
    return res.rows.map((r) => r.hash) as string[];
  }

  async getAllKeyPair(namespace: string): Promise<Map<string, string>> {
    const res = await this.pool.query(
      `select key, value from kv_storage where namespace = $1;`,
      [namespace],
    );
    return new Map(res.rows.map((r) => [r.key, r.value]));
  }

  async setKeyPair(namespace: string, k: string, v: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO kv_storage (namespace, key, value)
        VALUES($1,$2,$3) 
        ON CONFLICT (namespace, key) 
        DO 
           UPDATE SET value = $3;`,
      [namespace, k, v],
    );
  }
}
