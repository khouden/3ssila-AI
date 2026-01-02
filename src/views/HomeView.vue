<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { auth } from "../stores/auth";

const router = useRouter();

// --- State ---
const inputText = ref("");
const resultText = ref("");
const mode = ref<"translate" | "summarize">("translate");
const targetLanguage = ref("French");
const isLoading = ref(false);
const WORD_LIMIT = 250;

// --- Computed ---
const wordCount = computed(() => {
  return inputText.value.trim()
    ? inputText.value.trim().split(/\s+/).length
    : 0;
});

const resultWordCount = computed(() => {
  return resultText.value.trim()
    ? resultText.value.trim().split(/\s+/).length
    : 0;
});

// --- Methods ---
const handleSubmit = async () => {
  if (!inputText.value) return;

  isLoading.value = true;
  resultText.value = ""; // Clear previous result

  try {
    let response;
    if (mode.value === "translate") {
      response = await api.translateText(inputText.value, targetLanguage.value);
    } else {
      response = await api.summarizeText(inputText.value);
    }

    const data = response?.data || {};
    const extracted =
      mode.value === "translate"
        ? data.translation ||
          data.translated_text ||
          data.result ||
          data.output ||
          data.response ||
          ""
        : data.summary ||
          data.summary_text ||
          data.result ||
          data.output ||
          data.response ||
          "";

    resultText.value = extracted || "No result returned.";
  } catch (error: any) {
    console.error(error);
    const detail =
      error?.response?.data?.detail ||
      error?.message ||
      "Error: Could not process text. Please try again.";
    resultText.value = detail;
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = () => {
  if (resultText.value) {
    navigator.clipboard.writeText(resultText.value);
    alert("Copied to clipboard!");
  }
};

const goToSignup = () => {
  router.push("/signup");
};
</script>

<template>
  <div
    class="min-h-screen bg-white dark:bg-slate-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff09_1px,transparent_1px),linear-gradient(to_bottom,#ffffff09_1px,transparent_1px)] bg-[size:24px_24px]"
  >
    <div class="text-center pt-12 pb-8 px-4">
      <h1
        class="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight"
      >
        {{ mode === "translate" ? "Translate Content" : "Summarize Text" }}
      </h1>
      <p class="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 text-lg">
        Transform your content instantly with our AI-powered tool. Select your
        mode below to get started.
      </p>
    </div>

    <div class="max-w-6xl mx-auto px-4 pb-20">
      <div
        class="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]"
      >
        <div
          class="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#252525] px-4 py-3 gap-4"
        >
          <div
            class="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-full"
          >
            <button
              @click="mode = 'translate'"
              :class="
                mode === 'translate'
                  ? 'bg-white dark:bg-gray-700 shadow text-cyan-400 font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              "
              class="px-6 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer"
            >
              Translate
            </button>
            <button
              @click="mode = 'summarize'"
              :class="
                mode === 'summarize'
                  ? 'bg-white dark:bg-gray-700 shadow text-cyan-400 font-bold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              "
              class="px-6 py-2 rounded-full text-sm transition-all duration-200 cursor-pointer"
            >
              Summarize
            </button>
          </div>

          <div v-if="mode === 'translate'" class="flex items-center gap-2">
            <label class="text-sm text-gray-500 dark:text-gray-400 font-medium"
              >Target:</label
            >
            <div class="relative">
              <select
                v-model="targetLanguage"
                class="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="French">🇫🇷 French</option>
                <option value="English">🇬🇧 English</option>
                <option value="Spanish">🇪🇸 Spanish</option>
                <option value="German">🇩🇪 German</option>
                <option value="Italian">🇮🇹 Italian</option>
                <option value="Portuguese">🇵🇹 Portuguese</option>
                <option value="Chinese">🇨🇳 Chinese</option>
                <option value="Japanese">🇯🇵 Japanese</option>
                <option value="Korean">🇰🇷 Korean</option>
                <option value="Arabic">🇸🇦 Arabic</option>
                <option value="Hindi">🇮🇳 Hindi</option>
                <option value="Russian">🇷🇺 Russian</option>
              </select>
              <div
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"
              >
                <svg
                  class="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 flex flex-col md:flex-row min-h-0">
          <div
            class="flex-1 p-6 flex flex-col relative border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a]"
          >
            <textarea
              v-model="inputText"
              placeholder="Insert your text here..."
              class="w-full flex-1 resize-none outline-none text-gray-700 dark:text-gray-300 text-lg bg-transparent placeholder-gray-400 leading-relaxed"
            ></textarea>

            <div class="mt-4 flex items-center justify-between relative z-10">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-400"
                  >{{ wordCount }} words</span
                >
                <span
                  v-if="!auth.isAuthenticated()"
                  @click="goToSignup"
                  title="Sign up to have unlimited tries"
                  class="text-xs font-medium text-orange-500 hover:text-orange-600 cursor-pointer underline decoration-dotted"
                >
                  / {{ WORD_LIMIT }} limit
                </span>
              </div>
              <button
                @click="handleSubmit"
                :disabled="isLoading || !inputText"
                class="bg-cyan-400 hover:bg-cyan-300 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-bold py-2.5 px-8 rounded-full shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <svg
                  v-if="isLoading"
                  class="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span v-else>
                  {{
                    mode === "translate" ? "Translate Text" : "Summarize Text"
                  }}
                </span>
              </button>
            </div>
          </div>

          <div
            class="flex-1 p-6 bg-gray-50 dark:bg-[#202020] flex flex-col relative"
          >
            <div
              class="absolute top-4 left-6 text-xs font-bold text-gray-400 uppercase tracking-wider"
            >
              Result
            </div>

            <div
              v-if="!resultText && !isLoading"
              class="flex-1 flex items-center justify-center text-gray-400 italic"
            >
              <p>Paraphrased text will appear here</p>
            </div>

            <div
              v-else
              class="flex-1 mt-6 overflow-y-auto prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-relaxed custom-scrollbar"
            >
              {{ resultText }}
            </div>

            <div
              class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <span class="text-xs font-medium text-gray-400"
                >{{ resultWordCount }} words</span
              >

              <button
                v-if="resultText"
                @click="copyToClipboard"
                class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-cyan-600 transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  ></path>
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for the text areas */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
</style>
