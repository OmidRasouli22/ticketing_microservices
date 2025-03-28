import nats, { Stan } from "node-nats-streaming";

/**
 * Singleton Design Pattern:
 * -------------------------
 * The Singleton Pattern ensures that a class has only one instance and provides a global point of access to that instance.
 * This pattern is often used for managing shared resources, such as database connections, logging, or in this case, NATS client connections.
 *
 * In this implementation:
 * - `NatsWrapper` is a class responsible for managing the NATS Streaming Server connection.
 * - `natsWrapper` is a singleton instance of the `NatsWrapper` class, ensuring that only one NATS connection exists throughout the app lifecycle.
 * - Any part of the app can import `natsWrapper` to access the same NATS connection, avoiding redundant connections and ensuring proper connection management.
 */

class NatsWrapper {
  /**
   * Private NATS client instance. Access via the `client` getter.
   */
  private _client?: Stan;

  /**
   * Getter for the NATS client.
   * Ensures that the client is initialized before use.
   * @throws Error if client is not connected.
   */
  get client(): Stan {
    if (!this._client) {
      throw new Error("Cannot access NATS client before connecting.");
    }
    return this._client;
  }

  /**
   * Connects to the NATS Streaming Server.
   *
   * @param clusterId - The NATS streaming cluster ID.
   * @param clientId - A unique identifier for this client.
   * @param url - NATS server URL (e.g., 'nats://localhost:4222').
   * @param options - Optional NATS connection settings.
   * @returns A Promise that resolves when connected, or rejects if an error occurs.
   * @example
   * await natsWrapper.connect('ticketing', 'abc123', 'nats://localhost:4222', { maxReconnectAttempts: 5, reconnectTimeWait: 2000 });
   */
  async connect(
    clusterId: string,
    clientId: string,
    url: string,
    options?: {
      /**
       * Maximum number of reconnection attempts after losing connection to the NATS server.
       *
       * - If set to `-1` (default), the client will keep retrying forever.
       * - Setting it to a finite number (e.g., `5`) limits the retries.
       *
       * Example:
       * ```
       * maxReconnectAttempts: 10 // Retry 10 times before giving up
       * ```
       */
      maxReconnectAttempts?: number;

      /**
       * Time (in milliseconds) to wait between reconnection attempts.
       *
       * - Helps prevent overwhelming the server with reconnection attempts.
       * - Default is `2000ms` (2 seconds).
       *
       * Example:
       * ```
       * reconnectTimeWait: 5000 // Wait 5 seconds between reconnect attempts
       * ```
       */
      reconnectTimeWait?: number;

      /**
       * Controls whether the client should wait for the first connection to succeed before emitting events.
       *
       * - `true`: The client waits until the initial connection is established before proceeding.
       * - `false` (default): The client attempts to proceed even if the connection isn’t established yet.
       *
       * Example:
       * ```
       * waitOnFirstConnect: true // Ensures the app only starts after connecting
       * ```
       */
      waitOnFirstConnect?: boolean;
    }
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Establish the NATS connection
      this._client = nats.connect(clusterId, clientId, { url, ...options });

      // Connection successful
      this._client.on("connect", () => {
        console.log("✅ Connected Successfully to NATS client");
        resolve();
      });

      // Handle connection errors
      this._client.on("error", (err) => {
        console.error("❌ NATS Connection Error: ", err.message);
        reject(err);
      });

      // Handle reconnection events
      this._client.on("reconnecting", () => {
        console.warn("⚠️ Reconnecting to NATS...");
      });
    });
  }

  /**
   * Closes the NATS connection.
   * Ensures proper cleanup when the app shuts down.
   */
  close() {
    if (this._client) {
      console.log("Closing NATS connection...");
      this._client.close();
    }
  }
}

/**
 * Export a singleton instance of NatsWrapper to maintain a single connection across the app.
 */
export const natsWrapper = new NatsWrapper();
