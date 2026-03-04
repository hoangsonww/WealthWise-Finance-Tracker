import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongoServer: MongoMemoryServer;

process.env.JWT_SECRET = "test-jwt-secret-that-is-at-least-32-chars-long";
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test";
process.env.NODE_ENV = "test";
process.env.MCP_TRANSPORT = "stdio";
process.env.MCP_USER_ID = "000000000000000000000000";

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
