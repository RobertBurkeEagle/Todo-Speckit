/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */

import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { syncTestDatabase, resetTestDatabase, registerUser } from "./helpers.js";

const createList = (authHeader, name) =>
  request(app).post("/todo/lists").set(authHeader).send({ name });

const createTodo = (authHeader, listId, title, extra = {}) =>
  request(app).post(`/todo/lists/${listId}/todos`).set(authHeader).send({ title, ...extra });

describe("Feature 3 — Todo API", () => {
  beforeAll(async () => {
    await syncTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const { user, authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        completed: false,
        listId: list.body.id,
        userId: user.userId,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "  ");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Todo title is required.");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });

      const listA = await createList(userA.authHeader, "Work");
      const listB = await createList(userB.authHeader, "Work");
      await createTodo(userA.authHeader, listA.body.id, "My task");
      await createTodo(userB.authHeader, listB.body.id, "Their task");

      const response = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(200);
      expect(response.body.map((todo) => todo.title)).toEqual(["My task"]);
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");
      await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ completed: true });

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ completed: false });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ title: "Buy oat milk" });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .delete(`/todo/todos/${todo.body.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(response.status);

      const remaining = await request(app)
        .get(`/todo/lists/${list.body.id}/todos`)
        .set(authHeader);
      expect(remaining.body).toEqual([]);
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createList(userB.authHeader, "Secret");
      await createTodo(userB.authHeader, listB.body.id, "Hidden task");

      const response = await request(app)
        .get(`/todo/lists/${listB.body.id}/todos`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${listB.body.id} not found.`);
      expect(JSON.stringify(response.body)).not.toContain("Hidden task");
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createList(userB.authHeader, "Secret");

      const response = await createTodo(userA.authHeader, listB.body.id, "Intruder task");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`List with id=${listB.body.id} not found.`);

      const remaining = await request(app)
        .get(`/todo/lists/${listB.body.id}/todos`)
        .set(userB.authHeader);
      expect(remaining.body).toEqual([]);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createList(userB.authHeader, "Secret");
      const todoB = await createTodo(userB.authHeader, listB.body.id, "Keep Me");

      const response = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(userA.authHeader)
        .send({ title: "Hijacked" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${todoB.body.id} not found.`);

      const stored = await db.todo.findByPk(todoB.body.id);
      expect(stored.title).toBe("Keep Me");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createList(userB.authHeader, "Secret");
      const todoB = await createTodo(userB.authHeader, listB.body.id, "Keep Me");

      const response = await request(app)
        .delete(`/todo/todos/${todoB.body.id}`)
        .set(userA.authHeader);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${todoB.body.id} not found.`);
      expect(await db.todo.findByPk(todoB.body.id)).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      await registerUser({
        email: "other@example.com",
        username: "otheruser",
      });
      const list = await createList(userA.authHeader, "Groceries");

      const response = await createTodo(userA.authHeader, list.body.id, "Buy milk", {
        userId: 999,
      });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe(userA.user.userId);
      expect(response.body.userId).not.toBe(999);
    });

    it("Unauthenticated API request for todos", async () => {
      const response = await request(app).get("/todo/lists/1/todos");

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const milk = await createTodo(authHeader, list.body.id, "Buy milk");
      const eggs = await createTodo(authHeader, list.body.id, "Buy eggs");

      const response = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(authHeader);

      expect([200, 204]).toContain(response.status);
      expect(await db.todo.findByPk(milk.body.id)).toBeNull();
      expect(await db.todo.findByPk(eggs.body.id)).toBeNull();
    });
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "Buy milk", {
        dueDate: "2026-07-15",
      });

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBe("2026-07-15");
    });

    it("User adds a todo without a due date", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "Buy milk");

      expect(response.status).toBe(201);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on create", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");

      const response = await createTodo(authHeader, list.body.id, "Task", {
        dueDate: "not-a-date",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Due date must be a valid date in YYYY-MM-DD format."
      );
      expect(await db.todo.count()).toBe(0);
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk");

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ dueDate: "2026-07-20" });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe("2026-07-20");
    });

    it("User clears a due date when editing a todo", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk", {
        dueDate: "2026-07-20",
      });

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ dueDate: null });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
    });

    it("API rejects an invalid due date on update", async () => {
      const { authHeader } = await registerUser();
      const list = await createList(authHeader, "Groceries");
      const todo = await createTodo(authHeader, list.body.id, "Buy milk", {
        dueDate: "2026-07-15",
      });

      const response = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader)
        .send({ dueDate: "2026-99-99" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        "Due date must be a valid date in YYYY-MM-DD format."
      );
      const stored = await db.todo.findByPk(todo.body.id);
      expect(stored.dueDate).toBe("2026-07-15");
    });

    it("User cannot set due date on another user's todo", async () => {
      const userA = await registerUser({
        email: "a@example.com",
        username: "usera",
      });
      const userB = await registerUser({
        email: "b@example.com",
        username: "userb",
      });
      const listB = await createList(userB.authHeader, "Secret");
      const todoB = await createTodo(userB.authHeader, listB.body.id, "Keep Me");

      const response = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(userA.authHeader)
        .send({ dueDate: "2026-07-15" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Todo with id=${todoB.body.id} not found.`);
    });
  });
});
