import pino from "pino";

// Create a pino logger instance
const logger = pino({
  level: "error", // Set the default log level (can be 'info', 'debug', 'warn', 'error')
});

export default logger;
