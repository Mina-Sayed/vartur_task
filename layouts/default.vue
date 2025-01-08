<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>
        <NuxtLink to="/" class="text-decoration-none text-black">
          Vartur Task
        </NuxtLink>
      </v-app-bar-title>

      <v-spacer />

      <v-btn to="/" variant="text">
        Dashboard
      </v-btn>
      <v-btn to="/categories" variant="text">
        Categories
      </v-btn>
      <v-btn to="/products" variant="text">
        Products
      </v-btn>
    </v-app-bar>

    <v-main>
      <v-container>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script> 