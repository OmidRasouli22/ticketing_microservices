import request from "supertest";
import app from "../../app";
import { Ticket } from "../../models";

const TICKETS_BASE_URL = "/api/tickets";

describe("Get List of Tickets API Tests", () => {
  it("has a route handler listening to /api/tickets for GET requests", async () => {
    const response = await request(app).get(TICKETS_BASE_URL).send();
    expect(response.status).not.toEqual(404);
  });

  it("returns the list of existing tickets if the route handler exists", async () => {
    // Insert some mock tickets into the database for the test
    const ticketData = [
      { title: "Concert 1", price: 50 },
      { title: "Concert 2", price: 70 },
      { title: "Concert 3", price: 40 },
    ];

    for (const ticketInformation of ticketData) {
      await request(app)
        .post(TICKETS_BASE_URL)
        .set("Cookie", global.signin()) // Assuming global.signin() simulates a logged-in user
        .send({
          title: ticketInformation.title,
          price: ticketInformation.price,
        })
        .expect(201); // Ensure creation is successful
    }

    const response = await request(app).get(TICKETS_BASE_URL).send();

    // Assert that the response status is OK
    expect(response.status).toEqual(200);

    // Assert that the response contains the expected list of tickets
    expect(response.body.tickets).toHaveLength(ticketData.length); // Ensure the correct number of tickets is returned

    // Optionally check specific ticket properties
    expect(response.body.tickets[0]).toHaveProperty("title", "Concert 1");
    expect(response.body.tickets[1]).toHaveProperty("title", "Concert 2");
    expect(response.body.tickets[2]).toHaveProperty("title", "Concert 3");

    expect(response.body.tickets[0]).toHaveProperty("price", 50);
  });

  it("returns an empty list if there are no tickets", async () => {
    // Ensure there are no tickets in the database before the test
    await Ticket.deleteMany({});

    const response = await request(app).get(TICKETS_BASE_URL).send();

    // Assert that the response status is OK
    expect(response.status).toEqual(200);

    // Assert that the response body is an empty array
    expect(response.body.tickets).toHaveLength(0);
  });
});
