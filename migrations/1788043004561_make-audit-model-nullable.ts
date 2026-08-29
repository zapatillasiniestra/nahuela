import { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder) => {
  pgm.alterColumn("audit_events", "model", {
    notNull: false,
  });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.alterColumn("audit_events", "model", {
    notNull: true,
  });
};