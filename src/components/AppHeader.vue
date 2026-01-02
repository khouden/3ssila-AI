<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { auth } from "../stores/auth";

const router = useRouter();

// --- Theme Toggle Logic ---
const isDark = ref(true);

const handleLogout = () => {
  auth.clearAuth();
  router.push("/login");
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
};

const goHome = () => {
  router.push("/");
};

// Initialize theme on load
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (savedTheme === "dark" || (!savedTheme && systemDark)) {
    isDark.value = true;
    document.documentElement.classList.add("dark");
  } else {
    isDark.value = false;
    document.documentElement.classList.remove("dark");
  }
});
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b transition-colors duration-300"
    :class="
      isDark ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-200'
    "
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div
          class="flex-shrink-0 flex items-center gap-2 cursor-pointer"
          @click="goHome"
        >
          <img
            :src="isDark ? '/img/logo/logo_dark.png' : '/img/logo/logo.png'"
            alt="3ssila AI"
            class="w-8 h-8 object-contain"
          />

          <span
            class="font-bold text-xl tracking-wide"
            :class="isDark ? 'text-white' : 'text-gray-900'"
          >
            3ssila <span class="text-cyan-400">AI</span>
          </span>
        </div>

        <nav class="hidden md:flex space-x-8 items-center">
          <RouterLink
            to="/"
            class="text-sm font-medium transition-colors hover:text-cyan-400"
            :class="isDark ? 'text-cyan-400' : 'text-blue-600'"
          >
            Home
          </RouterLink>

          <RouterLink
            v-if="auth.isAuthenticated()"
            to="/history"
            class="text-sm font-medium transition-colors hover:text-cyan-400"
            :class="
              isDark
                ? 'text-gray-300 hover:text-cyan-400'
                : 'text-gray-600 hover:text-cyan-400'
            "
          >
            History
          </RouterLink>

          <!-- <a href="#" class="text-sm font-medium transition-colors hover:text-cyan-400"
            :class="isDark ? 'text-gray-300' : 'text-gray-600'">
            Pricing
          </a> -->

          <!-- <div class="relative group">
            <button class="flex items-center gap-1 text-sm font-medium transition-colors hover:text-cyan-400"
              :class="isDark ? 'text-gray-300' : 'text-gray-600'">
              Example
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div class="absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Option 1</a>
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Option 2</a>
            </div>
          </div> -->
        </nav>

        <div class="flex items-center space-x-4">
          <template v-if="auth.isAuthenticated()">
            <div class="hidden sm:flex flex-col items-end mr-2">
              <span
                class="text-sm font-semibold"
                :class="isDark ? 'text-white' : 'text-gray-900'"
              >
                {{ auth.user?.name || "User" }}
              </span>
            </div>

            <button
              @click="handleLogout"
              class="px-4 py-2 text-sm font-medium rounded-md border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            >
              Log out
            </button>
          </template>

          <template v-else>
            <RouterLink
              to="/login"
              class="px-4 py-2 text-sm font-medium rounded-md border transition-colors"
              :class="
                isDark
                  ? 'border-gray-600 text-gray-300 hover:text-white hover:border-gray-400'
                  : 'border-gray-300 text-gray-700 hover:text-black hover:border-gray-400'
              "
            >
              Log in
            </RouterLink>

            <RouterLink
              to="/signup"
              class="relative px-5 py-2 text-sm font-bold rounded-md bg-cyan-400 text-black hover:bg-cyan-300 transition-colors"
            >
              Sign up
            </RouterLink>
          </template>

          <div class="h-6 w-px bg-gray-700"></div>

          <button
            @click="toggleTheme"
            class="p-2 rounded-full transition-colors focus:outline-none cursor-pointer"
            :class="
              isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-black'
            "
          >
            <svg
              v-if="isDark"
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>

            <svg
              v-else
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
