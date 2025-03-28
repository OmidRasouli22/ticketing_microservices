import request from "supertest";
import app from "../../app"; // Assuming app.js exports the Express app
import mongoose from "mongoose";
import { Ticket } from "../../models/ticket.model";

// Helper function to create a ticket
const createTicket = async (title: string, price: number) => {
  const ticket = Ticket.build({
    title,
    price,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();
  return ticket;
};

describe("GET /api/orders/:id", () => {
  it("fetches a specific order for the authenticated user", async () => {
    // Create a ticket and an order
    const ticket = await createTicket("Concert Ticket", 100);
    const user = global.signin();

    // Create an order as the authenticated user
    const { body: order } = await request(app)
      .post("/api/orders")
      .set("Cookie", user)
      .send({ ticketId: ticket.id })
      .expect(201);

    // Fetch the order by ID
    const response = await request(app)
      .get(`/api/orders/${order.id}`)
      .set("Cookie", user)
      .expect(200);

    // Verify the order details
    expect(response.body.id).toEqual(order.id);
    expect(response.body.ticket.id).toEqual(ticket.id);
  });

  it("returns 404 if the order is not found", async () => {
    // Generate a valid ObjectId but doesn't exist in the database
    const nonExistentOrderId = new mongoose.Types.ObjectId().toHexString();
    const user = global.signin();

    await request(app)
      .get(`/api/orders/${nonExistentOrderId}`)
      .set("Cookie", user)
      .expect(404);
  });

  it("returns 401 if the user is not authenticated", async () => {
    const orderId = new mongoose.Types.ObjectId().toHexString();

    await request(app).get(`/api/orders/${orderId}`).expect(401);
  });

  it("returns 403 if the user tries to access another user's order", async () => {
    const ticket = await createTicket("VIP Ticket", 200);
    const userOne = global.signin();
    const userTwo = global.signin();

    // User One creates an order
    const { body: order } = await request(app)
      .post("/api/orders")
      .set("Cookie", userOne)
      .send({ ticketId: ticket.id })
      .expect(201);

    // User Two tries to access User One's order
    await request(app)
      .get(`/api/orders/${order.id}`)
      .set("Cookie", userTwo)
      .expect(404);
  });

  it("returns 400 if the order ID is not a valid MongoDB ObjectId", async () => {
    const user = global.signin();

    await request(app)
      .get("/api/orders/invalid-order-id")
      .set("Cookie", user)
      .expect(400);
  });
});
