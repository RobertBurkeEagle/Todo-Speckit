<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const createDialog = ref(false);
const createName = ref("");
const createForm = ref(null);
const createError = ref("");
const creating = ref(false);

const renameDialog = ref(false);
const renameName = ref("");
const renameForm = ref(null);
const renameError = ref("");
const renaming = ref(false);
const listBeingRenamed = ref(null);

const deleteDialog = ref(false);
const deleting = ref(false);
const listBeingDeleted = ref(null);

const nameRules = [(value) => !!value?.trim() || "List name is required."];

const loadLists = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.getLists();
    lists.value = response.data;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Could not load lists.";
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  createName.value = "";
  createError.value = "";
  createDialog.value = true;
};

const submitCreate = async () => {
  createError.value = "";
  const { valid } = await createForm.value.validate();
  if (!valid) {
    return;
  }

  creating.value = true;
  try {
    await listServices.createList({ name: createName.value.trim() });
    createDialog.value = false;
    await loadLists();
  } catch (error) {
    createError.value = error.response?.data?.message || "Could not create list.";
  } finally {
    creating.value = false;
  }
};

const openRenameDialog = (list) => {
  listBeingRenamed.value = list;
  renameName.value = list.name;
  renameError.value = "";
  renameDialog.value = true;
};

const submitRename = async () => {
  renameError.value = "";
  const { valid } = await renameForm.value.validate();
  if (!valid) {
    return;
  }

  renaming.value = true;
  try {
    await listServices.updateList(listBeingRenamed.value.id, {
      name: renameName.value.trim(),
    });
    renameDialog.value = false;
    await loadLists();
  } catch (error) {
    renameError.value = error.response?.data?.message || "Could not rename list.";
  } finally {
    renaming.value = false;
  }
};

const openDeleteDialog = (list) => {
  listBeingDeleted.value = list;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  deleting.value = true;
  errorMessage.value = "";
  try {
    await listServices.deleteList(listBeingDeleted.value.id);
    deleteDialog.value = false;
    await loadLists();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Could not delete list.";
  } finally {
    deleting.value = false;
  }
};

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-card elevation="2">
      <v-card-item>
        <v-card-title class="text-h5">My Lists</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="new-list-btn"
            @click="openCreateDialog"
          >
            + New List
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <p v-if="!loading && lists.length === 0">
          No lists yet. Create your first list.
        </p>

        <v-list v-else-if="!loading">
          <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
            <template #append>
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Edit list"
                @click="openRenameDialog(list)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                aria-label="Delete list"
                @click="openDeleteDialog(list)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="createDialog" contained max-width="480">
      <v-card>
        <v-card-title>New list</v-card-title>
        <v-card-text>
          <v-form ref="createForm" @submit.prevent="submitCreate">
            <v-text-field
              v-model="createName"
              label="List name"
              :rules="nameRules"
            />
            <v-alert v-if="createError" type="error" class="mb-2">
              {{ createError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="createDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="create-list-btn"
            :loading="creating"
            @click="submitCreate"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialog" contained max-width="480">
      <v-card>
        <v-card-title>Rename list</v-card-title>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="submitRename">
            <v-text-field
              v-model="renameName"
              label="List name"
              :rules="nameRules"
            />
            <v-alert v-if="renameError" type="error" class="mb-2">
              {{ renameError }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="save-list-btn"
            :loading="renaming"
            @click="submitRename"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" contained max-width="480">
      <v-card>
        <v-card-title>Delete list</v-card-title>
        <v-card-text>
          Delete {{ listBeingDeleted?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="confirm-delete-btn"
            :loading="deleting"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
