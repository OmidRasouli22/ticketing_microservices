import request from "supertest";
import app from "../../app";
import { User } from "../../models";

beforeEach(async () => {
  await User.deleteMany({});
});

describe("Current User API", () => {
  it("returns details about the current logged-in user", async () => {
    const authResponse = await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "TestPassword",
      })
      .expect(201);

    const cookies = authResponse.get("set-cookie");
    expect(cookies).toBeDefined();

    const response = await request(app)
      .get("/api/users/current-user")
      .set("Cookie", cookies!)
      .expect(200);
  });

  it("returns 401 if no authentication cookie is provided", async () => {
    const response = await request(app)
      .get("/api/users/current-user")
      .expect(401);

    expect(response.body).toEqual([{ message: "You have to login first" }]);
  });

  it("returns 401 if session is invalid", async () => {
    const response = await request(app)
      .get("/api/users/current-user")
      .set("Cookie", "session=invalidtoken")
      .expect(401);

    expect(response.body).toEqual([{ message: "You have to login first" }]);
  });
});
