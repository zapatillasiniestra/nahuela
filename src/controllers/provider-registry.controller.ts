import {
  Request,
  Response,
  NextFunction,
} from "express";

import providerRegistryService from "../services/provider-registry.service";

async function getProviders(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const providers =
      await providerRegistryService.getProviders();

    return res.status(200).json(providers);
  } catch (error) {
    return next(error);
  }
}

async function setEnabled(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const type = String(req.params.type);
    const name = String(req.params.name);
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        error: "enabled must be a boolean",
      });
    }

    const provider =
      await providerRegistryService.setEnabled(
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
  setEnabled,
};