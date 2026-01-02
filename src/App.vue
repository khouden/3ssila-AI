<script setup lang="ts">
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import ToastNotification from "./components/ToastNotification.vue";
</script>

<template>
  <AppHeader />

  <main>
    <RouterView />
  </main>

  <ToastNotification />
</template>

<style scoped>
nav {
  padding: 1rem;
}
</style>
