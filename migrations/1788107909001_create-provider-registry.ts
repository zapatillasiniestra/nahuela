import { MigrationBuilder } from "node-pg-migrate";

export function up(pgm: MigrationBuilder) {
  pgm.createTable("provider_registry", {
    id: "id",
    type: {
      type: "varchar(50)",
      notNull: true,
    },
    name: {
      type: "varchar(100)",
      notNull: true,
    },
    enabled: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addConstraint(
    "provider_registry",
    "provider_registry_type_name_unique",
    {
      unique: ["type", "name"],
    }
  );
}

export function down(pgm: MigrationBuilder) {
  pgm.dropTable("provider_registry");
}