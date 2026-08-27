<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const user = ref(Utils.getStore("user"));

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const fullName = [user.value.fName, user.value.lName].filter(Boolean).join(" ");
  return fullName || user.value.username || "";
});

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const handleSignOut = async () => {
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
    <span class="me-4">{{ displayName }}</span>
    <v-btn variant="text" class="oc-cta" @click="handleSignOut">Sign out</v-btn>
  </v-app-bar>
</template>
