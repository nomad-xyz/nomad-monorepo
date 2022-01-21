/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('messages', {
        id: 'id',
        hash: {type: 'varchar(66)', notNull: true},
        origin: {type: 'integer', notNull: true},
        destination: {type: 'integer', notNull: true},
        sender: {type: 'varchar(42)', notNull: true},
        recipient: {type: 'varchar(42)', notNull: true},
        root: {type: 'varchar(66)', notNull: true},
        state: {type: 'integer', notNull: true},
        dispatched_at: {type: 'bigint', notNull: true},
        updated_at: {type: 'bigint', notNull: true},
        relayed_at: {type: 'bigint', notNull: true},
        processed_at: {type: 'bigint', notNull: true},
        bridge_msg_type: {type: 'varchar(14)', notNull: false},
        bridge_msg_to: {type: 'varchar(42)', notNull: false},
        bridge_msg_amount: {type: 'varchar(256)', notNull: false},
        bridge_msg_allow_fast: {type: 'boolean', notNull: false},
        bridge_msg_details_hash: {type: 'varchar(66)', notNull: false},
        bridge_msg_token_domain: {type: 'integer', notNull: false},
        bridge_msg_token_id: {type: 'varchar(42)', notNull: false},
        createdAt: {
          type: 'timestamp',
          notNull: true,
          default: pgm.func('current_timestamp'),
        },
    })
    pgm.createIndex('messages', 'id')
};

exports.down = pgm => {
    pgm.dropTable('messages')
};
