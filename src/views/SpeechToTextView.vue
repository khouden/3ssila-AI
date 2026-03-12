<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import { useI18n } from "../composables/useI18n";
import {
  Mic,
  MicOff,
  Loader2,
  Copy,
  Download,
  Trash2,
  Languages,
  ChevronDown,
  Search,
} from "lucide-vue-next";
import { speechToText, stopSpeechToText } from "../services/speech";
import type { SpeechRecognizer } from "microsoft-cognitiveservices-speech-sdk";
import { exportResult, type ExportFormat } from "../services/export";
import { toast } from "../stores/toast";

const { t } = useI18n();

// --- Languages with country codes for flag icons ---
const languages = [
  { name: "French", code: "fr" },
  { name: "English", code: "gb" },
  { name: "Spanish", code: "es" },
  { name: "German", code: "de" },
  { name: "Italian", code: "it" },
  { name: "Portuguese", code: "pt" },
  { name: "Chinese", code: "cn" },
  { name: "Japanese", code: "jp" },
  { name: "Korean", code: "kr" },
  { name: "Arabic", code: "sa" },
  { name: "Hindi", code: "in" },
  { name: "Russian", code: "ru" },
  { name: "Dutch", code: "nl" },
  { name: "Polish", code: "pl" },
  { name: "Swedish", code: "se" },
  { name: "Norwegian", code: "no" },
  { name: "Danish", code: "dk" },
  { name: "Finnish", code: "fi" },
  { name: "Greek", code: "gr" },
  { name: "Turkish", code: "tr" },
  { name: "Vietnamese", code: "vn" },
  { name: "Thai", code: "th" },
  { name: "Indonesian", code: "id" },
  { name: "Malay", code: "my" },
  { name: "Czech", code: "cz" },
  { name: "Romanian", code: "ro" },
  { name: "Hungarian", code: "hu" },
  { name: "Ukrainian", code: "ua" },
  { name: "Bengali", code: "bd" },
  { name: "Urdu", code: "pk" },
  { name: "Swahili", code: "ke" },
];

// --- State ---
const selectedLanguage = ref("French");
const isLanguageDropdownOpen = ref(false);
const langSearch = ref("");
const isListening = ref(false);
const transcriptText = ref("");
const interimText = ref("");
const errorMessage = ref("");
const isExportOpen = ref(false);
let recognizer: SpeechRecognizer | null = null;

const selectedLangObj = computed(() =>
  languages.find((l) => l.name === selectedLanguage.value),
);

const filteredLanguages = computed(() => {
  if (!langSearch.value) return languages;
  const q = langSearch.value.toLowerCase();
  return languages.filter((l) => l.name.toLowerCase().includes(q));
});

const hasTranscript = computed(() => transcriptText.value.trim().length > 0);

const displayText = computed(() => {
  if (interimText.value) {
    return transcriptText.value
      ? transcriptText.value + " " + interimText.value
      : interimText.value;
  }
  return transcriptText.value;
});

