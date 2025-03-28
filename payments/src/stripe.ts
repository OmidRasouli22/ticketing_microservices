import Stripe from "stripe";

// Create a centralized Stripe client instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Define the API version to ensure compatibility with your integration.
  // Pinning the version prevents breaking changes when Stripe updates.
  apiVersion: "2025-02-24.acacia",

  // Optional: Customize timeout for requests to avoid hanging requests.
  // Helps prevent long response times from affecting your app.
  timeout: 30_000, // 30 seconds

  // Optional: Set the appInfo to track your app in Stripe's logs.
  // Useful for identifying requests from different services in your app.
  appInfo: {
    name: "Ticketing",
    version: "1.0.0",
  },
});
