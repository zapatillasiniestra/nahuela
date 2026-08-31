import pool from "../db/db";
import { AppError } from "../utils/AppError";

async function getProviders() {
  const result = await pool.query(`
    SELECT
      id,
      type,
      name,
      enabled
    FROM provider_registry
    ORDER BY type ASC, id ASC
  `);

  return result.rows;
}

async function updateProvider(
  type: string,
  name: string,
  enabled: boolean
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT id
      FROM provider_registry
      WHERE type = $1
        AND name = $2
      FOR UPDATE
      `,
      [type, name]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        "Provider not found",
        404
      );
    }

    /*
     * Only one provider can be active
     * for each provider type.
     */
    if (enabled) {
      await client.query(
        `
        UPDATE provider_registry
        SET enabled = false
        WHERE type = $1
        `,
        [type]
      );
    }

    const updated =
      await client.query(
        `
        UPDATE provider_registry
        SET enabled = $3
        WHERE type = $1
          AND name = $2
        RETURNING
          id,
          type,
          name,
          enabled
        `,
        [type, name, enabled]
      );

    await client.query("COMMIT");

    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default {
  getProviders,
  updateProvider,
};