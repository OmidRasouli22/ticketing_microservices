jest.setTimeout(120000); // Increase Jest timeout
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
let mongo: MongoMemoryServer;

jest.mock("../nats-wrapper.ts");

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
  var signin: () => string[];
}
global.signin = () => {
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: "test@test.com",
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!);

  // build session object {jwt: blah blah blah}
  const session = { jwt: token };

  // turn that session into json
  const sessionJSON = JSON.stringify(session);

  // take that session json and turn it into base64
  const base64 = Buffer.from(sessionJSON).toString("base64");

  return [`session=${base64}`];
};
