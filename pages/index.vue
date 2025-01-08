<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Categories</span>
              <v-btn color="primary" to="/categories">
                Manage Categories
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-treeview
                :items="categoriesTree"
                item-children="children"
                item-text="name"
                open-all
              >
                <template #prepend="{ item }">
                  <v-avatar size="32">
                    <v-img :src="item.picture" />
                  </v-avatar>
                </template>
                <template #append="{ item }">
                  <v-chip size="small" color="primary" variant="outlined">
                    {{ item.productCount }} products
                  </v-chip>
                </template>
              </v-treeview>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Products</span>
              <v-btn color="primary" to="/products">
                Manage Products
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="product in products"
                  :key="product.id"
                  :title="product.name"
                  :subtitle="getCategoryPath(product.category)"
                >
                  <template #prepend>
                    <v-avatar size="48">
                      <v-img :src="product.picture" />
                    </v-avatar>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
interface Category {
  id: number;
  name: string;
  picture: string;
  parentId: number | null;
  parent?: Category;
  productCount: number;
  children?: Category[];
}

interface Product {
  id: number;
  name: string;
  picture: string;
  categoryId: number;
  category: Category;
}

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);

// Computed property to create tree structure
const categoriesTree = computed(() => {
  const tree: Category[] = [];
  const map = new Map<number, Category>();

  // First pass: create map of categories
  categories.value.forEach(category => {
    map.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree structure
  map.forEach(category => {
    if (category.parentId === null) {
      tree.push(category);
    } else {
      const parent = map.get(category.parentId);
      if (parent) {
        parent.children?.push(category);
      }
    }
  });

  return tree;
});

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

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchCategories()
  ]);
});
</script> 