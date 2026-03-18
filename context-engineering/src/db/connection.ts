import mongoose from "mongoose";
import { logger } from "../utils/logger";

export async function connectDatabase(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  } catch (error) {
    logger.error({ error }, "Failed to disconnect from MongoDB");
    throw error;
  }
}
