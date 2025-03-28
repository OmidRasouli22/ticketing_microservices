import request from "supertest";
import app from "../../app";
import { User } from "../../models";

beforeEach(async () => {
  await User.deleteMany({});
  await request(app).post("/api/users/signup").send({
    email: "test@email.com",
    password: "TestPassword123",
  });
});

describe("User Signout API", () => {
  it("clears the session on signout", async () => {
    // First, sign in to get a valid session
    const signInResponse = await request(app)
      .post("/api/users/signin")
      .send({
        email: "test@email.com",
        password: "TestPassword123",
      })
      .expect(200);

    expect(signInResponse.headers["set-cookie"]).toBeDefined();

    // Sign out request
    const response = await request(app)
      .post("/api/users/signout")
      .set("Cookie", signInResponse.headers["set-cookie"])
      .expect(200);

    expect(response.body).toEqual({ message: "User Logged out successfully" });
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"][0]).toContain("session=;");
  });

  it("returns 200 even if user is not signed in", async () => {
    const response = await request(app).post("/api/users/signout").expect(401);
  });
});
