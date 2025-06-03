import process from "node:process";
import logger from "@grading-system/utils/logger";
import mongoose from "mongoose";

const MONGODB_URI = process.env.ConnectionStrings__plugindb

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI!);
    logger.debug("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
};
