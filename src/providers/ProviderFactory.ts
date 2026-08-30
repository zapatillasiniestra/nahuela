import pool from "../db/db";

import type { IdentityProvider } from "./identity/IdentityProvider";
import { LocalIdentityProvider } from "./identity/LocalIdentityProvider";
import { MockIdentityProvider } from "./identity/MockIdentityProvider";
import { ExternalIdentityProvider } from "./identity/ExternalIdentityProvider";
import { SumsubProvider } from "./identity/SumsubProvider";

import type { ComplianceProvider } from "./compliance/ComplianceProvider";
import { LocalComplianceProvider } from "./compliance/LocalComplianceProvider";
import { MockComplianceProvider } from "./compliance/MockComplianceProvider";
import { ExternalComplianceProvider } from "./compliance/ExternalComplianceProvider";

import type { AIProvider } from "./ai/AIProvider";
import { MockAIProvider } from "./ai/MockAIProvider";


async function getProvider(type: string): Promise<string> {
  const result = await pool.query(
    `
    SELECT name
    FROM provider_registry
    WHERE type = $1
      AND enabled = true
    ORDER BY id ASC
    LIMIT 1
    `,
    [type]
  );

  if (result.rows.length === 0) {
    throw new Error(
      `No active ${type} provider configured`
    );
  }

  return result.rows[0].name;
}


export async function createIdentityProvider(): Promise<IdentityProvider> {
  const name = await getProvider("identity");

  switch (name) {
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
        `Unknown identity provider: ${name}`
      );
  }
}


export async function createComplianceProvider(): Promise<ComplianceProvider> {
  const name = await getProvider("compliance");

  switch (name) {
    case "local":
      return new LocalComplianceProvider();

    case "mock":
      return new MockComplianceProvider();

    case "external":
      return new ExternalComplianceProvider();

    default:
      throw new Error(
        `Unknown compliance provider: ${name}`
      );
  }
}


export async function createAIProvider(): Promise<AIProvider> {
  const name = await getProvider("ai");

  switch (name) {
    case "mock":
      return new MockAIProvider();

    default:
      throw new Error(
        `Unknown AI provider: ${name}`
      );
  }
}