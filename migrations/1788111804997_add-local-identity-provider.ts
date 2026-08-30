import { MigrationBuilder } from "node-pg-migrate";

export function up(pgm: MigrationBuilder) {
  pgm.sql(`
    INSERT INTO provider_registry (type, name, enabled)
    VALUES ('identity', 'local', true)
    ON CONFLICT DO NOTHING;
  `);
}

export function down(pgm: MigrationBuilder) {
  pgm.sql(`
    DELETE FROM provider_registry
    WHERE type = 'identity'
      AND name = 'local';
  `);
}