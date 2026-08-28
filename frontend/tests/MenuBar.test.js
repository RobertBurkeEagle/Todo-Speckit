/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { defineComponent } from "vue";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import authServices from "../src/services/authServices.js";
import userServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const sessionUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  username: "jdoe",
  email: "jdoe@example.com",
  token: "test-token",
};

const MenuHarness = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

async function mountMenu() {
  return mountWithPlugins(MenuHarness, { attachTo: document.body });
}

async function openMenu(wrapper) {
  await wrapper.get('[data-testid="profile-menu-btn"]').trigger("click");
  await flushPromises();
}

describe("Feature 4 — MenuBar profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    localStorage.clear();
    Utils.setStore("user", sessionUser);
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);

      expect(wrapper.text()).toContain("Jane Doe");
      expect(wrapper.text()).toContain("jdoe");
      expect(wrapper.text()).toContain("jdoe@example.com");
      expect(wrapper.text()).toContain("Edit Profile");
      expect(wrapper.text()).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="edit-profile-btn"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Edit Profile");
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      expect(fields[0].props("modelValue")).toBe("Jane");
      expect(fields[1].props("modelValue")).toBe("Doe");
      expect(fields[2].props("modelValue")).toBe("jdoe@example.com");
      expect(fields[3].props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="edit-profile-btn"]').trigger("click");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].setValue("Changed");
      await wrapper.get('[data-testid="cancel-profile-btn"]').trigger("click");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
    });

    it("User saves profile changes", async () => {
      userServices.updateUser.mockResolvedValue({
        data: {
          id: 1,
          fName: "Janet",
          lName: "Doe",
          email: "janet@example.com",
          username: "janet",
          role: "worker",
        },
      });

      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="edit-profile-btn"]').trigger("click");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].setValue("Janet");
      await fields[2].setValue("janet@example.com");
      await fields[3].setValue("janet");
      await wrapper.get('[data-testid="save-profile-btn"]').trigger("click");
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Janet");
      expect(Utils.getStore("user").username).toBe("janet");
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="edit-profile-btn"]').trigger("click");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[2].setValue("notanemail");
      await wrapper.get('[data-testid="save-profile-btn"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="edit-profile-btn"]').trigger("click");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[4].setValue("password123");
      await fields[5].setValue("password456");
      await wrapper.get('[data-testid="save-profile-btn"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="edit-profile-btn"]').trigger("click");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[4].setValue("short");
      await fields[5].setValue("short");
      await wrapper.get('[data-testid="save-profile-btn"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="edit-profile-btn"]').trigger("click");
      await flushPromises();
      await wrapper.get('[data-testid="save-profile-btn"]').trigger("click");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is already taken.");
      expect(wrapper.text()).toContain("Edit Profile");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);
      await wrapper.get('[data-testid="logout-btn"]').trigger("click");
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountMenu();
      expect(wrapper.text()).not.toContain("Sign out");
    });
  });
});
