import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongoServer: MongoMemoryServer;

// Set required env vars before any module reads them
process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";
process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-that-is-at-least-32-chars";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.GEMINI_MODEL = "gemini-2.5-flash";
process.env.NODE_ENV = "test";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
