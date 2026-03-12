<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import AppFooter from "./components/AppFooter.vue";
import ToastNotification from "./components/ToastNotification.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import { Star } from "lucide-vue-next";

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith("/admin"));
const isFavoritesPage = computed(() => route.path === "/favorites");
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <AppHeader v-if="!isAdminRoute" />

    <main class="flex-1">
      <RouterView />
    </main>

    <!-- Floating Favorites Button -->
    <RouterLink
      v-if="!isAdminRoute && !isFavoritesPage"
      to="/favorites"
      class="fixed right-4 bottom-20 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 group"
      aria-label="Favorites"
    >
      <Star class="w-5 h-5 fill-white" />
      <span class="absolute right-full mr-2 px-2 py-1 rounded-lg bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Favorites
      </span>
    </RouterLink>

    <AppFooter v-if="!isAdminRoute" />
    <ToastNotification />
    <ConfirmDialog />
  </div>
</template>

<style scoped>
nav {
  padding: 1rem;
}
</style>
