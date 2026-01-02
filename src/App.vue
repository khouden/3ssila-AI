<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue' // Import the new component
</script>

<template>
<AppHeader />

  <main>
    <RouterView />
  </main>
</template>

<style scoped>
nav {padding : 1rem;}
</style>
