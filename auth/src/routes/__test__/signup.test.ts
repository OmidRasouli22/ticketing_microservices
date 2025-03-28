import request from "supertest";
import app from "../../app";
import { User } from "../../models";

beforeEach(async () => {
  await User.deleteMany({});
});

describe("User Signup API", () => {
  it("returns 201 on successful signup with valid data", async () => {
    const response = await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@email.com",
        password: "TestPassword123",
      })
      .expect(201);

    expect(response.body).toHaveProperty(
      "message",
      "User created successfully"
    );
    expect(response.body).toHaveProperty("user");
  });

  it("returns 400 if email is already in use", async () => {
    await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@email.com",
        password: "TestPassword123",
      })
      .expect(201);

    const response = await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@email.com",
        password: "AnotherPassword123",
      })
      .expect(400);

    expect(response.body).toEqual([{ message: "Email is already taken!" }]);
  });

  it("returns 400 if email is invalid", async () => {
    const response = await request(app)
      .post("/api/users/signup")
      .send({
        email: "invalid-email",
        password: "ValidPass123",
      })
      .expect(400);

    expect(response.body).toEqual([
      { message: "Invalid value", field: "email" },
    ]);
  });

  it("returns 400 if password is too short", async () => {
    const response = await request(app)
      .post("/api/users/signup")
      .send({
        email: "valid@email.com",
        password: "123",
      })
      .expect(400);

    expect(response.body).toEqual([
      {
        message: "Password must be between 6 and 20 characters",
        field: "password",
      },
    ]);
  });

  it("returns 400 if email is missing", async () => {
    const response = await request(app)
      .post("/api/users/signup")
      .send({
        password: "ValidPass123",
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
      .post("/api/users/signup")
      .send({
        email: "valid@email.com",
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.arrayContaining([
        { message: "Invalid value", field: "password" },
        {
          message: "Password must be between 6 and 20 characters",
          field: "password",
        },
      ])
    );
  });

  it("sets a JWT session after successful signup", async () => {
    const response = await request(app)
      .post("/api/users/signup")
      .send({
        email: "valid@email.com",
        password: "ValidPass123",
      })
      .expect(201);

    expect(response.body).toHaveProperty(
      "message",
      "User created successfully"
    );
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", "valid@email.com");

    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("returns a 400 with an invalid email address", async () => {
    return request(app)
      .post("/api/users/signup")
      .send({
        email: "blah blah blah",
        password: "123",
      })
      .expect(400);
  });

  it("returns a 400 with missing email or password", async () => {
    return request(app)
      .post("/api/users/signup")
      .send({
        email: "blah blah blah",
      })
      .expect(400);
  });

  it("disallowes duplicate email", async () => {
    await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "TestPassword123",
      })
      .expect(201);
    await request(app)
      .post("/api/users/signup")
      .send({
        email: "test@test.com",
        password: "TestPassword123",
      })
      .expect(400);
  });
});
