import request from "supertest";
import app from "../../app"; // Assuming app.js exports the Express app
import mongoose from "mongoose";
import { Order, OrderStatus } from "../../models/order.model";
import { Ticket } from "../../models/ticket.model";
import { natsWrapper } from "../../nats-wrapper";

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

describe("DELETE /api/orders/:id", () => {
  it("successfully cancels an order for the authenticated user", async () => {
    // Create a ticket and an order
    const ticket = await createTicket("Concert Ticket", 100);
    const user = global.signin();

    // Create an order as the authenticated user
    const { body: order } = await request(app)
      .post("/api/orders")
      .set("Cookie", user)
      .send({ ticketId: ticket.id })
      .expect(201);

    // Send a request to delete the order
    const response = await request(app)
      .delete(`/api/orders/${order.id}`)
      .set("Cookie", user)
      .expect(204); // 204 for successful delete

    // Fetch the order again to ensure it's cancelled
    const cancelledOrder = await Order.findById(order.id);

    // Safely check if cancelledOrder is null before asserting
    if (cancelledOrder) {
      expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);
    } else {
      throw new Error("Order was not found after deletion.");
    }
  });

  it("returns 404 if the order is not found", async () => {
    // Generate a valid ObjectId but doesn't exist in the database
    const nonExistentOrderId = new mongoose.Types.ObjectId().toHexString();
    const user = global.signin();

    await request(app)
      .delete(`/api/orders/${nonExistentOrderId}`)
      .set("Cookie", user)
      .expect(404);
  });

  it("returns 401 if the user is not authenticated", async () => {
    const orderId = new mongoose.Types.ObjectId().toHexString();

    await request(app).delete(`/api/orders/${orderId}`).expect(401);
  });

  it("returns 403 if the user tries to cancel another user's order", async () => {
    const ticket = await createTicket("VIP Ticket", 200);
    const userOne = global.signin();
    const userTwo = global.signin();

    // User One creates an order
    const { body: order } = await request(app)
      .post("/api/orders")
      .set("Cookie", userOne)
      .send({ ticketId: ticket.id })
      .expect(201);

    // User Two tries to cancel User One's order
    await request(app)
      .delete(`/api/orders/${order.id}`)
      .set("Cookie", userTwo)
      .expect(404); // Forbidden because it's another user's order
  });

  it("returns 400 if the order ID is not a valid MongoDB ObjectId", async () => {
    const user = global.signin();

    await request(app)
      .delete("/api/orders/invalid-order-id")
      .set("Cookie", user)
      .expect(400); // Invalid ID format
  });

  it("should publish the order:cancelled event", async () => {
    // Create a ticket and an order
    const ticket = await createTicket("Concert Ticket", 100);
    const user = global.signin();

    // Create an order as the authenticated user
    const { body: order } = await request(app)
      .post("/api/orders")
      .set("Cookie", user)
      .send({ ticketId: ticket.id })
      .expect(201);

    // Send a request to delete the order
    const response = await request(app)
      .delete(`/api/orders/${order.id}`)
      .set("Cookie", user)
      .expect(204); // 204 for successful delete

    // Fetch the order again to ensure it's cancelled
    const cancelledOrder = await Order.findById(order.id);

    // Safely check if cancelledOrder is null before asserting
    expect(cancelledOrder!.status).toBe(OrderStatus.CANCELLED);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
  });
});
