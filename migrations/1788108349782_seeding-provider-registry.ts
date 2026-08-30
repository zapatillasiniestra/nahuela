import { MigrationBuilder } from "node-pg-migrate";

export function up(pgm: MigrationBuilder) {
  pgm.sql(`
    INSERT INTO provider_registry (type, name, enabled)
    VALUES
      ('identity', 'mock', true),
      ('identity', 'sumsub', false),
      ('compliance', 'local', true),
      ('compliance', 'mock', false),
      ('document', 'mock', true),
      ('ai', 'mock', true)
  `);
}

export function down(pgm: MigrationBuilder) {
  pgm.sql(`
    DELETE FROM provider_registry
    WHERE
      (type, name) IN (
        ('identity', 'mock'),
        ('identity', 'sumsub'),
        ('compliance', 'local'),
        ('compliance', 'mock'),
        ('document', 'mock'),
        ('ai', 'mock')
      )
  `);
}