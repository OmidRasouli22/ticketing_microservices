import request from "supertest";
import app from "../../app";
import { Ticket } from "../../models";

const TICKETS_BASE_URL = "/api/tickets";

describe("Create Ticket API Tests", () => {
  it("has a route handler listening to /api/tickets for POST requests", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .send({ title: "TestTitle", price: "10.98" });
    expect(response.status).not.toEqual(404);
  });

  it("requires authentication to access", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .send({ title: "TestTitle", price: "10.98" });
    expect(response.status).toEqual(401);
  });

  it("returns a status other than 401 if the user is signed in", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin()) // Assume global.signin() mocks an authenticated user
      .send({ title: "TestTitle", price: "10.98" });

    expect(response.status).not.toEqual(401);
  });

  it("returns an error if title is missing", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin())
      .send({ price: 20 });

    // Check if status is 400 (bad request)
    expect(response.status).toEqual(400);
  });

  it("returns an error if title is too short", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin())
      .send({ title: "a", price: 20 });

    expect(response.status).toEqual(400);
  });

  it("returns an error if price is missing", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin())
      .send({ title: "Valid Title" });

    expect(response.status).toEqual(400);
  });

  it("returns an error if price is negative", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin())
      .send({ title: "Valid Title", price: -10 });

    expect(response.status).toEqual(400);
  });

  it("returns an error if price has more than two decimal places", async () => {
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin())
      .send({ title: "Valid Title", price: 20.123 });

    expect(response.status).toEqual(400);
  });

  it("creates a new ticket with valid parameters", async () => {
    // Check that there are no tickets initially
    let tickets = await Ticket.find({});
    expect(tickets).toHaveLength(0); // Ensure there are no tickets before the test

    // Send POST request to create a new ticket
    const response = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin())
      .send({ title: "Valid Event", price: 50 });

    // Check if the response status is correct (201: Created)
    expect(response.status).toEqual(201);

    // Assert the response contains the expected title and price inside the "ticket" property
    expect(response.body.ticket).toHaveProperty("title", "Valid Event");
    expect(response.body.ticket).toHaveProperty("price", 50);

    // Ensure the ticket was actually created in the database
    tickets = await Ticket.find({});
    expect(tickets).toHaveLength(1); // Ensure one ticket is created

    // Validate that the ticket in the database has the same title and price
    expect(tickets[0].title).toEqual("Valid Event");
    expect(tickets[0].price).toEqual(50);
  });
});
