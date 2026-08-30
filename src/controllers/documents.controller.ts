import {
  Request,
  Response,
  NextFunction,
} from "express";

import documentsService from "../services/documents.service";
import { AppError } from "../utils/AppError";
import applicationsService from "../services/applications.service";

async function verifyDocument(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const applicationId = Number(
      req.params.id
    );

    await applicationsService.authorizeApplicationAccess(
      applicationId,
      req.user.userId,
      req.user.role
    );

    if (!Number.isInteger(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    const {
      documentType,
      fileName,
      mimeType,
      fileHash,
    } = req.body;

    if (
      !documentType ||
      !fileName ||
      !mimeType ||
      !fileHash
    ) {
      throw new AppError(
        "documentType, fileName, mimeType and fileHash are required",
        400
      );
    }

    const result =
      await documentsService.verifyDocument({
        applicationId,
        documentType,
        fileName,
        mimeType,
        fileHash,
      });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
    return;
  }
}

async function getDocuments(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const applicationId = Number(
      req.params.id
    );

    await applicationsService.authorizeApplicationAccess(
      applicationId,
      req.user.userId,
      req.user.role
    );

    if (!Number.isInteger(applicationId)) {
      throw new AppError(
        "invalid application id",
        400
      );
    }

    const result =
      await documentsService.getDocuments(
        applicationId
      );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
    return;
  }
}

export default {
  verifyDocument,
  getDocuments,
};