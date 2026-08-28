/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const profileBody = {
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
};

describe("Feature 4 — User profile API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const { user, authHeader } = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader)
        .send({
          fName: "Janet",
          lName: "Doe",
          email: "janet@example.com",
          username: "janet",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.userId,
        fName: "Janet",
        username: "janet",
        email: "janet@example.com",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User fetches their own profile", async () => {
      const { user, authHeader } = await registerUser();

      const response = await request(app)
        .get(`/todo/users/${user.userId}`)
        .set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: user.userId,
        fName: "Test",
        username: "testuser",
        email: "test@example.com",
        role: "worker",
      });
      expect(response.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .get(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`User with id=${userB.user.userId} not found.`);
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userB.user.userId}`)
        .set(userA.authHeader)
        .send({ ...profileBody, username: "hijacked" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`User with id=${userB.user.userId} not found.`);

      const stored = await db.user.findByPk(userB.user.userId);
      expect(stored.username).toBe("userb");
    });

    it("Unauthenticated profile API request", async () => {
      const response = await request(app).get("/todo/users/1");
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const { user, authHeader } = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader)
        .send({ ...profileBody, password: "short" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Password must be at least 8 characters.");
    });

    it("Profile update rejects missing required fields", async () => {
      const { user, authHeader } = await registerUser();

      const response = await request(app)
        .put(`/todo/users/${user.userId}`)
        .set(authHeader)
        .send({ lName: "Doe", email: "jane@example.com", username: "jdoe" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("First name is required.");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send({
          fName: "A",
          lName: "User",
          email: "a@example.com",
          username: "userb",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username is already taken.");
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const response = await request(app)
        .put(`/todo/users/${userA.user.userId}`)
        .set(userA.authHeader)
        .send({
          fName: "A",
          lName: "User",
          email: "b@example.com",
          username: "usera",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is already registered.");
    });

    it("Unauthenticated profile update API request", async () => {
      const response = await request(app).put("/todo/users/1").send(profileBody);
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
