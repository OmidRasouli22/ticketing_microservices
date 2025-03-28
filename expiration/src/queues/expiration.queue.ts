import Queue, { Job } from "bull";
import { SUBJECTS } from "@omidrasticketsapp/common";
import { ExpirationCompletedPublisher } from "../events/expiration-completed-publisher";
import { natsWrapper } from "../nats-wrapper";

// ----------------------------
// Interface: Payload Structure
// ----------------------------
// Defines the expected data structure for jobs in the queue.
interface Payload {
  orderId: string;
}

// -----------------------------
// Queue Initialization
// -----------------------------
// Create a Bull queue for handling order expiration events.
// The "order:expiration" queue handles delayed jobs to trigger actions when an order expires.
//
// Redis Configuration:
// - `host`: Specifies the Redis server's host (fetched from env variables).
// - `port` (optional): Defaults to 6379, but can be customized if needed.
// - `password` (optional): Include if your Redis instance requires authentication.
// // - `maxRetriesPerRequest`: Prevents long-hanging requests in case Redis is down.
// lockDuration: Ensures only one worker handles a job at a time. Increase this for long-running jobs.
// stalledInterval: Detects jobs that get "stuck" (e.g., worker crashes mid-job) and retries them.
// maxStalledCount: Limits retries for jobs that stall too often, preventing infinite loops.
// guardInterval: Helps in detecting delayed jobs, especially in high-throughput queues.
// retryProcessDelay: Introduces a cooldown between retries, preventing flooding.
// drainDelay: Controls the speed of queue draining (useful for cleanup).
const expirationQueue = new Queue<Payload>("order:expiration", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    // password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Ensures commands fail immediately if Redis goes down.
  },
  settings: {
    lockDuration: 30000, // Time (ms) a job is "locked" while being processed (default: 30,000)
    stalledInterval: 5000, // Frequency (ms) to check for stalled jobs (default: 30,000)
    maxStalledCount: 2, // Max times a job can stall before being marked as failed (default: 1)
    guardInterval: 5000, // Frequency (ms) to check for delayed jobs (default: 5,000)
    retryProcessDelay: 5000, // Delay (ms) before reprocessing a failed job (default: 5,000)
    drainDelay: 100, // Delay (ms) between each job removal when draining the queue (default: 5)
  },
  limiter: {
    max: 100, // Maximum number of jobs processed in the given interval.
    duration: 60000, // Interval duration in milliseconds (e.g., 60,000 ms = 1 minute).
    // groupKey: "userId", // Optional: Limit jobs per unique key (e.g., user ID).
  },
  defaultJobOptions: {
    removeOnComplete: true, // Automatically remove successful jobs from Redis to prevent bloat.
    removeOnFail: false, // Keep failed jobs for investigation.
    attempts: 3, // Retry failed jobs up to 3 times.
    backoff: {
      type: "exponential", // Increase retry intervals exponentially for each failure.
      delay: 1000, // Initial retry delay in milliseconds.
    },
  },
});

// -----------------------------
// Job Processor
// -----------------------------
// Processes jobs added to the "order:expiration" queue.
// When a job is processed, the system can:
// - Publish an `expiration:complete` event (to be handled in other services).
// - Send notifications or take actions when orders expire.
expirationQueue.process(async (job: Job<Payload>) => {
  try {
    new ExpirationCompletedPublisher(natsWrapper.client).publish({
      orderId: job.data.orderId,
    });
  } catch (error) {
    console.error("Failed to process expiration job:", error);
    throw error; // Allows Bull to handle retries.
  }
});

// -----------------------------
// Event Handlers (Optional)
// -----------------------------
expirationQueue.on("completed", (job) => {
  console.log(`✅ Job completed: Order ID ${job.data.orderId}`);
});

expirationQueue.on("failed", (job, err) => {
  console.error(`❌ Job failed: Order ID ${job.data.orderId}`, err);
});

expirationQueue.on("error", (error) => {
  console.error("❌ Queue Error:", error);
});

// -----------------------------
// Export the Queue
// -----------------------------
// Export the queue instance to be used elsewhere in the app for adding jobs.
export { expirationQueue };
