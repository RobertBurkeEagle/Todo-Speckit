<script setup>
import { computed } from "vue";
import authServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const user = computed(() => Utils.getStore("user"));
const firstName = computed(() => user.value?.fName || "there");

const handleSignOut = async () => {
  await authServices.logoutUser();
};
</script>

<template>
  <v-container class="py-10">
    <v-card elevation="2">
      <v-card-title class="text-h5">Welcome, {{ firstName }}</v-card-title>
      <v-card-text>
        You are signed in. Todo lists arrive in a later feature.
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          @click="handleSignOut"
        >
          Sign out
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
