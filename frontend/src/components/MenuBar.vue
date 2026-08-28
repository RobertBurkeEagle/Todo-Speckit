<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const user = ref(Utils.getStore("user"));
const menuOpen = ref(false);
const editDialog = ref(false);
const editForm = ref(null);
const saving = ref(false);
const errorMessage = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const fullName = computed(() =>
  [user.value?.fName, user.value?.lName].filter(Boolean).join(" ")
);

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const fillFormFromUser = () => {
  fName.value = user.value?.fName || "";
  lName.value = user.value?.lName || "";
  email.value = user.value?.email || "";
  username.value = user.value?.username || "";
  password.value = "";
  confirmPassword.value = "";
  errorMessage.value = "";
};

const openEditDialog = () => {
  fillFormFromUser();
  editDialog.value = true;
  menuOpen.value = false;
};

const closeEditDialog = () => {
  editDialog.value = false;
};

const saveProfile = async () => {
  errorMessage.value = "";
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };
    if (password.value) {
      payload.password = password.value;
    }

    const response = await userServices.updateUser(user.value.userId, payload);
    Utils.setStore("user", {
      ...user.value,
      ...response.data,
      userId: response.data.id ?? user.value.userId,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    refreshUser();
    editDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Could not update profile.";
  } finally {
    saving.value = false;
  }
};

const handleLogOut = async () => {
  await authServices.logoutUser();
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});
</script>

<template>
  <v-app-bar color="primary">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <v-menu v-model="menuOpen" contained :close-on-content-click="false">
      <template #activator="{ props }">
        <v-btn
          icon="mdi-account-circle"
          variant="text"
          aria-label="Profile"
          data-testid="profile-menu-btn"
          v-bind="props"
        />
      </template>
      <v-card min-width="280">
        <v-list>
          <v-list-item :title="fullName">
            <template #subtitle>
              <div>{{ user?.username }}</div>
              <div>{{ user?.email }}</div>
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="edit-profile-btn"
            @click="openEditDialog"
          >
            Edit Profile
          </v-btn>
        </v-card-actions>
        <v-list>
          <v-list-item data-testid="logout-btn" @click="handleLogOut">
            Log out
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" contained max-width="520">
    <v-card>
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-form ref="editForm" @submit.prevent="saveProfile">
          <v-text-field v-model="fName" label="First name" :rules="fNameRules" />
          <v-text-field v-model="lName" label="Last name" :rules="lNameRules" />
          <v-text-field v-model="email" label="Email" :rules="emailRules" />
          <v-text-field v-model="username" label="Username" :rules="usernameRules" />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            :rules="passwordRules"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            :rules="confirmPasswordRules"
          />
          <v-alert v-if="errorMessage" type="error" class="mb-2">{{ errorMessage }}</v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" data-testid="cancel-profile-btn" @click="closeEditDialog">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          data-testid="save-profile-btn"
          :loading="saving"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
