import type { PoolClient } from "pg";

async function findAll(client: PoolClient) {
  const result = await client.query(`
    SELECT *
    FROM provider_registry
    ORDER BY type, name
  `);

  return result.rows;
}

async function updateEnabled(
  client: PoolClient,
  type: string,
  name: string,
  enabled: boolean
) {
  const result = await client.query(
    `
    UPDATE provider_registry
    SET enabled = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE type = $1
      AND name = $2
    RETURNING *
    `,
    [type, name, enabled]
  );

  return result.rows[0] ?? null;
}

export default {
  findAll,
  updateEnabled,
};