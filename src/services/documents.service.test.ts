import pool from "../db/db";
import documentsService from "./documents.service";

describe("document verification workflow", () => {
  test("allows document verification for an active application", async () => {
    const result = await pool.query(
      `
      INSERT INTO applications (
        user_id,
        full_name,
        email,
        status,
        identity_provider,
        identity_provider_reference,
        identity_confidence,
        identity_decision,
        identity_reasons,
        identity_raw
      )
      VALUES (
        4,
        'Document Test User',
        $1,
        'pending',
        'mock',
        'test-reference',
        0.99,
        'approved',
        '[]',
        '{}'
      )
      RETURNING id
      `,
      [`document-${Date.now()}@example.com`]
    );

    const applicationId = result.rows[0].id;

    try {
      const document = await documentsService.verifyDocument({
        applicationId,
        documentType: "dni",
        fileName: "test.png",
        mimeType: "image/png",
        fileHash: `hash-${Date.now()}`
      });

      expect(document).toBeDefined();
    } finally {
      await pool.query(
        "DELETE FROM applications WHERE id = $1",
        [applicationId]
      );
    }
  });

  test("rejects document verification for an approved application", async () => {
    const result = await pool.query(
      `
      INSERT INTO applications (
        user_id,
        full_name,
        email,
        status,
        identity_provider,
        identity_provider_reference,
        identity_confidence,
        identity_decision,
        identity_reasons,
        identity_raw
      )
      VALUES (
        4,
        'Approved Test User',
        $1,
        'approved',
        'mock',
        'test-reference',
        0.99,
        'approved',
        '[]',
        '{}'
      )
      RETURNING id
      `,
      [`approved-${Date.now()}@example.com`]
    );

    const applicationId = result.rows[0].id;

    try {
      await expect(
        documentsService.verifyDocument({
          applicationId,
          documentType: "dni",
          fileName: "test.png",
          mimeType: "image/png",
          fileHash: `hash-${Date.now()}`
        })
      ).rejects.toThrow("application already finalized");
    } finally {
      await pool.query(
        "DELETE FROM applications WHERE id = $1",
        [applicationId]
      );
    }
  });

  test("rejects document verification for a rejected application", async () => {
    const result = await pool.query(
      `
      INSERT INTO applications (
        user_id,
        full_name,
        email,
        status,
        identity_provider,
        identity_provider_reference,
        identity_confidence,
        identity_decision,
        identity_reasons,
        identity_raw
      )
      VALUES (
        4,
        'Rejected Test User',
        $1,
        'rejected',
        'mock',
        'test-reference',
        0.99,
        'approved',
        '[]',
        '{}'
      )
      RETURNING id
      `,
      [`rejected-${Date.now()}@example.com`]
    );

    const applicationId = result.rows[0].id;

    try {
      await expect(
        documentsService.verifyDocument({
          applicationId,
          documentType: "dni",
          fileName: "test.png",
          mimeType: "image/png",
          fileHash: `hash-${Date.now()}`
        })
      ).rejects.toThrow("application already finalized");
    } finally {
      await pool.query(
        "DELETE FROM applications WHERE id = $1",
        [applicationId]
      );
    }
  });

  test("rejects the same document twice for the same application", async () => {
  const result = await pool.query(
    `
    INSERT INTO applications (
      user_id,
      full_name,
      email,
      status,
      identity_provider,
      identity_provider_reference,
      identity_confidence,
      identity_decision,
      identity_reasons,
      identity_raw
    )
    VALUES (
      4,
      'Duplicate Document Test',
      $1,
      'pending',
      'mock',
      'test-reference',
      0.99,
      'approved',
      '[]',
      '{}'
    )
    RETURNING id
    `,
    [`duplicate-${Date.now()}@example.com`]
  );

  const applicationId = result.rows[0].id;
  const fileHash = `duplicate-hash-${Date.now()}`;

  try {
    await documentsService.verifyDocument({
      applicationId,
      documentType: "dni",
      fileName: "test.png",
      mimeType: "image/png",
      fileHash
    });

    await expect(
      documentsService.verifyDocument({
        applicationId,
        documentType: "dni",
        fileName: "test.png",
        mimeType: "image/png",
        fileHash
      })
    ).rejects.toThrow(
      "Document already submitted for this application"
    );
  } finally {
    await pool.query(
      "DELETE FROM applications WHERE id = $1",
      [applicationId]
    );
  }
});

  afterAll(async () => {
    await pool.end();
  });
});