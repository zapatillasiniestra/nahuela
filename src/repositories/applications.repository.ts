import pool from "../db/db";
import type { PoolClient } from "pg";
import type { Application, ApplicationStatus, SortOrder, CreateApplicationData } from "../types/application";

async function findActiveByUserAndEmail(
  userId: number,
  email: string
) {
  const result = await pool.query(
    `
    SELECT id
    FROM applications
    WHERE user_id = $1
      AND LOWER(email) = LOWER($2)
      AND status IN ('pending', 'under_review')
    LIMIT 1
    `,
    [userId, email]
  );

  return result.rows[0] ?? null;
}

async function findById(
    id: number
  ) {
  const result = await pool.query(
    `
    SELECT *
    FROM applications
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
}

async function findByIdTx(
    client: PoolClient,
    id: number
  ) {
  const result = await client.query(
    `
    SELECT *
    FROM applications
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0];
}

async function findAll() {
  const result = await pool.query(
    `
    SELECT *
    FROM applications
    `
  );

  return result.rows;
}

async function getStats(
  userId: number
) {
  const result = await pool.query(
    `
    SELECT
      status,
      COUNT(*) as total
    FROM applications
    WHERE user_id = $1
    GROUP BY status
    `,
    [userId]
  );

    return result.rows;
}

async function getRecents() {
  const result = await pool.query(
    `
    SELECT * FROM applications
    ORDER BY id DESC
    LIMIT 3
    `
  );

  return result.rows;
}

async function create(
  client: PoolClient,
  data: CreateApplicationData
): Promise<Application> {
  const {
    userId,
    fullName,
    email,
    verification
  } = data;

  const result = await client.query(
    `
    INSERT INTO applications (
      user_id,
      full_name,
      email,
      identity_provider,
      identity_provider_reference,
      identity_confidence,
      identity_decision,
      identity_reasons,
      identity_raw
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      userId,
      fullName,
      email,
      verification.provider,
      verification.externalId,
      verification.confidence,
      verification.decision,
      JSON.stringify(verification.reasons ?? []),
      JSON.stringify(verification.raw ?? {})
    ]
  );

  return result.rows[0];
}

async function getApplications(
    userId: number,
    limit: number,
    offset: number,
    status?: ApplicationStatus,
    search?: string,
    order?: SortOrder
  ) {
  let filters = ["user_id = $1"];
  let values: Array<number | string> = [userId];
  let i = 2;

  if (status) {
    filters.push(`status = $${i}`);
    values.push(status);
    i++;
  }

  if (search) {
    filters.push(`(
      full_name ILIKE $${i}
      OR email ILIKE $${i}
    )`);
    values.push(`%${search}%`);
    i++;
  }

  const sorting =
    order === "asc" ? "ASC" : "DESC";

  const whereClause = filters.join(" AND ");

  const countResult = await pool.query(
    `
    SELECT COUNT(*)
    FROM applications
    WHERE ${whereClause}
    `,
    values
  );

  const dataResult = await pool.query(
    `
    SELECT *
    FROM applications
    WHERE ${whereClause}
    ORDER BY created_at ${sorting}
    LIMIT $${i}
    OFFSET $${i + 1}
    `,
    [...values, limit, offset]
  );

  return {
    total: Number(countResult.rows[0].count),
    applications: dataResult.rows
  };
}

async function updateStatus(
    client: PoolClient,
    id: number,
    status?: ApplicationStatus
  ) {
  const result = await client.query(
    `
    UPDATE applications
    SET status = $1
    WHERE id = $2
    RETURNING *
    `,
    [status, id]
  );

  return result.rows[0];
}

export default {
  findActiveByUserAndEmail,
  findById,
  findByIdTx,
  findAll,
  getStats,
  getRecents,
  create,
  getApplications,
  updateStatus,
};