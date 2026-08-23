import type {
  Request,
  Response,
  NextFunction
} from "express";

import { AppError } from "../utils/AppError";

function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  if (req.user.role !== "admin") {
    res.status(403).json({
      error: "Forbidden",
    });
    return;
  }

  next();
}

export default adminOnly;