<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { auth } from "../stores/auth";

const router = useRouter();

// --- Theme Toggle Logic ---
const isDark = ref(true);

// --- Mobile Menu Logic ---
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleLogout = () => {
  auth.clearAuth();
  router.push("/login");
  closeMobileMenu();
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
  closeMobileMenu();
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
        <!-- Logo -->
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

        <!-- Desktop Navigation -->
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
        </nav>

        <!-- Desktop Actions -->
        <div class="hidden md:flex items-center space-x-4">
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

        <!-- Mobile Menu Button & Theme Toggle -->
        <div class="md:hidden flex items-center gap-3">
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

          <!-- Hamburger Button -->
          <button
            @click="toggleMobileMenu"
            class="p-2 rounded-md focus:outline-none cursor-pointer"
            :class="
              isDark
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-black'
            "
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                v-if="!isMobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-screen"
      leave-from-class="opacity-100 max-h-screen"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden border-t overflow-hidden"
        :class="isDark ? 'border-gray-800' : 'border-gray-200'"
      >
        <div class="px-4 pt-2 pb-4 space-y-3">
          <!-- User Info (if authenticated) -->
          <div
            v-if="auth.isAuthenticated()"
            class="py-3 border-b"
            :class="isDark ? 'border-gray-800' : 'border-gray-200'"
          >
            <span
              class="text-sm font-semibold block"
              :class="isDark ? 'text-white' : 'text-gray-900'"
            >
              {{ auth.user?.name || "User" }}
            </span>
          </div>

          <!-- Navigation Links -->
          <RouterLink
            to="/"
            @click="closeMobileMenu"
            class="block py-2 px-3 text-base font-medium rounded-md transition-colors"
            :class="
              isDark
                ? 'text-cyan-400 hover:bg-gray-800'
                : 'text-blue-600 hover:bg-gray-100'
            "
          >
            Home
          </RouterLink>

          <RouterLink
            v-if="auth.isAuthenticated()"
            to="/history"
            @click="closeMobileMenu"
            class="block py-2 px-3 text-base font-medium rounded-md transition-colors"
            :class="
              isDark
                ? 'text-gray-300 hover:bg-gray-800 hover:text-cyan-400'
                : 'text-gray-600 hover:bg-gray-100 hover:text-cyan-400'
            "
          >
            History
          </RouterLink>

          <!-- Auth Actions -->
          <div class="pt-3 space-y-2">
            <template v-if="auth.isAuthenticated()">
              <button
                @click="handleLogout"
                class="w-full px-4 py-2 text-sm font-medium rounded-md border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
              >
                Log out
              </button>
            </template>

            <template v-else>
              <RouterLink
                to="/login"
                @click="closeMobileMenu"
                class="block w-full px-4 py-2 text-sm font-medium rounded-md border transition-colors text-center"
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
                @click="closeMobileMenu"
                class="block w-full px-5 py-2 text-sm font-bold rounded-md bg-cyan-400 text-black hover:bg-cyan-300 transition-colors text-center"
              >
                Sign up
              </RouterLink>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
