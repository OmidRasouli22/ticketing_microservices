import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import { Ticket } from "../../models";

const TICKETS_BASE_URL = "/api/tickets";

describe("Update Ticket API Tests", () => {
  it("returns 404 when the provided id does not exist", async () => {
    const id = new mongoose.Types.ObjectId().toHexString();
    await request(app)
      .put(`${TICKETS_BASE_URL}/${id}`)
      .set("Cookie", global.signin())
      .send({
        title: "Updated Title",
        price: 55,
      })
      .expect(404);
  });

  it("returns a 401 if user not authenticated", async () => {
    const id = new mongoose.Types.ObjectId().toHexString();
    await request(app)
      .put(`${TICKETS_BASE_URL}/${id}`)
      .send({
        title: "Updated Title",
        price: 55,
      })
      .expect(401);
  });

  it("returns a 401 if the user does not own the ticket", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin())
      .send({ title: "Created Test Ticket", price: 50 });

    // Check if the response status is correct (201: Created)
    expect(response.status).toEqual(201);

    // Assert the response contains the expected title and price inside the "ticket" property
    expect(response.body.ticket).toHaveProperty("title", "Created Test Ticket");
    expect(response.body.ticket).toHaveProperty("price", 50);

    await request(app)
      .put(`${TICKETS_BASE_URL}/${response.body.ticket.id}`)
      .set("Cookie", global.signin())
      .send({
        title: "Updated Title Ticket",
        price: 55,
      })
      .expect(401);
  });

  it("returns a 400 if the user provides an invalid title or price", async () => {
    const cookie = global.signin();
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", cookie)
      .send({ title: "Created Test Ticket", price: 50 });

    // Check if the response status is correct (201: Created)
    expect(response.status).toEqual(201);

    // Assert the response contains the expected title and price inside the "ticket" property
    expect(response.body.ticket).toHaveProperty("title", "Created Test Ticket");
    expect(response.body.ticket).toHaveProperty("price", 50);

    await request(app)
      .put(`${TICKETS_BASE_URL}/${response.body.ticket.id}`)
      .set("Cookie", cookie)
      .send({
        price: -55,
      })
      .expect(400);
  });

  it("should upadte the ticket with all the given conditions and valid credentials", async () => {
    const cookie = global.signin();
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", cookie)
      .send({ title: "Created Test Ticket", price: 50 });

    // Check if the response status is correct (201: Created)
    expect(response.status).toEqual(201);

    const updateResponse = await request(app)
      .put(`${TICKETS_BASE_URL}/${response.body.ticket.id}`)
      .set("Cookie", cookie)
      .send({
        title: "Updated Title",
        price: 55,
      });

    // Check if the response status is correct (201: Created)
    expect(updateResponse.status).toEqual(200);

    // Assert the response contains the expected title and price inside the "ticket" property
    expect(updateResponse.body.ticket).toHaveProperty("title", "Updated Title");
    expect(updateResponse.body.ticket).toHaveProperty("price", 55);
  });

  it("rejects update if the ticket is reserved", async () => {
    const cookie = global.signin();
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", cookie)
      .send({ title: "Created Test Ticket", price: 50 });

    // Check if the response status is correct (201: Created)
    expect(response.status).toEqual(201);

    const ticket = await Ticket.findById(response.body.ticket.id);
    ticket!.set({ orderId: new mongoose.Types.ObjectId() });
    ticket!.save();

    const updateResponse = await request(app)
      .put(`${TICKETS_BASE_URL}/${response.body.ticket.id}`)
      .set("Cookie", cookie)
      .send({
        title: "Updated Title",
        price: 55,
      });

    // Check if the response status is correct (201: Created)
    expect(updateResponse.status).toEqual(400);
  });
});
