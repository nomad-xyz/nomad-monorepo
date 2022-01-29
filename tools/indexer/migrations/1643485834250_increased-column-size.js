/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.alterColumn('messages', 'bridge_msg_type', {type: 'varchar(20)', notNull: false});
};

exports.down = pgm => {
    pgm.alterColumn('messages', 'bridge_msg_type', {type: 'varchar(14)', notNull: false});
};
