<script setup lang="ts">
import { toast } from "../stores/toast";

const getToastClasses = (type: string) => {
  const baseClasses =
    "px-6 py-4 rounded-lg shadow-lg text-white flex items-center justify-between gap-4 min-w-[300px] max-w-[500px] animate-slide-in";

  const typeClasses = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return `${baseClasses} ${
    typeClasses[type as keyof typeof typeClasses] || typeClasses.info
  }`;
};

const getIcon = (type: string) => {
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };
  return icons[type as keyof typeof icons] || icons.info;
};
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <div v-for="t in toast.toasts" :key="t.id" :class="getToastClasses(t.type)">
      <div class="flex items-center gap-3">
        <span class="text-2xl font-bold">{{ getIcon(t.type) }}</span>
        <span class="font-medium">{{ t.message }}</span>
      </div>
      <button
        @click="toast.remove(t.id)"
        class="text-white hover:text-gray-200 text-xl font-bold"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
