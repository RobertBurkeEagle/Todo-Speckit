<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import todoServices from "../services/todoServices.js";

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

const itemsDialog = ref(false);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todosError = ref("");

const addItemDialog = ref(false);
const addTitle = ref("");
const addForm = ref(null);
const addError = ref("");
const adding = ref(false);

const editItemDialog = ref(false);
const editTitle = ref("");
const editForm = ref(null);
const editError = ref("");
const editing = ref(false);
const todoBeingEdited = ref(null);

const deleteItemDialog = ref(false);
const deletingItem = ref(false);
const todoBeingDeleted = ref(null);

const nameRules = [(value) => !!value?.trim() || "List name is required."];
const titleRules = [(value) => !!value?.trim() || "Todo title is required."];

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

const loadTodos = async () => {
  if (!itemsList.value) {
    return;
  }

  todosLoading.value = true;
  todosError.value = "";
  try {
    const response = await todoServices.getTodos(itemsList.value.id);
    todos.value = response.data;
  } catch (error) {
    todosError.value = error.response?.data?.message || "Could not load todos.";
  } finally {
    todosLoading.value = false;
  }
};

const openItems = async (list) => {
  itemsList.value = list;
  todos.value = [];
  itemsDialog.value = true;
  await loadTodos();
};

const closeItems = () => {
  itemsDialog.value = false;
  itemsList.value = null;
  todos.value = [];
};

const openAddItem = () => {
  addTitle.value = "";
  addError.value = "";
  addItemDialog.value = true;
};

const submitAddItem = async () => {
  addError.value = "";
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }

  adding.value = true;
  try {
    await todoServices.createTodo(itemsList.value.id, { title: addTitle.value.trim() });
    addItemDialog.value = false;
    await loadTodos();
  } catch (error) {
    addError.value = error.response?.data?.message || "Could not add todo.";
  } finally {
    adding.value = false;
  }
};

const toggleCompleted = async (todo, completed) => {
  try {
    await todoServices.updateTodo(todo.id, { completed });
    await loadTodos();
  } catch (error) {
    todosError.value = error.response?.data?.message || "Could not update todo.";
  }
};

const openEditItem = (todo) => {
  todoBeingEdited.value = todo;
  editTitle.value = todo.title;
  editError.value = "";
  editItemDialog.value = true;
};

const submitEditItem = async () => {
  editError.value = "";
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  editing.value = true;
  try {
    await todoServices.updateTodo(todoBeingEdited.value.id, {
      title: editTitle.value.trim(),
    });
    editItemDialog.value = false;
    await loadTodos();
  } catch (error) {
    editError.value = error.response?.data?.message || "Could not update todo.";
  } finally {
    editing.value = false;
  }
};

const openDeleteItem = (todo) => {
  todoBeingDeleted.value = todo;
  deleteItemDialog.value = true;
};

const confirmDeleteItem = async () => {
  deletingItem.value = true;
  try {
    await todoServices.deleteTodo(todoBeingDeleted.value.id);
    deleteItemDialog.value = false;
    await loadTodos();
  } catch (error) {
    todosError.value = error.response?.data?.message || "Could not delete todo.";
  } finally {
    deletingItem.value = false;
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
                icon="mdi-format-list-bulleted"
                size="small"
                variant="text"
                aria-label="Items"
                data-testid="items-btn"
                @click="openItems(list)"
              />
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

    <v-dialog v-model="itemsDialog" contained max-width="640">
      <v-card>
        <v-card-item>
          <v-card-title>{{ itemsList?.name }} — Items</v-card-title>
          <template #append>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              data-testid="add-item-btn"
              @click="openAddItem"
            >
              + Add Item
            </v-btn>
          </template>
        </v-card-item>
        <v-card-text>
          <v-progress-linear v-if="todosLoading" indeterminate class="mb-4" />
          <v-alert v-if="todosError" type="error" class="mb-4">
            {{ todosError }}
          </v-alert>
          <p v-if="!todosLoading && todos.length === 0">No todos in this list yet.</p>
          <v-list v-else-if="!todosLoading">
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  density="compact"
                  :aria-label="`Toggle ${todo.title}`"
                  @update:model-value="toggleCompleted(todo, $event)"
                />
              </template>
              <v-list-item-title :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }">
                {{ todo.title }}
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit todo"
                  @click="openEditItem(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete todo"
                  @click="openDeleteItem(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" data-testid="close-items-btn" @click="closeItems">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemDialog" contained max-width="480">
      <v-card>
        <v-card-title>Add item</v-card-title>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="submitAddItem">
            <v-text-field v-model="addTitle" label="Todo title" :rules="titleRules" />
            <v-alert v-if="addError" type="error" class="mb-2">{{ addError }}</v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="confirm-add-item-btn"
            :loading="adding"
            @click="submitAddItem"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemDialog" contained max-width="480">
      <v-card>
        <v-card-title>Edit item</v-card-title>
        <v-card-text>
          <v-form ref="editForm" @submit.prevent="submitEditItem">
            <v-text-field v-model="editTitle" label="Todo title" :rules="titleRules" />
            <v-alert v-if="editError" type="error" class="mb-2">{{ editError }}</v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="save-todo-btn"
            :loading="editing"
            @click="submitEditItem"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteItemDialog" contained max-width="480">
      <v-card>
        <v-card-title>Delete item</v-card-title>
        <v-card-text>Delete {{ todoBeingDeleted?.title }}?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteItemDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            data-testid="confirm-delete-todo-btn"
            :loading="deletingItem"
            @click="confirmDeleteItem"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
