import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { Order, OrderStatus } from "../../models/order.model";
import { Ticket } from "../../models/ticket.model";
import { natsWrapper } from "../../nats-wrapper";

// Helper function to create a new ticket
const createTicket = async (title: string, price: number) => {
  const ticket = Ticket.build({
    title,
    price,
    id: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();
  return ticket;
};

describe("Order Creation Tests", () => {
  it("returns 404 if the ticket does not exist", async () => {
    const ticketId = new mongoose.Types.ObjectId();

    await request(app)
      .post("/api/orders")
      .set("Cookie", global.signin())
      .send({ ticketId })
      .expect(404);
  });

  it("returns 400 if the ticket is already reserved", async () => {
    const ticket = await createTicket("Concert", 100);

    // Create an order to reserve the ticket
    const order = Order.build({
      ticket,
      userId: "random_user_id",
      status: OrderStatus.CREATED,
      expiresAt: new Date(),
    });
    await order.save();

    // Try to reserve the already reserved ticket
    await request(app)
      .post("/api/orders")
      .set("Cookie", global.signin())
      .send({ ticketId: ticket.id })
      .expect(400);
  });

  it("reserves a ticket successfully", async () => {
    const ticket = await createTicket("Movie", 50);

    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", global.signin())
      .send({ ticketId: ticket.id })
      .expect(201);

    // Verify the response
    expect(response.body.ticket.id.toString()).toEqual(ticket.id);
    expect(response.body.status).toEqual(OrderStatus.CREATED);
  });

  it("sets the expiration time correctly", async () => {
    const ticket = await createTicket("Theater", 75);

    const response = await request(app)
      .post("/api/orders")
      .set("Cookie", global.signin())
      .send({ ticketId: ticket.id })
      .expect(201);

    const expirationTime = new Date(response.body.expiresAt).getTime();
    const currentTime = new Date().getTime();

    // Check if expiration time is set to 15 minutes from now (with a margin of error)
    expect(expirationTime - currentTime).toBeGreaterThan(14 * 60 * 1000);
    expect(expirationTime - currentTime).toBeLessThan(16 * 60 * 1000);
  });

  it("returns an error if user is not authenticated", async () => {
    const ticket = await createTicket("Game", 30);

    await request(app)
      .post("/api/orders")
      .send({ ticketId: ticket.id })
      .expect(401);
  });

  it("returns 400 if ticketId is missing", async () => {
    await request(app)
      .post("/api/orders")
      .set("Cookie", global.signin())
      .send({})
      .expect(400);
  });

  it("returns 400 if ticketId is invalid", async () => {
    await request(app)
      .post("/api/orders")
      .set("Cookie", global.signin())
      .send({ ticketId: "invalid_id" })
      .expect(400);
  });
});
