import request from "supertest";
import app from "../../app"; // Adjust path as needed

const TICKETS_BASE_URL = "/api/tickets";

describe("Get Ticket API Tests", () => {
  it("returns the correct ticket details when the ticket exists", async () => {
    // Create a new ticket
    const ticketResponse = await request(app)
      .post(TICKETS_BASE_URL)
      .set("Cookie", global.signin()) // Assuming global.signin() mocks a logged-in user
      .send({
        title: "Concert 1",
        price: 50,
      });

    expect(ticketResponse.status).toEqual(201);
    expect(ticketResponse.body.ticket).toHaveProperty("title", "Concert 1");

    // Fetch the created ticket
    const response = await request(app)
      .get(`${TICKETS_BASE_URL}/${ticketResponse.body.ticket.id}`)
      .send();

    // Assert the correct response
    expect(response.status).toEqual(200);
    expect(response.body.ticket).toHaveProperty("title", "Concert 1");
    expect(response.body.ticket).toHaveProperty("price", 50);
  });

  it("returns a 400 error if the ticket ID is invalid (malformed)", async () => {
    const invalidTicketId = "123"; // Invalid format
    const response = await request(app)
      .get(`${TICKETS_BASE_URL}/${invalidTicketId}`)
      .send();

    // Assert that the response status is 400 for bad request
    expect(response.status).toEqual(400);
  });
});
