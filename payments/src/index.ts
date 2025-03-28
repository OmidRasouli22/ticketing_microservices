import mongoose from "mongoose";
import app from "./app";
import { natsWrapper } from "./nats-wrapper";
import dotenv from "dotenv";
import { OrderCancelledListener, OrderCreatedListener } from "./events";

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
const validateEnv = () => {
  const requiredEnvs = [
    "JWT_SECRET_KEY",
    "NATS_URL",
    "NATS_CLUSTER_ID",
    "NATS_CLIENT_ID",
    "MONGODB_URI",
    "STRIPE_SECRET_KEY",
  ];

  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
  if (missingEnvs.length) {
    throw new Error(`Missing environment variables: ${missingEnvs.join(", ")}`);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (message: string) => {
  console.warn(`⚠️ ${message}`);
  try {
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed.");
    }
  } catch (error) {
    console.error("❌ Error closing MongoDB:", error);
  }

  if (natsWrapper.client) {
    natsWrapper.client.close();
    console.log("✅ NATS connection closed.");
  }

  process.exit(0);
};

/**
 * Application startup
 */
const startApp = async () => {
  try {
    // Validate environment variables
    validateEnv();

    // Trust proxy for correct IP handling behind reverse proxies
    app.set("trust proxy", true);

    // Connect to NATS
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID!,
      process.env.NATS_CLIENT_ID!,
      process.env.NATS_URL!
    );
    console.log("✅ Connected to NATS");

    // Handle NATS disconnection
    natsWrapper.client.on("close", () =>
      gracefulShutdown("NATS disconnected.")
    );

    // Listen to termination signals
    process.on("SIGINT", () => gracefulShutdown("SIGINT received."));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM received."));

    // start to listen on the events
    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ MongoDB connected successfully");

    // Start the server
    const port = process.env.PORT || 3000;
    app.listen(port, () =>
      console.log(`🚀 Tickets Service is running on Port: ${port}`)
    );
  } catch (error) {
    console.error("❌ Failed to start the app:", error);
    process.exit(1);
  }
};

// Start the app
startApp();