// --- Actions ---
const toggleRecording = () => {
  if (isListening.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const startRecording = () => {
  errorMessage.value = "";
  interimText.value = "";

  recognizer = speechToText(selectedLanguage.value, {
    onRecognizing: (text: string) => {
      interimText.value = text;
    },
    onRecognized: (text: string) => {
      transcriptText.value = transcriptText.value
        ? transcriptText.value + " " + text
        : text;
      interimText.value = "";
    },
    onError: (error: string) => {
      errorMessage.value = error;
      isListening.value = false;
    },
    onSessionStopped: () => {
      isListening.value = false;
    },
  });

  if (recognizer) {
    isListening.value = true;
  }
};

const stopRecording = () => {
  if (recognizer) {
    stopSpeechToText(recognizer);
    recognizer = null;
  }
  isListening.value = false;
  interimText.value = "";
};

const clearTranscript = () => {
  transcriptText.value = "";
  interimText.value = "";
  errorMessage.value = "";
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(transcriptText.value);
    toast.show(t.value.common.copiedToClipboard, "success");
  } catch {
    toast.show(t.value.common.error, "error");
  }
};

const handleExport = (format: ExportFormat) => {
  exportResult(
    t.value.speechToText.title,
    transcriptText.value,
    transcriptText.value,
    format,
  );
  isExportOpen.value = false;
};

onBeforeUnmount(() => {
  if (recognizer) {
    stopSpeechToText(recognizer);
    recognizer = null;
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-[#121212] pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden"
  >
    <!-- Background decoration -->
    <div
      class="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
      style="
        background-image: radial-gradient(circle, #06b6d4 1px, transparent 1px);
        background-size: 24px 24px;
      "
    ></div>

    <div class="max-w-3xl mx-auto relative">
      <!-- Header -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 mb-4"
        >
          <Mic class="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <h1
          class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {{ t.speechToText.title }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
          {{ t.speechToText.subtitle }}
        </p>
      </div>

      <!-- Main Card -->
      <div
        class="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        <!-- Language Selector & Controls -->
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800"
        >
          <!-- Language Dropdown -->
          <div class="relative w-full sm:w-auto">
            <label
              class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5"
            >
              <Languages class="w-3.5 h-3.5 inline mr-1" />
              {{ t.speechToText.language }}
            </label>
            <button
              @click="isLanguageDropdownOpen = !isLanguageDropdownOpen"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer min-w-[180px]"
            >
              <span
                v-if="selectedLangObj"
                :class="`fi fi-${selectedLangObj.code} fis rounded-sm`"
              ></span>
              <span
                class="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {{ selectedLanguage }}
              </span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 ml-auto transition-transform"
                :class="{ 'rotate-180': isLanguageDropdownOpen }"
              />
            </button>

            <Transition
              enter-active-class="transition ease-out duration-150"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-if="isLanguageDropdownOpen"
                class="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-[#252525] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
              >
                <div class="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div class="relative">
                    <Search
                      class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    />
                    <input
                      v-model="langSearch"
                      type="text"
                      :placeholder="t.common.search"
                      class="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                </div>
                <div class="max-h-56 overflow-y-auto p-1">
                  <button
                    v-for="lang in filteredLanguages"
                    :key="lang.name"
                    @mousedown.prevent="
                      selectedLanguage = lang.name;
                      isLanguageDropdownOpen = false;
                      langSearch = '';
                    "
                    class="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer"
                    :class="
                      selectedLanguage === lang.name
                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    "
                  >
                    <span :class="`fi fi-${lang.code} fis rounded-sm`"></span>
                    {{ lang.name }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Clear button -->
          <button
            v-if="hasTranscript"
            @click="clearTranscript"
            class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 class="w-4 h-4" />
            {{ t.speechToText.clear }}
          </button>
        </div>

        <!-- Mic Button Area -->
        <div class="flex flex-col items-center justify-center py-10 px-5">
          <!-- Mic Button -->
          <button
            @click="toggleRecording"
            class="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer focus:outline-none"
            :class="
              isListening
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 scale-110'
                : 'bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/30'
            "
          >
            <!-- Pulse animation when listening -->
            <div
              v-if="isListening"
              class="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"
            ></div>
            <MicOff
              v-if="isListening"
              class="w-10 h-10 text-white relative z-10"
            />
            <Mic v-else class="w-10 h-10 text-white relative z-10" />
          </button>

          <p
            class="mt-4 text-sm font-medium"
            :class="
              isListening
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
            "
          >
            {{
              isListening
                ? t.speechToText.listening
                : t.speechToText.clickToStart
            }}
          </p>

          <!-- Error Message -->
          <p
            v-if="errorMessage"
            class="mt-3 text-sm text-red-500 dark:text-red-400 text-center max-w-md"
          >
            {{ errorMessage }}
          </p>
        </div>

        <!-- Transcript Area -->
        <div
          v-if="displayText || isListening"
          class="border-t border-gray-100 dark:border-gray-800"
        >
          <div class="p-5">
            <div class="flex items-center justify-between mb-3">
              <h3
                class="text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                {{ t.speechToText.transcript }}
              </h3>
              <div class="flex items-center gap-2">
                <!-- Copy -->
                <button
                  v-if="hasTranscript"
                  @click="copyToClipboard"
                  class="p-2 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer"
                  :title="t.speechToText.copy"
                >
                  <Copy class="w-4 h-4" />
                </button>

                <!-- Export Dropdown -->
                <div v-if="hasTranscript" class="relative">
                  <button
                    @click="isExportOpen = !isExportOpen"
                    class="p-2 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors cursor-pointer"
                    :title="t.speechToText.export"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <Transition
                    enter-active-class="transition ease-out duration-150"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition ease-in duration-100"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-1"
                  >
                    <div
                      v-if="isExportOpen"
                      class="absolute right-0 top-full mt-1 bg-white dark:bg-[#252525] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[120px]"
                    >
                      <button
                        @mousedown.prevent="handleExport('txt')"
                        class="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        .txt
                      </button>
                      <button
                        @mousedown.prevent="handleExport('pdf')"
                        class="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        .pdf
                      </button>
                      <button
                        @mousedown.prevent="handleExport('docx')"
                        class="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        .docx
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>

            <!-- Transcript Content -->
            <div
              class="min-h-[120px] max-h-[400px] overflow-y-auto rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 p-4"
            >
              <p
                v-if="displayText"
                class="text-gray-800 dark:text-gray-200 text-base leading-relaxed whitespace-pre-wrap"
              >
                {{ transcriptText
                }}<span
                  v-if="interimText"
                  class="text-gray-400 dark:text-gray-500 italic"
                  >{{ transcriptText ? " " : "" }}{{ interimText }}</span
                >
              </p>
              <div
                v-else-if="isListening"
                class="flex items-center gap-2 text-gray-400 dark:text-gray-500"
              >
                <Loader2 class="w-4 h-4 animate-spin" />
                <span class="text-sm">{{
                  t.speechToText.waitingForSpeech
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="border-t border-gray-100 dark:border-gray-800 p-8 text-center"
        >
          <Mic
            class="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3"
          />
          <p class="text-gray-400 dark:text-gray-500 text-sm">
            {{ t.speechToText.emptyState }}
          </p>
        </div>
      </div>

      <!-- Note -->
      <p
        class="mt-4 text-xs text-center text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1"
      >
        {{ t.speechToText.note }}
      </p>
    </div>
  </div>
</template>
