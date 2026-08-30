import pool from "../db/db";
import repository from "../repositories/provider-registry.repository";
import { AppError } from "../utils/AppError";

const VALID_TYPES = [
  "identity",
  "compliance",
  "document",
  "ai",
];

async function getProviders() {
  const client = await pool.connect();

  try {
    return await repository.findAll(client);
  } finally {
    client.release();
  }
}

async function setEnabled(
  type: string,
  name: string,
  enabled: boolean
) {
  if (!VALID_TYPES.includes(type)) {
    throw new AppError("invalid provider type", 400);
  }

  const client = await pool.connect();

  try {
    const provider = await repository.updateEnabled(
      client,
      type,
      name,
      enabled
    );

    if (!provider) {
      throw new AppError("provider not found", 404);
    }

    return provider;
  } finally {
    client.release();
  }
}

export default {
  getProviders,
  setEnabled,
};