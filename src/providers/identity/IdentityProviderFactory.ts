import type { IdentityProvider } from "./IdentityProvider";
import { LocalIdentityProvider } from "./LocalIdentityProvider";
import { MockIdentityProvider } from "./MockIdentityProvider";
import { ExternalIdentityProvider } from "./ExternalIdentityProvider";
import { SumsubProvider } from "../identity/SumsubProvider";
import pool from "../../db/db";

export async function createIdentityProvider(): Promise<IdentityProvider> {
  const result = await pool.query(
    `
    SELECT name
    FROM provider_registry
    WHERE type = 'identity'
      AND enabled = true
    ORDER BY id
    LIMIT 1
    `
  );

  if (result.rows.length === 0) {
    throw new Error("No active identity provider configured");
  }

  const provider = result.rows[0].name;

  switch (provider) {
    case "local":
      return new LocalIdentityProvider();

    case "mock":
      return new MockIdentityProvider();

    case "external":
      return new ExternalIdentityProvider();

    case "sumsub":
      return new SumsubProvider();

    default:
      throw new Error(
        `Unsupported identity provider: ${provider}`
      );
  }
}