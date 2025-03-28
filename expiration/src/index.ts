import { OrderCreatedListener } from "./events/oder-created-listener";
import { natsWrapper } from "./nats-wrapper";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
const validateEnv = () => {
  const requiredEnvs = [
    "NATS_URL",
    "NATS_CLUSTER_ID",
    "NATS_CLIENT_ID",
    "REDIS_HOST",
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

    // firing up listeners
    new OrderCreatedListener(natsWrapper.client).listen();
  } catch (error) {
    console.error("❌ Failed to start the app:", error);
    process.exit(1);
  }
};

// Start the app
startApp();
