import { Request, Response, NextFunction } from "express";
import providerRegistryService from "../services/provider-registry.service";
import { AppError } from "../utils/AppError";

async function getProviders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const providers =
      await providerRegistryService.getProviders();

    return res.status(200).json(providers);
  } catch (error) {
    return next(error);
  }
}

async function updateProvider(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const { type, name } = req.params;
    const { enabled } = req.body;

    if (
      typeof type !== "string" ||
      typeof name !== "string"
    ) {
      throw new AppError(
        "Invalid provider",
        400
      );
    }

    if (typeof enabled !== "boolean") {
      throw new AppError(
        "enabled must be a boolean",
        400
      );
    }

    const provider =
      await providerRegistryService.updateProvider(
        type,
        name,
        enabled
      );

    return res.status(200).json(provider);
  } catch (error) {
    return next(error);
  }
}

export default {
  getProviders,
  updateProvider,
};