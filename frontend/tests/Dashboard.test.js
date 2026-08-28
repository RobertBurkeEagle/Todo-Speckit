/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };
const work = { id: 2, name: "Work", userId: 1 };
const personal = { id: 3, name: "Personal", userId: 1 };

async function mountDashboard() {
  return mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
}

async function clickTestId(wrapper, testId) {
  await wrapper.get(`[data-testid="${testId}"]`).trigger("click");
  await flushPromises();
}

describe("Feature 2 — Dashboard lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    listServices.getLists.mockResolvedValue({ data: [] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      listServices.createList.mockResolvedValue({
        data: groceries,
      });
      listServices.getLists
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [groceries] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await clickTestId(wrapper, "new-list-btn");
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].setValue("Groceries");
      await clickTestId(wrapper, "create-list-btn");
      await flushPromises();

      expect(listServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      await clickTestId(wrapper, "new-list-btn");
      await clickTestId(wrapper, "create-list-btn");
      await flushPromises();

      expect(wrapper.text()).toContain("List name is required.");
      expect(listServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [work, personal] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceries] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const renamed = { ...groceries, name: "Shopping" };
      listServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [renamed] });
      listServices.updateList.mockResolvedValue({ data: renamed });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      const renameField = fields[fields.length - 1];
      await renameField.setValue("Shopping");
      await clickTestId(wrapper, "save-list-btn");
      await flushPromises();

      expect(listServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      listServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [] });
      listServices.deleteList.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="Delete list"]').trigger("click");
      await flushPromises();
      await clickTestId(wrapper, "confirm-delete-btn");
      await flushPromises();

      expect(listServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });
});

const milk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };

describe("Feature 3 — Dashboard todos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    listServices.getLists.mockResolvedValue({ data: [groceries] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      todoServices.createTodo.mockResolvedValue({ data: milk });
      todoServices.getTodos
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [milk] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await clickTestId(wrapper, "items-btn");
      await clickTestId(wrapper, "add-item-btn");
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[fields.length - 1].setValue("Buy milk");
      await clickTestId(wrapper, "confirm-add-item-btn");
      await flushPromises();

      expect(todoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(wrapper.text()).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      await clickTestId(wrapper, "items-btn");
      await clickTestId(wrapper, "add-item-btn");
      await clickTestId(wrapper, "confirm-add-item-btn");
      await flushPromises();

      expect(wrapper.text()).toContain("Todo title is required.");
      expect(todoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.find('[data-testid="add-item-btn"]').exists()).toBe(false);
      expect(wrapper.text()).not.toContain("+ Add Item");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      listServices.getLists.mockResolvedValue({ data: [personal] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await clickTestId(wrapper, "items-btn");
      expect(wrapper.text()).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [work, personal] });
      todoServices.getTodos.mockImplementation((listId) => {
        if (listId === 3) {
          return Promise.resolve({
            data: [{ id: 21, listId: 3, title: "Call mom", completed: false, userId: 1 }],
          });
        }
        return Promise.resolve({
          data: [
            { id: 22, listId: 2, title: "Email client", completed: false, userId: 1 },
            { id: 23, listId: 2, title: "Write report", completed: false, userId: 1 },
          ],
        });
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      const itemButtons = wrapper.findAll('[data-testid="items-btn"]');
      await itemButtons[1].trigger("click");
      await flushPromises();
      expect(wrapper.text()).toContain("Call mom");
      expect(wrapper.text()).not.toContain("Email client");

      await clickTestId(wrapper, "close-items-btn");
      await itemButtons[0].trigger("click");
      await flushPromises();
      expect(wrapper.text()).toContain("Email client");
      expect(wrapper.text()).toContain("Write report");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      todoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [{ ...milk, completed: true }] });
      todoServices.updateTodo.mockResolvedValue({ data: { ...milk, completed: true } });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await clickTestId(wrapper, "items-btn");

      await wrapper.findComponent({ name: "VCheckbox" }).vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(wrapper.html()).toContain("text-decoration-line-through");
    });

    it("User marks a completed todo as incomplete", async () => {
      const completedMilk = { ...milk, completed: true };
      todoServices.getTodos
        .mockResolvedValueOnce({ data: [completedMilk] })
        .mockResolvedValueOnce({ data: [milk] });
      todoServices.updateTodo.mockResolvedValue({ data: milk });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await clickTestId(wrapper, "items-btn");

      await wrapper.findComponent({ name: "VCheckbox" }).vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const updated = { ...milk, title: "Buy oat milk" };
      todoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [updated] });
      todoServices.updateTodo.mockResolvedValue({ data: updated });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await clickTestId(wrapper, "items-btn");

      await wrapper.find('[aria-label="Edit todo"]').trigger("click");
      await flushPromises();
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[fields.length - 1].setValue("Buy oat milk");
      await clickTestId(wrapper, "save-todo-btn");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { title: "Buy oat milk" });
      expect(wrapper.text()).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      todoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [] });
      todoServices.deleteTodo.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await clickTestId(wrapper, "items-btn");

      await wrapper.find('[aria-label="Delete todo"]').trigger("click");
      await flushPromises();
      await clickTestId(wrapper, "confirm-delete-todo-btn");
      await flushPromises();

      expect(todoServices.deleteTodo).toHaveBeenCalledWith(10);
      expect(wrapper.text()).toContain("No todos in this list yet.");
    });
  });
});
