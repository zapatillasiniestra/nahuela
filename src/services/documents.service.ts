import pool from "../db/db";
import documentsRepository from "../repositories/documents.repository";
import {createDocumentProvider} from "../providers/document/DocumentProviderFactory";
import {
  DocumentRequest,
  DocumentVerification,
} from "../types/document";
import auditService from "./audit.service";
import { AppError } from "../utils/AppError";
import applicationsRepository from "../repositories/applications.repository";

async function verifyDocument(
  input: DocumentRequest
): Promise<DocumentVerification> {
  const provider = await createDocumentProvider();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const application =
      await applicationsRepository.findById(
        input.applicationId
      );

    if (!application) {
      throw new AppError(
        "application not found",
        404
      );
    }

    if (
      application.status === "approved" ||
      application.status === "rejected"
    ) {
      throw new AppError(
        "application already finalized",
        400
      );
    }

    const existing =
      await documentsRepository.findByApplicationAndHash(
        client,
        input.applicationId,
        input.fileHash
      );

    if (existing) {
      throw new AppError(
        "Document already submitted for this application",
        409
      );
    }
    const result =
      await provider.verifyDocument(input);

    await documentsRepository.create(
      client,
      input,
      provider.name,
      result
    );

    await auditService.createAuditEvent(client, {
      applicationId: input.applicationId,
      eventType: "document.verification.completed",
      provider: provider.name,
      model: "none",
      inputData: {
        documentType: input.documentType,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileHash: input.fileHash,
      },
      decision: result.verified
        ? "approved"
        : "rejected",
      riskLevel: "not_applicable",
      reasons: result.reasons,
    });

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getDocuments(
  applicationId: number
) {
  const client = await pool.connect();

  try {
    return await documentsRepository.findByApplicationId(
      client,
      applicationId
    );
  } finally {
    client.release();
  }
}

export default {
  verifyDocument,
  getDocuments,
};