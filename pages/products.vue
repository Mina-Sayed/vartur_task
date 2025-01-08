<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1>Products</h1>
        <v-btn color="primary" @click="openCreateDialog">
          Add Product
        </v-btn>
      </v-col>
    </v-row>

    <!-- Products List -->
    <v-table>
      <thead>
        <tr>
          <th>Picture</th>
          <th>Name</th>
          <th>Category</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in products" :key="item.id">
          <td>
            <v-avatar size="48">
              <v-img :src="item.picture" />
            </v-avatar>
          </td>
          <td>{{ item.name }}</td>
          <td>
            <div class="category-path">
              {{ getCategoryPath(item.category) }}
            </div>
          </td>
          <td>
            <v-btn icon="mdi-pencil" size="small" variant="text" @click="editItem(item)" />
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(item)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Product Form Dialog -->
    <FormDialog
      v-model="dialog"
      :title="editedItem.id ? 'Edit Product' : 'New Product'"
      @save="save"
    >
      <v-form ref="form" @submit.prevent="save">
        <v-text-field
          v-model="editedItem.name"
          label="Name"
          required
        />

        <v-select
          v-model="editedItem.categoryId"
          :items="categories"
          item-title="name"
          item-value="id"
          label="Category"
          required
        >
          <template #item="{ item }">
            <v-list-item :title="getCategoryPath(item.raw as unknown as Category)" />
          </template>
          <template #selection="{ item }">
            {{ getCategoryPath(categories.find(c => c.id === editedItem.categoryId) || null) }}
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
      title="Delete Product"
      item-type="product"
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
}

interface Product {
  id: number;
  name: string;
  picture: string;
  categoryId: number;
  category: Category;
}

interface EditedItem {
  id: number | null;
  name: string;
  categoryId: number | null;
  pictureFile: File | null;
  picture: string;
}

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const dialog = ref(false);
const deleteDialog = ref(false);
const form = ref(null);
const imagePreview = ref<string | null>(null);

const editedItem = ref<EditedItem>({
  id: null,
  name: '',
  categoryId: null,
  pictureFile: null,
  picture: ''
});

const itemToDelete = ref<Product | null>(null);

// Fetch products
async function fetchProducts() {
  try {
    const response = await fetch('/api/products');
    products.value = await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

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
    categoryId: null,
    pictureFile: null,
    picture: ''
  };
  imagePreview.value = null;
  dialog.value = true;
}

function editItem(item: Product) {
  editedItem.value = {
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
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
    categoryId: null,
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
      categoryId: editedItem.value.categoryId,
      pictureFile: editedItem.value.pictureFile
    });

    // Validate required fields
    if (!editedItem.value.name.trim()) {
      alert('Name is required');
      return;
    }

    if (editedItem.value.categoryId === null) {
      alert('Category is required');
      return;
    }

    // Validate picture for new products
    if (!editedItem.value.id && !editedItem.value.pictureFile) {
      alert('Picture is required for new products');
      return;
    }

    // Create FormData
    const formData = new FormData();
    formData.append('name', editedItem.value.name);
    formData.append('categoryId', String(editedItem.value.categoryId));
    if (editedItem.value.pictureFile) {
      formData.append('picture', editedItem.value.pictureFile);
    }

    // Send request
    const url = editedItem.value.id 
      ? `/api/products/${editedItem.value.id}`
      : '/api/products';
    
    const method = editedItem.value.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save product');
    }

    // Refresh products list
    await fetchProducts();
    closeDialog();
  } catch (error) {
    console.error('Error saving product:', error);
    alert(error instanceof Error ? error.message : 'Failed to save product');
  }
}

async function confirmDelete(item: Product) {
  itemToDelete.value = item;
  deleteDialog.value = true;
}

async function deleteItem() {
  if (!itemToDelete.value) return;

  try {
    const response = await fetch(`/api/products/${itemToDelete.value.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product');
    }

    await fetchProducts();
    deleteDialog.value = false;
    itemToDelete.value = null;
  } catch (error) {
    console.error('Error deleting product:', error);
    alert(error instanceof Error ? error.message : 'Failed to delete product');
  }
}

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchCategories()
  ]);
});
</script>

<style scoped>
.category-path {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 