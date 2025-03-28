import mongoose from "mongoose";
import app from "./app";
import { natsWrapper } from "./nats-wrapper";
import dotenv from "dotenv";
import {
  ExpirationCompleteListener,
  PaymentCreatedListener,
  TicketCreatedListener,
  TicketUpdatedListener,
} from "./events/listeners";

// Load environment variables early
dotenv.config();

// Validate environment variables
const validateEnv = () => {
  const requiredEnvs = [
    "JWT_SECRET_KEY",
    "NATS_URL",
    "NATS_CLUSTER_ID",
    "NATS_CLIENT_ID",
    "MONGODB_URI",
  ];

  requiredEnvs.forEach((env) => {
    if (!process.env[env]) {
      throw new Error(`Missing environment variable: ${env}`);
    }
  });
};

// Graceful shutdown function
const gracefulShutdown = async (message: string) => {
  console.log(`⚠️ ${message}`);
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed.");
  } catch (error) {
    console.error("Error while closing MongoDB:", error);
  }

  if (natsWrapper.client) {
    natsWrapper.client.close();
    console.log("✅ NATS connection closed.");
  }

  process.exit(0);
};

// Application start function
const startApp = async () => {
  try {
    console.log("Orders app is going to start ...");
    // Validate required env vars
    validateEnv();

    // Trust proxy for correct IP handling behind reverse proxies
    app.set("trust proxy", true);

    // NATS Connection
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID!,
      process.env.NATS_CLIENT_ID!,
      process.env.NATS_URL!
    );
    console.log("✅ Connected to NATS");

    // Handle NATS disconnection
    natsWrapper.client.on("close", () => {
      console.warn("❌ NATS connection closed. Exiting...");
      gracefulShutdown("NATS disconnected.");
    });

    // Graceful shutdown on termination signals
    process.on("SIGINT", () => gracefulShutdown("SIGINT received."));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM received."));

    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();
    new ExpirationCompleteListener(natsWrapper.client).listen();
    new PaymentCreatedListener(natsWrapper.client).listen();

    // MongoDB Connection
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ MongoDB connected successfully");

    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Orders Service is running on Port: ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start the app:", error);
    process.exit(1); // Exit with failure
  }
};

// Start the app
startApp();
