import {
  createIdentityProvider,
} from "./IdentityProviderFactory";

import { LocalIdentityProvider } from "./LocalIdentityProvider";
import { MockIdentityProvider } from "./MockIdentityProvider";
import { SumsubProvider } from "../identity/SumsubProvider";

import pool from "../../db/db";

describe("IdentityProviderFactory", () => {
afterEach(async () => {
  await pool.query(`
    UPDATE provider_registry
    SET enabled = false
    WHERE type = 'identity'
  `);

  await pool.query(`
    UPDATE provider_registry
    SET enabled = true
    WHERE type = 'identity'
      AND name = 'local'
  `);
});

  test("creates local provider", async () => {
    await pool.query(`
      UPDATE provider_registry
      SET enabled = false
      WHERE type = 'identity'
    `);

    await pool.query(`
      UPDATE provider_registry
      SET enabled = true
      WHERE type = 'identity'
        AND name = 'local'
    `);

    const provider =
      await createIdentityProvider();

    expect(provider).toBeInstanceOf(
      LocalIdentityProvider
    );
  });

  test("creates mock provider", async () => {
    await pool.query(`
      UPDATE provider_registry
      SET enabled = false
      WHERE type = 'identity'
    `);

    await pool.query(`
      UPDATE provider_registry
      SET enabled = true
      WHERE type = 'identity'
        AND name = 'mock'
    `);

    const provider =
      await createIdentityProvider();

    expect(provider).toBeInstanceOf(
      MockIdentityProvider
    );
  });

  test("creates Sumsub provider", async () => {
    await pool.query(`
      UPDATE provider_registry
      SET enabled = false
      WHERE type = 'identity'
    `);

    await pool.query(`
      UPDATE provider_registry
      SET enabled = true
      WHERE type = 'identity'
        AND name = 'sumsub'
    `);

    const provider =
      await createIdentityProvider();

    expect(provider).toBeInstanceOf(
      SumsubProvider
    );
  });

  test("rejects when no identity provider is enabled", async () => {
    await pool.query(`
      UPDATE provider_registry
      SET enabled = false
      WHERE type = 'identity'
    `);

    await expect(
      createIdentityProvider()
    ).rejects.toThrow(
      "No active identity provider configured"
    );
  });

  test("rejects unsupported provider", async () => {
    await pool.query(`
      UPDATE provider_registry
      SET enabled = false
      WHERE type = 'identity'
    `);

    await pool.query(`
      INSERT INTO provider_registry
        (type, name, enabled)
      VALUES
        ('identity', 'invalid', true)
    `);

    await expect(
      createIdentityProvider()
    ).rejects.toThrow(
      "Unsupported identity provider: invalid"
    );

    await pool.query(`
      DELETE FROM provider_registry
      WHERE type = 'identity'
        AND name = 'invalid'
    `);
  });
});