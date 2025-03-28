jest.setTimeout(120000); // Increase Jest timeout
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_SECRET_KEY = "secret_key";
  process.env.HTTP_PROXY = "";
  process.env.HTTPS_PROXY = "";
  process.env.NO_PROXY = "*";

  mongo = await MongoMemoryServer.create({});

  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri, {});
});

beforeEach(async () => {
  jest.clearAllMocks(); // Clears mock data before each test

  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});

declare global {
  var signin: () => Promise<string[]>;
}

global.signin = async () => {
  const email = "test@test.com";
  const password = "TestPassword";
  const response = await request(app)
    .post("/api/users/signup")
    .send({ email, password })
    .expect(201);

  const cookie = response.get("Set-Cookie");

  if (!cookie) {
    throw new Error("Failed to get cookie from response");
  }
  return cookie;
};
