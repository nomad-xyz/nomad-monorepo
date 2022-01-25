/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable("messages", {
    id: "id",
    hash: { type: "varchar(66)", notNull: true, unique: true }, // Nomad TX id
    origin: { type: "integer", notNull: true },
    destination: { type: "integer", notNull: true },
    nonce: { type: "integer", notNull: true },
    nomad_sender: { type: "varchar(42)", notNull: true }, // Nomad sender (bridge router)
    nomad_recipient: { type: "varchar(42)", notNull: true }, // Nomad recipient (bridge router)
    root: { type: "varchar(66)", notNull: true },
    state: { type: "integer", notNull: true }, // one of several states: Dispatched(0), Updated(1), Relayed(2), Processed(3)
    block: { type: "integer", notNull: true }, // one of several states: Dispatched(0), Updated(1), Relayed(2), Processed(3)
    dispatched_at: { type: "bigint", notNull: true }, // TS at which the transaction got to state dispatched
    updated_at: { type: "bigint", notNull: true }, // TS at which the transaction got to state updated
    relayed_at: { type: "bigint", notNull: true }, // TS at which the transaction got to state relayed
    received_at: { type: "bigint", notNull: true }, // TS at which the transaction got to state received
    processed_at: { type: "bigint", notNull: true }, // TS at which the transaction got to state processed
    // Bridge message internals
    sender: { type: "varchar(42)", notNull: false }, // sender
    bridge_msg_type: { type: "varchar(14)", notNull: false }, // Mostly 'transaction'
    recipient: { type: "varchar(42)", notNull: false }, // Real recipient on destination domain
    bridge_msg_amount: { type: "varchar(256)", notNull: false }, // Amount of Token
    bridge_msg_allow_fast: { type: "boolean", notNull: false }, // Allow fast?
    bridge_msg_details_hash: { type: "varchar(66)", notNull: false }, // Details hash - don't know what it is (need to do homework)
    bridge_msg_token_domain: { type: "integer", notNull: false }, // Token domain
    bridge_msg_token_id: { type: "varchar(42)", notNull: false }, // Token id (address)
    raw: { type: "varchar", notNull: true },
    leaf_index: { type: "varchar(256)", notNull: true },
    evm: { type: "varchar(66)", notNull: false },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("messages", "id");

  pgm.createTable("kv_storage", {
    id: "id",
    namespace: { type: "varchar", notNull: true },
    key: { type: "varchar", notNull: true },
    value: { type: "varchar", notNull: true },
    createdAt: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.createIndex("kv_storage", "id");
  pgm.addConstraint("kv_storage", "unique_namespace_key", {
    unique: ["namespace", "key"],
  });
};

exports.down = (pgm) => {
  pgm.dropTable("messages");
  pgm.dropConstraint("kv_storage", "unique_namespace_key");
  pgm.dropTable("kv_storage");
};
