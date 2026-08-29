import { MigrationBuilder } from "node-pg-migrate";

export const up = (pgm: MigrationBuilder) => {
  pgm.alterColumn("audit_events", "model", {
    notNull: false,
  });

  pgm.alterColumn("audit_events", "model_version", {
    notNull: false,
  });
};

export const down = (pgm: MigrationBuilder) => {
  pgm.alterColumn("audit_events", "model", {
    notNull: true,
  });

  pgm.alterColumn("audit_events", "model_version", {
    notNull: true,
  });
};