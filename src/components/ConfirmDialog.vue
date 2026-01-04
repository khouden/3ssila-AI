<script setup lang="ts">
import { confirm } from "../stores/confirm";

const getConfirmButtonClasses = () => {
  const baseClasses =
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";

  const typeClasses = {
    danger: "bg-red-500 text-white hover:bg-red-600",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600",
    info: "bg-cyan-500 text-white hover:bg-cyan-600",
  };

  return `${baseClasses} ${typeClasses[confirm.type]}`;
};

const getIcon = () => {
  const icons = {
    danger: "🗑️",
    warning: "⚠️",
    info: "ℹ️",
  };
  return icons[confirm.type];
};

const handleConfirm = () => {
  confirm.close(true);
};

const handleCancel = () => {
  confirm.close(false);
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleCancel();
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="confirm.isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Dialog -->
        <Transition name="scale">
          <div
            v-if="confirm.isOpen"
            class="relative bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
          >
            <!-- Icon -->
            <div class="flex justify-center mb-4">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                :class="{
                  'bg-red-100 dark:bg-red-900/30': confirm.type === 'danger',
                  'bg-yellow-100 dark:bg-yellow-900/30':
                    confirm.type === 'warning',
                  'bg-cyan-100 dark:bg-cyan-900/30': confirm.type === 'info',
                }"
              >
                {{ getIcon() }}
              </div>
            </div>

            <!-- Title -->
            <h3
              class="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2"
            >
              {{ confirm.title }}
            </h3>

            <!-- Message -->
            <p class="text-center text-gray-600 dark:text-gray-400 mb-6">
              {{ confirm.message }}
            </p>

            <!-- Actions -->
            <div class="flex gap-3 justify-center">
              <button
                @click="handleCancel"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {{ confirm.cancelText }}
              </button>
              <button @click="handleConfirm" :class="getConfirmButtonClasses()">
                {{ confirm.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
