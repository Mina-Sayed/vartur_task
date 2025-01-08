<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1>Categories</h1>
        <v-btn color="primary" @click="openCreateDialog">
          Add Category
        </v-btn>
      </v-col>
    </v-row>

    <!-- Categories List -->
    <v-table>
      <thead>
        <tr>
          <th>Picture</th>
          <th>Name</th>
          <th>Parent</th>
          <th>Products</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in categories" :key="item.id">
          <td>
            <v-avatar size="48">
              <v-img :src="item.picture" />
            </v-avatar>
          </td>
          <td>{{ item.name }}</td>
          <td>{{ item.parent?.name || '-' }}</td>
          <td>{{ item.productCount }}</td>
          <td>
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editItem(item)" />
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Category Form Dialog -->
    <FormDialog
      v-model="dialog"
      :title="editedItem.id ? 'Edit Category' : 'New Category'"
      @save="save"
    >
      <v-form ref="form" @submit.prevent="save">
        <v-text-field
          v-model="editedItem.name"
          label="Name"
          required
        />

        <v-select
          v-model="editedItem.parentId"
          :items="availableParents"
          item-title="name"
          item-value="id"
          label="Parent Category"
          clearable
        >
          <template #item="{ item }">
            <v-list-item :title="getCategoryPath(item.raw as unknown as Category)" />
          </template>
          <template #selection="{ item }">
            {{ getCategoryPath(categories.find(c => c.id === editedItem.parentId) || null) }}
          </template>
        </v-select>

        <v-file-input
          v-model="editedItem.pictureFile"
          label="Picture"
          accept="image/*"
          :required="!editedItem.id"
          @update:model-value="handleFileChange"
        />

        <!-- Image Preview -->
        <v-img
          v-if="imagePreview || editedItem.picture"
          :src="imagePreview || editedItem.picture"
          max-height="200"
          contain
          class="mt-4"
        />
      </v-form>
    </FormDialog>

    <!-- Delete Confirmation -->
    <DeleteConfirmDialog
      v-model="deleteDialog"
      title="Delete Category"
      item-type="category"
      @confirm="deleteItem"
    />
  </div>
</template>

<script setup lang="ts">
import FormDialog from '~/components/FormDialog.vue';
import DeleteConfirmDialog from '~/components/DeleteConfirmDialog.vue';

interface Category {
  id: number;
  name: string;
  picture: string;
  parentId: number | null;
  parent?: Category;
  productCount: number;
}

interface EditedItem {
  id: number | null;
  name: string;
  parentId: number | null;
  pictureFile: File | null;
  picture: string;
}

const categories = ref<Category[]>([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const form = ref(null);
const imagePreview = ref<string | null>(null);

const editedItem = ref<EditedItem>({
  id: null,
  name: '',
  parentId: null,
  pictureFile: null,
  picture: ''
});

const itemToDelete = ref<Category | null>(null);

// Computed property to filter out invalid parent categories
const availableParents = computed(() => {
  if (!editedItem.value.id) {
    return categories.value;
  }
  // When editing, exclude self and children from parent options
  return categories.value.filter(category => {
    if (category.id === editedItem.value.id) return false;
    let current = category;
    while (current.parentId) {
      if (current.parentId === editedItem.value.id) return false;
      current = categories.value.find(c => c.id === current.parentId)!;
    }
    return true;
  });
});

// Fetch categories
async function fetchCategories() {
  try {
    const response = await fetch('/api/categories');
    categories.value = await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

// Get category path
function getCategoryPath(category: Category | null): string {
  if (!category) return '';
  
  const path = [];
  let current: Category | undefined = category;
  
  while (current) {
    path.unshift(current.name);
    current = current.parent;
  }
  
  return path.join(' > ');
}

function handleFileChange(files: File | File[] | null) {
  const file = Array.isArray(files) ? files[0] : files;
  if (file) {
    imagePreview.value = URL.createObjectURL(file);
    editedItem.value.pictureFile = file;
  } else {
    imagePreview.value = null;
    editedItem.value.pictureFile = null;
  }
}

function openCreateDialog() {
  editedItem.value = {
    id: null,
    name: '',
    parentId: null,
    pictureFile: null,
    picture: ''
  };
  imagePreview.value = null;
  dialog.value = true;
}

function editItem(item: Category) {
  editedItem.value = {
    id: item.id,
    name: item.name,
    parentId: item.parentId,
    pictureFile: null,
    picture: item.picture
  };
  imagePreview.value = null;
  dialog.value = true;
}

function closeDialog() {
  dialog.value = false;
  editedItem.value = {
    id: null,
    name: '',
    parentId: null,
    pictureFile: null,
    picture: ''
  };
  imagePreview.value = null;
}

async function save() {
  try {
    // Log values for debugging
    console.log('Saving with values:', {
      name: editedItem.value.name,
      parentId: editedItem.value.parentId,
      pictureFile: editedItem.value.pictureFile
    });

    // Validate required fields
    if (!editedItem.value.name.trim()) {
      alert('Name is required');
      return;
    }

    // Validate picture for new categories
    if (!editedItem.value.id && !editedItem.value.pictureFile) {
      alert('Picture is required for new categories');
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('name', editedItem.value.name);
    if (editedItem.value.parentId !== null) {
      formData.append('parentId', String(editedItem.value.parentId));
    }
    if (editedItem.value.pictureFile) {
      formData.append('picture', editedItem.value.pictureFile);
    }

    // Send request
    const url = editedItem.value.id 
      ? `/api/categories/${editedItem.value.id}`
      : '/api/categories';
    
    const method = editedItem.value.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save category');
    }

    // Refresh categories list
    await fetchCategories();
    closeDialog();
  } catch (error) {
    console.error('Error saving category:', error);
    alert(error instanceof Error ? error.message : 'Failed to save category');
  }
}

async function confirmDelete(item: Category) {
  itemToDelete.value = item;
  deleteDialog.value = true;
}

async function deleteItem() {
  if (!itemToDelete.value) return;

  try {
    const response = await fetch(`/api/categories/${itemToDelete.value.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }

    await fetchCategories();
    deleteDialog.value = false;
    itemToDelete.value = null;
  } catch (error) {
    console.error('Error deleting category:', error);
    alert(error instanceof Error ? error.message : 'Failed to delete category');
  }
}

// Fetch data on mount
onMounted(async () => {
  await fetchCategories();
});
</script> 