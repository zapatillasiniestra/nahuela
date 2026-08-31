import pool from "../../db/db";
import type { DocumentProvider } from "./DocumentProvider";
import MockDocumentProvider from "./MockDocumentProvider";

async function getDocumentProviderName(): Promise<string> {
  const result = await pool.query(
    `
    SELECT name
    FROM provider_registry
    WHERE type = 'document'
      AND enabled = true
    ORDER BY id ASC
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    throw new Error(
      "No active document provider configured"
    );
  }

  return result.rows[0].name;
}

export async function createDocumentProvider(): Promise<DocumentProvider> {
  const name = await getDocumentProviderName();

  switch (name) {
    case "mock":
      return new MockDocumentProvider();

    default:
      throw new Error(
        `Unknown document provider: ${name}`
      );
  }
}