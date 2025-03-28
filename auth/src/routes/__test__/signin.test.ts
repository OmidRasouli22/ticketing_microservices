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

describe("User Signin API", () => {
  it("returns 200 on successful signin with valid credentials", async () => {
    const response = await request(app)
      .post("/api/users/signin")
      .send({
        email: "test@email.com",
        password: "TestPassword123",
      })
      .expect(200);

    expect(response.body).toHaveProperty("message", "Sign-in successful");
    expect(response.body).toHaveProperty("user");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("returns 400 if email is not registered", async () => {
    const response = await request(app)
      .post("/api/users/signin")
      .send({
        email: "notfound@email.com",
        password: "TestPassword123",
      })
      .expect(400);

    expect(response.body).toEqual([{ message: "Invalid Credentials" }]);
  });

  it("returns 400 if password is incorrect", async () => {
    const response = await request(app)
      .post("/api/users/signin")
      .send({
        email: "test@email.com",
        password: "WrongPassword123",
      })
      .expect(400);

    expect(response.body).toEqual([{ message: "Invalid credentials" }]);
  });

  it("returns 400 if email is missing", async () => {
    const response = await request(app)
      .post("/api/users/signin")
      .send({
        password: "TestPassword123",
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.arrayContaining([
        { message: "Invalid value", field: "email" },
        { message: "Email must be valid", field: "email" },
      ])
    );
  });

  it("returns 400 if password is missing", async () => {
    const response = await request(app)
      .post("/api/users/signin")
      .send({
        email: "test@email.com",
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.arrayContaining([{ message: "Invalid value", field: "password" }])
    );
  });

  it("returns 400 if email is invalid", async () => {
    const response = await request(app)
      .post("/api/users/signin")
      .send({
        email: "invalid-email",
        password: "TestPassword123",
      })
      .expect(400);

    expect(response.body).toEqual([
      { message: "Invalid value", field: "email" },
    ]);
  });

  it("sets a JWT session after successful signin", async () => {
    const response = await request(app)
      .post("/api/users/signin")
      .send({
        email: "test@email.com",
        password: "TestPassword123",
      })
      .expect(200);

    expect(response.headers["set-cookie"]).toBeDefined();
  });
});
