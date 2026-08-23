import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE UNIQUE INDEX applications_active_user_email_unique
    ON applications (user_id, LOWER(email))
    WHERE status IN ('pending', 'under_review');
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP INDEX IF EXISTS applications_active_user_email_unique;
  `);
}