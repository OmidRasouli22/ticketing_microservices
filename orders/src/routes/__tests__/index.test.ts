import request from "supertest";
import app from "../../app";
import { Ticket } from "../../models/ticket.model";
import mongoose from "mongoose";

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

describe("Fetch Orders Tests", () => {
  it("fetches orders for a particular user", async () => {
    // Create three separate tickets
    const ticketOne = await createTicket("title 1", 10);
    const ticketTwo = await createTicket("title 2", 20);
    const ticketThree = await createTicket("title 3", 30);

    // Sign in as two different users
    const userOne = global.signin();
    const userTwo = global.signin();

    // Create one order as User #1
    await request(app)
      .post("/api/orders")
      .set("Cookie", userOne)
      .send({ ticketId: ticketOne.id })
      .expect(201);

    // Create two orders as User #2
    const { body: orderOne } = await request(app)
      .post("/api/orders")
      .set("Cookie", userTwo)
      .send({ ticketId: ticketTwo.id })
      .expect(201);

    const { body: orderTwo } = await request(app)
      .post("/api/orders")
      .set("Cookie", userTwo)
      .send({ ticketId: ticketThree.id })
      .expect(201);

    // Make request to get orders for User #2
    const response = await request(app)
      .get("/api/orders")
      .set("Cookie", userTwo)
      .expect(200);

    // Assertions: Make sure we only got the orders for User #2
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toEqual(orderOne.id);
    expect(response.body[1].id).toEqual(orderTwo.id);
    expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
    expect(response.body[1].ticket.id).toEqual(ticketThree.id);
  });

  it("returns an empty array if the user has no orders", async () => {
    const user = global.signin();

    // Fetch orders for a user who hasn't placed any orders
    const response = await request(app)
      .get("/api/orders")
      .set("Cookie", user)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("returns 401 if user is not authenticated", async () => {
    await request(app).get("/api/orders").expect(401);
  });

  it("does not return orders from other users", async () => {
    const ticket = await createTicket("title 4", 40);
    const userOne = global.signin();
    const userTwo = global.signin();

    // UserOne creates an order
    await request(app)
      .post("/api/orders")
      .set("Cookie", userOne)
      .send({ ticketId: ticket.id })
      .expect(201);

    // UserTwo tries to fetch orders (should be empty)
    const response = await request(app)
      .get("/api/orders")
      .set("Cookie", userTwo)
      .expect(200);

    expect(response.body).toHaveLength(0);
  });
});
