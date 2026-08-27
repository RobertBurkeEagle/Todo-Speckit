/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const createList = (authHeader, name, extra = {}) =>
  request(app).post("/todo/lists").set(authHeader).send({ name, ...extra });

describe("Feature 2 — List API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { user, authHeader } = await registerUser();

      const response = await createList(authHeader, "Groceries");

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: user.userId,
      });
    });

    it("User creates a list with an empty name", async () => {
      const { authHeader } = await registerUser();

      const response = await createList(authHeader, "   ");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("List name is required.");
    });

    it("User creates a list with a name that is too long", async () => {
      const { authHeader } = await registerUser();

      const response = await createList(authHeader, "a".repeat(101));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("List name must be 100 characters or fewer.");
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const { authHeader } = await registerUser();
      await createList(authHeader, "Work");
      await createList(authHeader, "Personal");

      const response = await request(app).get("/todo/lists").set(authHeader);

      expect(response.status).toBe(200);
      expect(response.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      await createList(userA.authHeader, "Mine");
      await createList(userB.authHeader, "Secret Project");

      const response = await request(app).get("/todo/lists").set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.map((list) => list.name)).toEqual(["Mine"]);
      expect(response.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { authHeader } = await registerUser();
      const created = await createList(authHeader, "Groceries");

      const response = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(authHeader)
        .send({ name: "Shopping" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Shopping");
    });

    it("User deletes a list", async () => {
      const { authHeader } = await registerUser();
      const created = await createList(authHeader, "Groceries");

      const response = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(response.status);

      const remaining = await request(app).get("/todo/lists").set(authHeader);
      expect(remaining.body).toEqual([]);
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const otherList = await createList(userB.authHeader, "Keep Me");

      const response = await request(app)
        .put(`/todo/lists/${otherList.body.id}`)
        .set(userA.authHeader)
        .send({ name: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${otherList.body.id} not found.`);

      const stored = await db.list.findByPk(otherList.body.id);
      expect(stored.name).toBe("Keep Me");
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const otherList = await createList(userB.authHeader, "Keep Me");

      const response = await request(app)
        .delete(`/todo/lists/${otherList.body.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${otherList.body.id} not found.`);

      const stored = await db.list.findByPk(otherList.body.id);
      expect(stored).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      await registerUser({
        email: "other@example.com",
        username: "otheruser",
      });

      const response = await request(app)
        .post("/todo/lists")
        .set(userA.authHeader)
        .send({ name: "Groceries", userId: 999 });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);
      expect(response.body.userId).not.toBe(999);
    });

    it("Unauthenticated API request to lists", async () => {
      const response = await request(app).get("/todo/lists");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });
});
